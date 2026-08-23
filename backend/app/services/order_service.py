"""Order service - handles order markdown, AI analysis, and PDF downloads."""

import json
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.clients.gemini_client import gemini_client
from app.core.exceptions import ECourtsAPIError
from app.models.cached_order import CachedOrder
from app.models.cached_ai_analysis import CachedAIAnalysis
from app.repositories.cache_repository import CacheRepository
from app.schemas.order import OrderMarkdownResponse, OrderAIResponse
from app.services.cache_service import cache_service

logger = structlog.get_logger()


# --- AI Prompt for structured order analysis ---
_ORDER_AI_SYSTEM_PROMPT = """You are an expert Indian court legal analyst. 
You will be given the full text of an official court order and must extract key structured data from it.
You MUST respond with valid JSON only. Do not include any markdown fences or explanatory text outside the JSON.
"""

_ORDER_AI_EXTRACTION_PROMPT = """Analyze the following court order text and extract the following fields into a JSON object.
If a field cannot be determined from the text, use null for strings and empty arrays for lists.

Fields to extract:
- caseNumber (string): The case number as written in the order
- courtName (string): Full name of the court
- judgeNames (list of strings): All judge names mentioned 
- orderDate (string): Date of the order in YYYY-MM-DD format if possible, else as written
- petitioners (list of objects with "name" and "role" keys): All petitioners/appellants
- respondents (list of objects with "name" and "role" keys): All respondents
- counselPetitioner (list of strings): Petitioner's lawyers
- counselRespondent (list of strings): Respondent's lawyers
- orderNature (string): Nature of order e.g. "Interim Order", "Final Judgment", "Notice", "Directions"
- dispositionStatus (string): Short outcome e.g. "Stay Granted", "Dismissed", "Notice Issued", "Reserved"
- outcome (string): One sentence describing what the court decided
- courtDirections (list of strings): Each specific direction/order made by the court as a separate item
- primaryIssues (list of strings): The main legal questions/issues in the case
- statutesCited (list of strings): All acts, codes, and articles cited e.g. "Constitution of India - Article 226"
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
- extractionConfidence (float between 0.0 and 1.0): Your confidence in the accuracy of the extraction

Court Order Text:
{order_text}
"""


class OrderService:
    def __init__(self, db: AsyncSession) -> None:
        self.cache_repo = CacheRepository(db)

    async def get_markdown(self, cnr: str, filename: str) -> OrderMarkdownResponse:
        """Get order markdown with permanent caching.

        Flow: Redis Cache -> PostgreSQL Cache -> Download PDF -> OpenRouter OCR -> Cache & Return
        """
        redis_key = f"order_md:{cnr}:{filename}"

        # Redis cache
        cached = await cache_service.get(redis_key)
        if cached:
            return OrderMarkdownResponse(**cached)

        # PostgreSQL cache (permanent)
        cached_pg = await self.cache_repo.get_cached_order(cnr, filename)
        if cached_pg and cached_pg.markdown:
            logger.info("ORDER_MARKDOWN_CACHE_HIT", cnr=cnr, filename=filename, source="postgres", size=len(cached_pg.markdown))
            response = OrderMarkdownResponse(cnr=cnr, filename=filename, markdown=cached_pg.markdown)
            await cache_service.set(redis_key, response.model_dump())
            return response

        # Fetch from eCourts API
        markdown_content: str | None = None
        
        # 1. Try pre-extracted markdown from partner API
        try:
            from app.clients.ecourts_client import ecourts_client
            resp = await ecourts_client.get_order_markdown(cnr, filename)
            if isinstance(resp, dict):
                markdown_content = resp.get("markdown") or resp.get("data", {}).get("markdown")
        except Exception as e:
            logger.warning("ecourts_markdown_endpoint_failed", error=str(e))
            
        # 2. If no markdown, download PDF and do Gemini OCR
        if not markdown_content:
            try:
                from app.clients.ecourts_client import ecourts_client
                from app.clients.gemini_client import gemini_client
                pdf_bytes = await ecourts_client.get_order_download(cnr, filename)
                
                if pdf_bytes:
                    markdown_content = await gemini_client.extract_markdown_from_pdf(pdf_bytes)
                else:
                    markdown_content = "*This document is empty or could not be downloaded from eCourts.*"
                    
            except Exception as exc:
                logger.error("ORDER_MARKDOWN_FETCH_FAILED", cnr=cnr, filename=filename, error=str(exc))
                markdown_content = (
                    f"*This court order (`{filename}`) could not be retrieved at this time. "
                    "The document may not be available via the eCourts API.*"
                )

        # No content available — skip caching so a future retry can succeed
        if not markdown_content or markdown_content.startswith("*This court order"):
            return OrderMarkdownResponse(cnr=cnr, filename=filename, markdown=markdown_content or "")

        # Store permanently in PostgreSQL
        await self.cache_repo.save_cached_order(CachedOrder(
            cnr=cnr,
            filename=filename,
            markdown=markdown_content,
            fetched_at=datetime.now(timezone.utc),
        ))

        # Store in Redis
        response = OrderMarkdownResponse(cnr=cnr, filename=filename, markdown=markdown_content)
        await cache_service.set(redis_key, response.model_dump())
        return response

    async def get_ai_analysis(self, cnr: str, filename: str) -> OrderAIResponse:
        """Get AI analysis of an order with permanent caching.

        Flow: Redis Cache -> PostgreSQL Cache -> Get Markdown -> OpenRouter JSON Analysis -> Cache & Return
        """
        redis_key = f"order_ai:{cnr}:{filename}"

        # Redis cache
        cached = await cache_service.get(redis_key)
        if cached:
            return OrderAIResponse(**cached)

        # PostgreSQL cache
        cached_pg = await self.cache_repo.get_cached_ai(cnr, filename)
        if cached_pg:
            data = json.loads(cached_pg.ai_json)
            response = self._transform_ai_response(cnr, filename, data)
            await cache_service.set(redis_key, response.model_dump())
            return response

        # Generate analysis via OpenRouter using Kanoon text
        raw: dict[str, Any] | None = None
        if not raw:
            # Get the order markdown (may use cache or trigger PDF extraction)
            order_md_response = await self.get_markdown(cnr, filename)
            order_text = order_md_response.markdown

            # All "unavailable" messages start with '*' — skip AI for all of them
            if not order_text or order_text.startswith("*"):
                # No content available — don't cache, allow retry later
                raw = {
                    "executiveSummary": "This order could not be analyzed because the document content was unavailable.",
                    "outcome": "Content unavailable.",
                    "extractionConfidence": 0.0,
                }
                return self._transform_ai_response(cnr, filename, raw)
            else:
                logger.info("ORDER_AI_CALLING_GEMINI", cnr=cnr, filename=filename, text_length=len(order_text), text_preview=order_text[:200])
                extraction_prompt = _ORDER_AI_EXTRACTION_PROMPT.format(order_text=order_text)
                raw = await gemini_client.generate_json(
                    system_prompt=_ORDER_AI_SYSTEM_PROMPT,
                    user_prompt=extraction_prompt,
                )
                if not raw:
                    raw = {
                        "executiveSummary": "AI analysis could not be generated for this order at this time.",
                        "outcome": "Analysis unavailable.",
                        "extractionConfidence": 0.0,
                    }
                    # Don't cache failures — allow retry on next request
                    logger.error("ORDER_AI_GEMINI_RETURNED_EMPTY", cnr=cnr, filename=filename)
                    response = self._transform_ai_response(cnr, filename, raw)
                    return response
                else:
                    logger.info(
                        "ORDER_AI_GEMINI_SUCCESS",
                        cnr=cnr,
                        filename=filename,
                        keys=list(raw.keys()),
                        summary_preview=(raw.get("executiveSummary") or "")[:200],
                        confidence=raw.get("extractionConfidence"),
                    )

        # Store permanently (only for successful extractions)
        await self.cache_repo.save_cached_ai(CachedAIAnalysis(
            cnr=cnr,
            filename=filename,
            ai_json=json.dumps(raw, default=str),
            fetched_at=datetime.now(timezone.utc),
        ))

        response = self._transform_ai_response(cnr, filename, raw)
        await cache_service.set(redis_key, response.model_dump())
        return response


    async def download_pdf(self, cnr: str, filename: str) -> bytes:
        """Download original court copy from Kanoon (origdoc endpoint) with permanent disk caching."""
        if not filename or not filename.strip().lstrip("-").isdigit():
            return b"Document not available: This is an old placeholder, not a real Kanoon document."

        # Check local disk cache first
        from pathlib import Path
        cache_dir = Path("./data/pdf_cache")
        cache_dir.mkdir(parents=True, exist_ok=True)
        cache_file = cache_dir / f"{filename}.pdf"

        if cache_file.exists() and cache_file.stat().st_size > 100:
            logger.info("order_pdf_served_from_disk_cache", cnr=cnr, filename=filename)
            return cache_file.read_bytes()

        try:
            pdf_bytes = await kanoon_client.get_orig_doc_bytes(filename)
            if pdf_bytes and len(pdf_bytes) > 100 and pdf_bytes.startswith(b'%PDF-'):
                try:
                    cache_file.write_bytes(pdf_bytes)
                    logger.info("order_pdf_saved_to_disk_cache", cnr=cnr, filename=filename)
                except Exception as cache_err:
                    logger.warning("order_pdf_cache_write_failed", error=str(cache_err))
                return pdf_bytes
            elif pdf_bytes:
                return pdf_bytes
            
            return b"Original court copy PDF could not be fetched from Indian Kanoon."
        except Exception as exc:
            logger.error("order_download_failed", cnr=cnr, filename=filename, error=str(exc))
            return str(exc).encode()

    @staticmethod
    def _transform_ai_response(cnr: str, filename: str, raw: dict[str, Any]) -> OrderAIResponse:
        """Transform eCourts Order AI / OpenRouter response into internal DTO."""
        return OrderAIResponse(
            cnr=cnr,
            filename=filename,
            case_number=raw.get("caseNumber"),
            court_name=raw.get("courtName"),
            judge_names=raw.get("judgeNames", []),
            order_date=raw.get("orderDate"),
            petitioners=raw.get("petitioners", []),
            respondents=raw.get("respondents", []),
            counsel_petitioner=raw.get("counselPetitioner", []),
            counsel_respondent=raw.get("counselRespondent", []),
            order_nature=raw.get("orderNature"),
            disposition_status=raw.get("dispositionStatus"),
            outcome=raw.get("outcome"),
            court_directions=raw.get("courtDirections", []),
            primary_issues=raw.get("primaryIssues", []),
            statutes_cited=raw.get("statutesCited", []),
            sections_applied=raw.get("sectionsApplied", []),
            case_laws_referenced=raw.get("caseLawsReferenced", []),
            petitioner_arguments=raw.get("petitionerArguments", []),
            respondent_arguments=raw.get("respondentArguments", []),
            court_reasoning=raw.get("courtReasoning"),
            ratio_decidendi=raw.get("ratioDecidendi"),
            executive_summary=raw.get("executiveSummary"),
            plain_language_summary=raw.get("plainLanguageSummary"),
            litigant_friendly_explanation=raw.get("litigantFriendlyExplanation"),
            compliance_directions=raw.get("complianceDirections", []),
            risks=raw.get("risks", []),
            implications=raw.get("implications", []),
            extraction_confidence=raw.get("extractionConfidence"),
            raw_data=raw,
        )


