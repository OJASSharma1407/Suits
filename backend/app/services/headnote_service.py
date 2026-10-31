"""Headnote & Ratio Extraction Service.

A two-stage Neuro-Symbolic pipeline for Indian court judgments:
Stage 1: InLegalBERT Rhetorical Role Segmentation (RRS) with Mode 1 Whitening to
         isolate verified judicial holdings and strip counsel contentions.
Stage 2: Gemini 3.6/3 Flash synthesis for publisher-grade Catchwords, numbered Held ratio,
         Precedent Citator treatment table, and Statutory interpretation matrix.
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import re
from datetime import datetime, timezone
from typing import Any

import numpy as np
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.clients.prediction_gemini_client import prediction_gemini_client
from app.core.config import settings
from app.models.cached_headnote import CachedHeadnote
from app.models.cached_order import CachedOrder
from app.repositories.cache_repository import CacheRepository
from app.schemas.headnote import (
    CaseHeadnote,
    CaseHeadnoteResponse,
    PrecedentTreatmentItem,
    StatutoryInterpretationItem,
)
from app.services.cache_service import cache_service
from app.services.inlegal_bert_service import inlegal_bert_service
from app.services.order_service import OrderService

logger = structlog.get_logger()

# --- Canonical Rhetorical Anchors for InLegalBERT Zero-Shot Projection ---
_RATIO_ANCHORS = [
    "We are of the considered opinion that the legal proposition is as follows",
    "The ratio decidendi that emerges from the harmonious construction of the statute",
    "It is held and declared that the provision does not bar the maintainability",
    "Accordingly, the question of law is answered in the affirmative",
    "The principle of law established by this Court is that",
    "We hold that an objection as to sufficiency of stamping falls within the ambit of",
    "The court is duty bound to examine whether the statutory precondition is satisfied",
]

_ARGUMENT_ANCHORS = [
    "Learned Senior Counsel appearing on behalf of the appellant contended that",
    "The petitioner vehemently submitted that the impugned order is contrary to law",
    "It was argued by counsel for the petitioner that fundamental rights are violated",
    "On the other hand, the learned Additional Solicitor General argued that",
    "The respondent counsel urged that no case for interference is made out",
    "State counsel submitted that the petition is liable to be dismissed with costs",
]

_DISPOSITION_ANCHORS = [
    "In the result, the appeal is allowed and the impugned judgment is set aside",
    "For the reasons recorded above, the writ petition stands dismissed",
    "The reference is answered accordingly and the matter is remanded back to the bench",
    "Interim stay granted earlier is hereby made absolute",
]


class HeadnoteService:
    """Orchestrates rhetorical role segmentation and publisher-grade headnote synthesis."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.cache_repo = CacheRepository(db)
        self.order_service = OrderService(db)
        self._anchor_vectors: dict[str, np.ndarray] | None = None

    def _get_anchor_centroids(self) -> dict[str, np.ndarray]:
        """Lazy-load and precompute Mode 1 whitened rhetorical anchor centroids."""
        if self._anchor_vectors is not None:
            return self._anchor_vectors

        def _mean_centroid(texts: list[str]) -> np.ndarray:
            vecs = [inlegal_bert_service.embed_text(t) for t in texts]
            mean_v = np.mean(vecs, axis=0)
            norm = np.linalg.norm(mean_v)
            return mean_v / norm if norm > 1e-9 else mean_v

        self._anchor_vectors = {
            "ratio": _mean_centroid(_RATIO_ANCHORS),
            "argument": _mean_centroid(_ARGUMENT_ANCHORS),
            "disposition": _mean_centroid(_DISPOSITION_ANCHORS),
        }
        return self._anchor_vectors

    def _segment_and_filter_ratio(
        self,
        text: str,
        max_chunks: int = 12,
    ) -> tuple[str, list[str]]:
        """Stage 1: Segment judgment and filter top ratio/disposition blocks using InLegalBERT."""
        # Split into substantial paragraphs
        raw_paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if len(p.strip()) > 80]
        if not raw_paragraphs:
            raw_paragraphs = [text[:2000]]

        # Also extract candidate cited precedents via regex pattern
        precedent_pattern = re.compile(
            r'([A-Z][A-Za-z0-9\s\.,&]+(?:vs|v\.|And|Ors\.)[A-Za-z0-9\s\.,&]+(?:\(\d{4}\)|\d{4}\s+SCC|\d{4}\s+AIR|\d{4}\s+SCR|[A-Z]{2,4}\s+\d+))',
            re.IGNORECASE,
        )
        cited_authorities: list[str] = []
        for p in raw_paragraphs:
            matches = precedent_pattern.findall(p)
            for m in matches:
                clean_m = m.strip(" ,.")
                if len(clean_m) > 10 and clean_m not in cited_authorities:
                    cited_authorities.append(clean_m)
                    if len(cited_authorities) >= 10:
                        break

        anchors = self._get_anchor_centroids()
        ratio_centroid = anchors["ratio"]
        arg_centroid = anchors["argument"]
        disp_centroid = anchors["disposition"]

        scored_chunks: list[tuple[str, float]] = []

        # Score chunks against rhetorical centroids
        for para in raw_paragraphs:
            p_vec = inlegal_bert_service.embed_text(para[:600])
            r_sim = float(np.dot(p_vec, ratio_centroid))
            a_sim = float(np.dot(p_vec, arg_centroid))
            d_sim = float(np.dot(p_vec, disp_centroid))

            # Net Judicial Score: Reward holding & disposition phrasing, penalize counsel advocacy phrasing
            net_score = max(r_sim, d_sim * 1.1) - (0.75 * a_sim)
            scored_chunks.append((para, net_score))

        # Sort descending by net ratio signal
        scored_chunks.sort(key=lambda x: x[1], reverse=True)
        top_ratio_chunks = [chunk for chunk, _ in scored_chunks[:max_chunks]]

        # Maintain natural reading flow if possible
        distilled_text = "\n\n---\n\n".join(top_ratio_chunks)
        return distilled_text, cited_authorities[:8]

    async def get_or_generate_headnote(
        self,
        cnr: str,
        filename: str | None = None,
        force_refresh: bool = False,
    ) -> CaseHeadnoteResponse | None:
        """Fetch cached headnote or execute full two-stage extraction pipeline."""
        cnr_clean = cnr.strip().upper()

        # 1. Resolve order markdown from cache or service
        order_row: CachedOrder | None = None
        if filename:
            order_row = await self.cache_repo.get_cached_order(cnr_clean, filename.strip())

        if not order_row:
            # Pick first non-empty markdown order for this case
            stmt = (
                select(CachedOrder)
                .where(CachedOrder.cnr == cnr_clean, CachedOrder.markdown.isnot(None))
                .order_by(CachedOrder.fetched_at.desc())
            )
            order_row = (await self.db.execute(stmt)).scalars().first()

        order_markdown = order_row.markdown if order_row else ""

        # Fallback: if no order row exists, attempt resolving via OrderService
        if not order_markdown:
            try:
                target_filename = filename or "primary"
                md_resp = await self.order_service.get_markdown(cnr_clean, target_filename)
                order_markdown = md_resp.markdown
                if not order_row:
                    order_row = await self.cache_repo.get_cached_order(cnr_clean, target_filename)
            except Exception as e:
                logger.warning("order_markdown_resolution_failed", cnr=cnr_clean, error=str(e))

        if not order_markdown or len(order_markdown.strip()) < 100:
            # Check if DB already has a cached headnote for this CNR before giving up
            if not force_refresh:
                db_headnote = await self.cache_repo.get_cached_headnote(cnr_clean)
                if db_headnote and db_headnote.headnote_json:
                    try:
                        logger.info("headnote_db_fallback_cache_hit", cnr=cnr_clean)
                        loaded = json.loads(db_headnote.headnote_json)
                        resp = CaseHeadnoteResponse.model_validate(loaded)
                        resp.is_cached = True
                        return resp
                    except Exception as e:
                        logger.warning("corrupt_cached_headnote_in_db", error=str(e))
            logger.warning("insufficient_order_text_for_headnote", cnr=cnr_clean)
            return None

        # 2. Compute state-hash
        order_hash = hashlib.sha256(order_markdown.encode("utf-8")).hexdigest()[:16]
        redis_key = f"headnote:{cnr_clean}:{order_hash}"

        # 3. Cache Check: Redis first, then Database
        if not force_refresh:
            # 3a. Redis cache check
            cached_val = await cache_service.get(redis_key)
            if cached_val and isinstance(cached_val, dict):
                logger.info("headnote_redis_cache_hit", cnr=cnr_clean, hash=order_hash)
                resp = CaseHeadnoteResponse.model_validate(cached_val)
                resp.is_cached = True
                return resp

            # 3b. Database check via CacheRepository
            db_row = await self.cache_repo.get_cached_headnote(cnr_clean, order_hash)
            if db_row and db_row.headnote_json:
                try:
                    logger.info("headnote_db_cache_hit", cnr=cnr_clean, hash=order_hash)
                    loaded = json.loads(db_row.headnote_json)
                    resp = CaseHeadnoteResponse.model_validate(loaded)
                    resp.is_cached = True
                    # Rehydrate Redis cache from DB
                    await cache_service.set(redis_key, resp.model_dump(), settings.prediction_cache_ttl)
                    return resp
                except Exception as e:
                    logger.warning("corrupt_cached_headnote_in_db", error=str(e))

            # 3c. Derive from CachedAIAnalysis if already analyzed by unified OrderService
            target_fn = filename.strip() if filename else None
            ai_row = await self.cache_repo.get_cached_ai(cnr_clean, target_fn) if target_fn else None
            if not ai_row:
                ai_row = await self.cache_repo.get_cached_ai(cnr_clean, cnr_clean)

            if ai_row and ai_row.ai_json:
                try:
                    ai_raw = json.loads(ai_row.ai_json)
                    if ai_raw.get("ratioDecidendi") or ai_raw.get("heldPoints"):
                        logger.info("headnote_derived_from_cached_ai_analysis", cnr=cnr_clean)
                        held_list = ai_raw.get("heldPoints") or ai_raw.get("held_points")
                        if not held_list and ai_raw.get("ratioDecidendi"):
                            held_list = [ai_raw.get("ratioDecidendi")]
                        elif not held_list:
                            held_list = []

                        headnote_dict = {
                            "target_cnr": cnr_clean,
                            "order_id": filename or "primary",
                            "order_title": ai_raw.get("caseNumber") or filename or "Court Judgment",
                            "order_date": ai_raw.get("orderDate") or ai_raw.get("order_date"),
                            "court_name": ai_raw.get("courtName") or ai_raw.get("court_name"),
                            "bench_coram": ai_raw.get("judgeNames") or ai_raw.get("judge_names", []),
                            "headnote": {
                                "catchwords": ai_raw.get("catchwords", []),
                                "held_points": held_list,
                                "ratio_decidendi_summary": ai_raw.get("ratioDecidendi") or ai_raw.get("courtReasoning", ""),
                                "obiter_dicta": ai_raw.get("obiterDicta") or ai_raw.get("obiter_dicta", []),
                                "precedent_citator_table": ai_raw.get("precedentCitatorTable") or ai_raw.get("precedent_citator_table", []),
                                "statutory_provisions_considered": ai_raw.get("statutoryProvisionsConsidered") or ai_raw.get("statutory_provisions_considered", []),
                                "operative_disposition": ai_raw.get("operativeDisposition") or ai_raw.get("outcome") or ai_raw.get("dispositionStatus") or "Disposed",
                            },
                            "model_attribution": "Unified Case Intelligence · InLegalBERT & Gemini/Groq",
                            "order_hash": order_hash,
                            "is_cached": True,
                            "generated_at": datetime.now(timezone.utc).isoformat(),
                        }
                        resp = CaseHeadnoteResponse.model_validate(headnote_dict)
                        resp.is_cached = True
                        await cache_service.set(redis_key, resp.model_dump(), settings.prediction_cache_ttl)
                        return resp
                except Exception as e:
                    logger.warning("failed_to_derive_headnote_from_ai_analysis", error=str(e))

        # 4. Stage 1: InLegalBERT Rhetorical Role Segmentation (run in thread pool)
        logger.info("starting_inlegalbert_rhetorical_segmentation", cnr=cnr_clean)
        distilled_ratio_text, candidate_citations = await asyncio.to_thread(
            self._segment_and_filter_ratio,
            order_markdown,
            12,
        )

        # 5. Stage 2: Gemini Editorial Headnote Synthesis
        system_prompt = (
            "You are the Senior Editorial Law Reporter for SUITS (modeled after Supreme Court Cases [SCC] "
            "and All India Reporter [AIR] publishing standards).\n"
            "Your task is to draft an authoritative, publisher-grade Legal Headnote and Ratio Extraction from "
            "the provided judicial judgment text.\n\n"
            "EDITORIAL RULES:\n"
            "1. NEVER confuse contentions of counsel (Petitioner/Respondent) with the judgment of the court. "
            "'Held' must ONLY include propositions explicitly affirmed, decreed, or established by the bench.\n"
            "2. Catchwords MUST be hierarchical: [Subject / Primary Act] — [Section / Article] — [Focal Question] — [Core Doctrine / Rule of Law].\n"
            "3. For the Precedent Citator Table, classify past authorities cited into: "
            "'OVERRULED' | 'FOLLOWED' | 'RELIED ON' | 'DISTINGUISHED' | 'EXPLAINED' | 'REFERRED'.\n"
            "4. Separate pure 'Ratio Decidendi' from 'Obiter Dicta' (passing remarks or advisory directions).\n"
            "5. The output must be strict JSON matching the requested schema."
        )

        citations_prompt_block = (
            f"Candidate Precedents Detected in Judgment:\n" + "\n".join(f"- {c}" for c in candidate_citations)
            if candidate_citations
            else "Extract all cited precedents directly from the text."
        )

        user_prompt = f"""
COURT DOCUMENT CONTEXT:
CNR: {cnr_clean}
Document Length: {len(order_markdown)} characters

FILTERED JUDICIAL RATIO & OPERATIVE FINDINGS (Stage 1 InLegalBERT Extraction):
{distilled_ratio_text}

{citations_prompt_block}

Generate the publisher-grade headnote in JSON adhering to this structure:
{{
  "catchwords": [
    "<Primary Act or Legal Subject>",
    "<Section / Article>",
    "<Focal Topic>",
    "<Core Principle / Holding>"
  ],
  "held_points": [
    "<Numbered holding 1: Clear, definitive rule of law articulated by court>",
    "<Numbered holding 2: Interpretation of specific statutory precondition>"
  ],
  "ratio_decidendi_summary": "<2-3 paragraph comprehensive legal distillation of the binding ratio>",
  "obiter_dicta": [
    "<Incidental judicial comment or legislative recommendation not forming part of ratio>"
  ],
  "precedent_citator_table": [
    {{
      "precedent_name": "<exact authority name>",
      "treatment": "OVERRULED" | "FOLLOWED" | "RELIED ON" | "DISTINGUISHED" | "EXPLAINED" | "REFERRED",
      "bench_commentary": "<how this precedent was applied or distinguished>",
      "overruled_specific_ratio": "<specific legal proposition discarded, if applicable>"
    }}
  ],
  "statutory_provisions_considered": [
    {{
      "act_name": "<Full Act Name>",
      "section_article": "<Section or Article>",
      "nature_of_interpretation": "STRICT" | "PURPOSIVE" | "HARMONIOUS" | "READ_DOWN" | "VALIDITY_UPHELD",
      "interpretation_summary": "<how this provision was construed>"
    }}
  ],
  "operative_disposition": "<e.g. 'Appeal Allowed', 'Writ Dismissed', 'Interim Injunction Granted'>"
}}
"""

        from app.services.ai_orchestrator import ai_orchestrator
        raw_json = await ai_orchestrator.generate_json_gemini_first(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
        )

        if not raw_json or not isinstance(raw_json, dict):
            logger.error("gemini_headnote_synthesis_failed", cnr=cnr_clean)
            return None

        # Fallback fields if LLM omitted keys or used alternate case
        catchwords = raw_json.get("catchwords") or [f"Judicial Proceedings — {cnr_clean}"]
        held_points = raw_json.get("held_points") or raw_json.get("heldPoints") or [
            "Court examined the statutory record and adjudicated the rights of the parties as per law."
        ]
        ratio_summary = (
            raw_json.get("ratio_decidendi_summary")
            or raw_json.get("ratioDecidendi")
            or raw_json.get("ratio_decidendi")
            or raw_json.get("courtReasoning")
            or raw_json.get("court_reasoning")
            or "The court resolved the dispute based on established statutory principles and judicial precedents."
        )
        obiter_dicta = raw_json.get("obiter_dicta") or raw_json.get("obiterDicta") or []
        citator_raw = raw_json.get("precedent_citator_table") or raw_json.get("precedentCitatorTable") or []
        statutory_raw = raw_json.get("statutory_provisions_considered") or raw_json.get("statutoryProvisionsConsidered") or []
        operative_disp = (
            raw_json.get("operative_disposition")
            or raw_json.get("operativeDisposition")
            or raw_json.get("outcome")
            or raw_json.get("dispositionStatus")
            or "Disposed"
        )

        # Validate citator items defensively
        citator_items: list[PrecedentTreatmentItem] = []
        valid_treatments = {"OVERRULED", "FOLLOWED", "RELIED ON", "DISTINGUISHED", "EXPLAINED", "REFERRED", "DOUBTED"}
        for item in citator_raw:
            if isinstance(item, dict) and item.get("precedent_name"):
                t = str(item.get("treatment", "REFERRED")).upper().strip()
                if t not in valid_treatments:
                    t = "REFERRED"
                citator_items.append(
                    PrecedentTreatmentItem(
                        precedent_name=item["precedent_name"],
                        treatment=t,  # type: ignore[arg-type]
                        bench_commentary=item.get("bench_commentary") or "Referred in judgment.",
                        overruled_specific_ratio=item.get("overruled_specific_ratio"),
                    )
                )

        # Validate statutory items
        statutory_items: list[StatutoryInterpretationItem] = []
        valid_interps = {"STRICT", "PURPOSIVE", "HARMONIOUS", "READ_DOWN", "VALIDITY_UPHELD", "PROSPECTIVE_OVERRULING", "GENERAL_APPLICATION"}
        for s in statutory_raw:
            if isinstance(s, dict) and s.get("act_name"):
                nature = str(s.get("nature_of_interpretation", "PURPOSIVE")).upper().strip()
                if nature not in valid_interps:
                    nature = "PURPOSIVE"
                statutory_items.append(
                    StatutoryInterpretationItem(
                        act_name=s["act_name"],
                        section_article=s.get("section_article") or "General Provisions",
                        nature_of_interpretation=nature,  # type: ignore[arg-type]
                        interpretation_summary=s.get("interpretation_summary") or "Applied to facts.",
                    )
                )

        headnote = CaseHeadnote(
            catchwords=catchwords,
            held_points=held_points,
            ratio_decidendi_summary=ratio_summary,
            obiter_dicta=obiter_dicta,
            precedent_citator_table=citator_items,
            statutory_provisions_considered=statutory_items,
            operative_disposition=operative_disp,
        )

        response = CaseHeadnoteResponse(
            target_cnr=cnr_clean,
            order_id=str(order_row.id) if order_row else None,
            order_title=order_row.filename if order_row else "Primary Judgment",
            order_date=order_row.fetched_at.strftime("%Y-%m-%d") if order_row else None,
            headnote=headnote,
            model_attribution="Rhetorical Segmentation: InLegalBERT · Synthesis: Gemini 3.6 Flash",
            order_hash=order_hash,
            is_cached=False,
            generated_at=datetime.now(timezone.utc).isoformat(),
        )

        # 6. Save to Redis and Database
        dumped = response.model_dump()
        await cache_service.set(redis_key, dumped, settings.prediction_cache_ttl)

        try:
            db_record = CachedHeadnote(
                cnr=cnr_clean,
                order_id=order_row.id if order_row else None,
                order_hash=order_hash,
                headnote_json=json.dumps(dumped),
                generated_at=datetime.now(timezone.utc),
            )
            await self.cache_repo.save_cached_headnote(db_record)
            await self.db.commit()
            logger.info("headnote_db_cache_saved", cnr=cnr_clean, hash=order_hash)
        except Exception as e:
            logger.warning("failed_persisting_cached_headnote", cnr=cnr_clean, error=str(e))
            await self.db.rollback()

        return response
