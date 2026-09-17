"""Order service - handles order markdown, AI analysis, and PDF downloads from Indian Kanoon."""

import json
import re
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.clients.gemini_client import gemini_client
from app.clients.kanoon_client import kanoon_client
from app.clients.openrouter_client import openrouter_client
from app.models.cached_order import CachedOrder
from app.models.cached_ai_analysis import CachedAIAnalysis
from app.repositories.cache_repository import CacheRepository
from app.schemas.order import OrderMarkdownResponse, OrderAIResponse
from app.services.cache_service import cache_service
from app.utils.kanoon_formatter import convert_kanoon_html_to_markdown

logger = structlog.get_logger()


# --- AI Prompt for structured order analysis ---
_ORDER_AI_SYSTEM_PROMPT = """You are an expert Indian court legal analyst. 
You will be given the full text of an official Indian court order/judgment from Indian Kanoon and must extract key structured data from it.
You MUST respond with valid JSON only. Do not include any markdown fences or explanatory text outside the JSON.
"""

_ORDER_AI_EXTRACTION_PROMPT = """Analyze the following court order / judgment text and extract the following fields into a JSON object.
If a field cannot be determined from the text, use null for strings and empty arrays for lists.

Fields to extract:
- caseNumber (string): The case number as written in the document (e.g. W.P.(C) 1234/2021)
- courtName (string): Full name of the court (e.g. Supreme Court of India, High Court of Delhi)
- judgeNames (list of strings): All judge names mentioned
- orderDate (string): Date of the order in YYYY-MM-DD format if possible, else as written
- petitioners (list of objects with "name" and "role" keys): All petitioners/appellants
- respondents (list of objects with "name" and "role" keys): All respondents
- counselPetitioner (list of strings): Petitioner's lawyers/advocates
- counselRespondent (list of strings): Respondent's lawyers/advocates
- orderNature (string): Nature of order e.g. "Interim Order", "Final Judgment", "Notice", "Directions"
- dispositionStatus (string): Short outcome e.g. "Allowed", "Dismissed", "Disposed", "Stay Granted", "Notice Issued", "Reserved"
- outcome (string): One clear sentence describing what the court decided
- courtDirections (list of strings): Each specific direction/order made by the court as a separate item
- primaryIssues (list of strings): The main legal questions/issues in the case
- statutesCited (list of strings): All acts, codes, and articles cited e.g. "Constitution of India - Article 226", "Reserve Bank of India Act, 1934"
- sectionsApplied (list of strings): Specific sections/articles that the court actually applied
- caseLawsReferenced (list of strings): Case names and citations referenced
- petitionerArguments (list of strings): Key arguments made by the petitioner
- respondentArguments (list of strings): Key arguments made by the respondent
- courtReasoning (string): The court's substantive reasoning and legal analysis in 3-6 sentences
- ratioDecidendi (string): The core legal principle/ratio established by this order
- executiveSummary (string): A detailed, comprehensive, multi-paragraph case summary covering (1) factual background & parties, (2) the specific dispute and relief sought, (3) key legal contentions, (4) the court's findings/disposition, and (5) practical directives. Provide full context so the reader gets complete understanding of the case.
- plainLanguageSummary (string): A clear 2-4 sentence explanation in plain, everyday language explaining what this means practically for the parties and business operations
- litigantFriendlyExplanation (string): Direct practical advice: what action steps or compliance requirements the party must follow next
- complianceDirections (list of strings): Any deadlines, notices, or compliance steps required by the parties
- risks (list of strings): Any legal risks, exposure, or adverse implications noted
- implications (list of strings): Broader regulatory, commercial, or jurisprudence implications of this order
- extractionConfidence (float between 0.0 and 1.0): Your confidence in the accuracy of the extraction (must be > 0.7 for valid extractions)

Court Document Text:
{order_text}
"""


class OrderService:
    def __init__(self, db: AsyncSession) -> None:
        self.cache_repo = CacheRepository(db)

    async def _resolve_kanoon_tid(self, cnr: str, filename: str) -> str | None:
        """Helper to resolve a numeric Indian Kanoon TID from filename, CNR, or search query."""
        import re as _re

        filename_clean = filename.strip()
        cnr_clean = cnr.strip()

        # 0. Direct numeric check on filename
        if filename_clean.isdigit():
            return filename_clean

        # Direct numeric check on CNR
        if cnr_clean.isdigit():
            return cnr_clean

        # 1. Extract TID from full Kanoon URLs like https://indiankanoon.org/doc/193792759/
        url_match = _re.search(r'indiankanoon\.org/doc/(\d+)', filename_clean)
        if url_match:
            return url_match.group(1)

        cnr_url_match = _re.search(r'indiankanoon\.org/doc/(\d+)', cnr_clean)
        if cnr_url_match:
            return cnr_url_match.group(1)

        # 2. Check if filename or CNR is explicitly a Kanoon doc ID (e.g. "doc_29724830", "doc-29724830", "193792759.pdf")
        doc_match = _re.match(r'^(?:doc[_-])?(\d{4,12})(?:\.(?:pdf|html|txt))?$', filename_clean, _re.IGNORECASE)
        if doc_match:
            return doc_match.group(1)

        cnr_match = _re.match(r'^(?:doc[_-])?(\d{4,12})(?:\.(?:pdf|html|txt))?$', cnr_clean, _re.IGNORECASE)
        if cnr_match:
            return cnr_match.group(1)

        # 3. Search Indian Kanoon using filename if it is a descriptive precedent title or statutory provision
        if (
            filename_clean
            and not filename_clean.startswith("order-")
            and not filename_clean.startswith("interim-")
        ):
            try:
                query_term = _re.sub(r'\.(pdf|txt|html)$', '', filename_clean, flags=_re.IGNORECASE).strip()
                logger.info("resolving_kanoon_tid_by_filename_search", query=query_term)
                search_res = await kanoon_client.search_docs(query=query_term, pagenum=1)
                docs = search_res.get("docs", [])
                if docs:
                    tid = str(docs[0].get("tid"))
                    logger.info("resolved_kanoon_tid_from_filename_search", query=query_term, tid=tid, title=docs[0].get("title"))
                    return tid
            except Exception as exc:
                logger.warning("failed_to_resolve_kanoon_tid_from_filename", error=str(exc))

        # 4. Search Indian Kanoon using CNR
        try:
            logger.info("resolving_kanoon_tid_via_cnr_search", cnr=cnr_clean)
            search_res = await kanoon_client.search_docs(query=cnr_clean, pagenum=1)
            docs = search_res.get("docs", [])
            if docs:
                tid = str(docs[0].get("tid"))
                logger.info("resolved_kanoon_tid_from_search", cnr=cnr_clean, tid=tid, title=docs[0].get("title"))
                return tid
        except Exception as exc:
            logger.warning("failed_to_resolve_kanoon_tid", cnr=cnr_clean, error=str(exc))

        # 5. Fallback: Check if cached case in DB has a title or search query we can use
        try:
            cached_case = await self.cache_repo.get_cached_case(cnr_clean)
            if cached_case and cached_case.case_title and "Unknown" not in cached_case.case_title:
                search_res2 = await kanoon_client.search_docs(query=cached_case.case_title, pagenum=1)
                docs2 = search_res2.get("docs", [])
                if docs2:
                    return str(docs2[0].get("tid"))
        except Exception:
            pass

        return None

    async def get_markdown(self, cnr: str, filename: str) -> OrderMarkdownResponse:
        """Get court document markdown from Indian Kanoon API with permanent caching."""
        redis_key = f"order_md:{cnr}:{filename}"

        # 1. Check Redis cache (only accept valid content)
        cached = await cache_service.get(redis_key)
        if cached and isinstance(cached, dict):
            cached_md = cached.get("markdown", "")
            if cached_md and not cached_md.startswith("*") and "could not be" not in cached_md.lower():
                return OrderMarkdownResponse(**cached)

        # 2. Check PostgreSQL / SQLite permanent cache
        cached_pg = await self.cache_repo.get_cached_order(cnr, filename)
        if cached_pg and cached_pg.markdown:
            cached_md = cached_pg.markdown
            if not cached_md.startswith("*") and "could not be" not in cached_md.lower():
                logger.info("ORDER_MARKDOWN_CACHE_HIT", cnr=cnr, filename=filename, source="db", size=len(cached_md))
                response = OrderMarkdownResponse(cnr=cnr, filename=filename, markdown=cached_md)
                await cache_service.set(redis_key, response.model_dump())
                return response

        # 3. Resolve Indian Kanoon TID and fetch document from Kanoon API
        tid = await self._resolve_kanoon_tid(cnr, filename)
        markdown_content: str | None = None

        if tid:
            try:
                logger.info("fetching_doc_from_kanoon_api", tid=tid, cnr=cnr)
                doc_data = await kanoon_client.get_doc(tid)
                raw_html = doc_data.get("doc", "")
                if raw_html:
                    markdown_content = convert_kanoon_html_to_markdown(
                        raw_html=raw_html,
                        title=doc_data.get("title"),
                        docsource=doc_data.get("docsource"),
                        publishdate=doc_data.get("publishdate"),
                    )
                    logger.info("kanoon_doc_converted_to_markdown", tid=tid, md_length=len(markdown_content))
            except Exception as exc:
                logger.error("kanoon_doc_fetch_failed", tid=tid, error=str(exc))

        if not markdown_content or markdown_content.startswith("*"):
            markdown_content = (
                f"*This court document (`{filename}`) could not be retrieved from Indian Kanoon at this time. "
                "Please verify the document TID or search query.*"
            )
            return OrderMarkdownResponse(cnr=cnr, filename=filename, markdown=markdown_content)

        # 4. Save permanently in PostgreSQL / SQLite
        try:
            from datetime import timedelta
            from app.models.cached_case import CachedCase
            existing_case = await self.cache_repo.get_cached_case(cnr)
            if not existing_case:
                now = datetime.now(timezone.utc)
                await self.cache_repo.save_cached_case(CachedCase(
                    cnr=cnr,
                    response_json=json.dumps({"cnr": cnr, "caseTitle": f"Kanoon Record {cnr}"}),
                    case_title=f"Kanoon Record {cnr}",
                    fetched_at=now,
                    expires_at=now + timedelta(days=30),
                ))

            await self.cache_repo.save_cached_order(CachedOrder(
                cnr=cnr,
                filename=filename,
                markdown=markdown_content,
                fetched_at=datetime.now(timezone.utc),
            ))
        except Exception as cache_err:
            logger.warning("failed_to_save_cached_order", cnr=cnr, error=str(cache_err))
            try:
                await self.cache_repo.db.rollback()
            except Exception:
                pass

        # 5. Store in Redis
        response = OrderMarkdownResponse(cnr=cnr, filename=filename, markdown=markdown_content)
        await cache_service.set(redis_key, response.model_dump())
        return response

    async def get_ai_analysis(self, cnr: str, filename: str) -> OrderAIResponse:
        """Get AI analysis of a Kanoon court order / judgment with permanent caching."""
        redis_key = f"order_ai:{cnr}:{filename}"

        # 1. Check Redis cache (only return if valid extraction, not error placeholder)
        cached = await cache_service.get(redis_key)
        if cached and isinstance(cached, dict):
            conf = cached.get("extraction_confidence") or cached.get("extractionConfidence", 0.0)
            exec_sum = cached.get("executive_summary") or cached.get("executiveSummary", "")
            if conf > 0.0 and "could not be analyzed" not in exec_sum and "unavailable" not in exec_sum.lower():
                return OrderAIResponse(**cached)

        # 2. Check PostgreSQL / SQLite cache
        cached_pg = await self.cache_repo.get_cached_ai(cnr, filename)
        if cached_pg and cached_pg.ai_json:
            try:
                data = json.loads(cached_pg.ai_json)
                conf = data.get("extractionConfidence", 0.0)
                exec_sum = data.get("executiveSummary", "")
                if conf > 0.0 and "could not be analyzed" not in exec_sum and "unavailable" not in exec_sum.lower():
                    response = self._transform_ai_response(cnr, filename, data)
                    await cache_service.set(redis_key, response.model_dump())
                    return response
            except Exception:
                pass

        # 3. Fetch real Markdown from Kanoon API
        order_md_response = await self.get_markdown(cnr, filename)
        order_text = order_md_response.markdown

        if not order_text or order_text.startswith("*") or "could not be retrieved" in order_text.lower():
            raw = {
                "executiveSummary": "This document could not be analyzed because the Indian Kanoon content was unavailable.",
                "outcome": "Content unavailable from Indian Kanoon.",
                "extractionConfidence": 0.0,
            }
            return self._transform_ai_response(cnr, filename, raw)

        # 4. Generate structured analysis via Gemini (with OpenRouter fallback)
        logger.info("ORDER_AI_CALLING_LLM", cnr=cnr, filename=filename, text_length=len(order_text))
        extraction_prompt = _ORDER_AI_EXTRACTION_PROMPT.format(order_text=order_text[:16000])

        raw = await gemini_client.generate_json(
            system_prompt=_ORDER_AI_SYSTEM_PROMPT,
            user_prompt=extraction_prompt,
        )

        if not raw or not raw.get("executiveSummary") or raw.get("extractionConfidence", 0.0) == 0.0:
            # Try OpenRouter fallback
            logger.info("ORDER_AI_FALLING_BACK_TO_OPENROUTER", cnr=cnr, filename=filename)
            raw = await openrouter_client.generate_json(
                system_prompt=_ORDER_AI_SYSTEM_PROMPT,
                user_prompt=extraction_prompt,
            )

        if not raw or not raw.get("executiveSummary"):
            raw = {
                "executiveSummary": "AI analysis could not be generated for this court record at this time.",
                "outcome": "Analysis unavailable.",
                "extractionConfidence": 0.0,
            }
            logger.error("ORDER_AI_ALL_MODELS_RETURNED_EMPTY", cnr=cnr, filename=filename)
            return self._transform_ai_response(cnr, filename, raw)

        logger.info(
            "ORDER_AI_SUCCESS",
            cnr=cnr,
            filename=filename,
            confidence=raw.get("extractionConfidence"),
            summary_preview=(raw.get("executiveSummary") or "")[:150],
        )

        # 5. Store permanently in database (only for valid extractions)
        if raw.get("extractionConfidence", 0.0) > 0.0:
            try:
                await self.cache_repo.save_cached_ai(CachedAIAnalysis(
                    cnr=cnr,
                    filename=filename,
                    ai_json=json.dumps(raw, default=str),
                    fetched_at=datetime.now(timezone.utc),
                ))
            except Exception as save_ai_err:
                logger.warning("failed_to_save_cached_ai", cnr=cnr, error=str(save_ai_err))

        response = self._transform_ai_response(cnr, filename, raw)
        await cache_service.set(redis_key, response.model_dump())
        return response

    async def download_pdf(self, cnr: str, filename: str) -> bytes:
        """Download original court copy from Kanoon (origdoc endpoint) with permanent disk caching."""
        tid = await self._resolve_kanoon_tid(cnr, filename)
        if not tid:
            return b"Document not available: Could not resolve a valid Indian Kanoon document ID."

        # Check local disk cache first
        from pathlib import Path
        cache_dir = Path("./data/pdf_cache")
        cache_dir.mkdir(parents=True, exist_ok=True)
        cache_file = cache_dir / f"{tid}.pdf"

        if cache_file.exists() and cache_file.stat().st_size > 100:
            logger.info("order_pdf_served_from_disk_cache", tid=tid, cnr=cnr)
            return cache_file.read_bytes()

        try:
            pdf_bytes = await kanoon_client.get_orig_doc_bytes(tid)
            if pdf_bytes and len(pdf_bytes) > 100 and pdf_bytes.startswith(b'%PDF-'):
                try:
                    cache_file.write_bytes(pdf_bytes)
                    logger.info("order_pdf_saved_to_disk_cache", tid=tid, cnr=cnr)
                except Exception as cache_err:
                    logger.warning("order_pdf_cache_write_failed", error=str(cache_err))
                return pdf_bytes
            elif pdf_bytes:
                return pdf_bytes

            return b"Original court copy PDF could not be fetched from Indian Kanoon."
        except Exception as exc:
            logger.error("order_download_failed", tid=tid, cnr=cnr, error=str(exc))
            return str(exc).encode()

    @staticmethod
    def _transform_ai_response(cnr: str, filename: str, raw: dict[str, Any]) -> OrderAIResponse:
        """Transform AI extraction JSON into internal OrderAIResponse DTO."""
        if not isinstance(raw, dict):
            raw = {}
        return OrderAIResponse(
            cnr=cnr,
            filename=filename,
            case_number=raw.get("caseNumber") or raw.get("case_number"),
            court_name=raw.get("courtName") or raw.get("court_name"),
            judge_names=raw.get("judgeNames") or raw.get("judge_names", []),
            order_date=raw.get("orderDate") or raw.get("order_date"),
            petitioners=raw.get("petitioners", []),
            respondents=raw.get("respondents", []),
            counsel_petitioner=raw.get("counselPetitioner") or raw.get("counsel_petitioner", []),
            counsel_respondent=raw.get("counselRespondent") or raw.get("counsel_respondent", []),
            order_nature=raw.get("orderNature") or raw.get("order_nature"),
            disposition_status=raw.get("dispositionStatus") or raw.get("disposition_status"),
            outcome=raw.get("outcome"),
            court_directions=raw.get("courtDirections") or raw.get("court_directions", []),
            primary_issues=raw.get("primaryIssues") or raw.get("primary_issues", []),
            statutes_cited=raw.get("statutesCited") or raw.get("statutes_cited", []),
            sections_applied=raw.get("sectionsApplied") or raw.get("sections_applied", []),
            case_laws_referenced=raw.get("caseLawsReferenced") or raw.get("case_laws_referenced", []),
            petitioner_arguments=raw.get("petitionerArguments") or raw.get("petitioner_arguments", []),
            respondent_arguments=raw.get("respondentArguments") or raw.get("respondent_arguments", []),
            court_reasoning=raw.get("courtReasoning") or raw.get("court_reasoning"),
            ratio_decidendi=raw.get("ratioDecidendi") or raw.get("ratio_decidendi"),
            executive_summary=raw.get("executiveSummary") or raw.get("executive_summary"),
            plain_language_summary=raw.get("plainLanguageSummary") or raw.get("plain_language_summary"),
            litigant_friendly_explanation=raw.get("litigantFriendlyExplanation") or raw.get("litigant_friendly_explanation"),
            compliance_directions=raw.get("complianceDirections") or raw.get("compliance_directions", []),
            risks=raw.get("risks", []),
            implications=raw.get("implications", []),
            extraction_confidence=raw.get("extractionConfidence") or raw.get("extraction_confidence", 0.0),
            raw_data=raw,
        )
