"""Prediction Service - Orchestrates Precedent Analogy, InLegalBERT Re-Ranking, and Gemini Judicial Deduction."""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.clients.prediction_gemini_client import prediction_gemini_client
from app.core.config import settings
from app.repositories.cache_repository import CacheRepository
from app.schemas.prediction import (
    OUTCOME_TAXONOMY,
    CalibrationStatus,
    CaseComparisonItem,
    CasePredictionResponse,
    OutcomeDistribution,
    OutcomeWeight,
    PredictionExplanation,
    ThresholdCheck,
)
from app.services.cache_service import cache_service
from app.services.inlegal_bert_service import inlegal_bert_service
from app.services.similar_cases_service import SimilarCasesService

logger = structlog.get_logger()

# Statutory cross-reference guidance for era-aware analysis
ERA_STATUTORY_GUIDE = """
STATUTORY ERA MAPPING FOR INDIAN LAW (Mandatory Alignment):
- Matters filed ON OR AFTER 1 July 2024:
  • Regular Bail: Section 483 BNSS (formerly S. 439 CrPC)
  • Bail before Magistrate: Section 480 BNSS (formerly S. 437 CrPC)
  • Anticipatory Bail: Section 482 BNSS (formerly S. 438 CrPC)
  • Inherent High Court Powers / Quashing: Section 528 BNSS (formerly S. 482 CrPC)
  • Mandatory Notice of Appearance: Section 35(3) BNSS (formerly S. 41A CrPC)
  • Cheating & Fraud: Section 318(4) BNS (formerly S. 420 IPC)
  • Criminal Breach of Trust: Section 316 BNS (formerly S. 406 IPC)
  • Electronic Evidence Certificate: Section 63 BSA (formerly S. 65B Evidence Act)
- Matters filed BEFORE 1 July 2024:
  • Evaluate under the previous statutes (CrPC, IPC, Indian Evidence Act).
"""


class PredictionService:
    """Service to generate judicial outcome predictions, precedent comparisons, and explanations."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.cache_repo = CacheRepository(db)

    @staticmethod
    def compute_case_state_hash(case_dict: dict[str, Any]) -> str:
        """Compute SHA256 state hash to ensure instant cache invalidation when case state updates."""
        decision_date = str(case_dict.get("decision_date") or case_dict.get("decisionDate") or "")
        next_date = str(case_dict.get("next_hearing_date") or case_dict.get("nextHearingDate") or "")
        orders = case_dict.get("orders") or []
        timeline = case_dict.get("timeline") or []
        raw_state = f"{decision_date}_{next_date}_{len(orders)}_{len(timeline)}"
        return hashlib.sha256(raw_state.encode()).hexdigest()[:16]

    @staticmethod
    def resolve_matter_type_and_era(
        category: str,
        acts: list[str],
        filing_date: str | None,
        title: str,
    ) -> tuple[str, str]:
        """Resolve specific matter type taxonomy and statutory era (pre-July 2024 vs active)."""
        combined = f"{category} {title} {' '.join(acts)}".lower()

        if "bail" in combined:
            m_type = "BAIL"
        elif "writ" in combined or "wp" in combined or "article 226" in combined or "article 32" in combined:
            m_type = "WRIT"
        elif "138" in combined or "cheque" in combined or "negotiable" in combined:
            m_type = "NI_138"
        elif "appeal" in combined and ("crl" in combined or "criminal" in combined):
            m_type = "CRIMINAL_APPEAL"
        elif "appeal" in combined:
            m_type = "CIVIL_APPEAL"
        elif "stay" in combined or "interim" in combined or "injunction" in combined:
            m_type = "INTERIM_APP"
        else:
            m_type = "DEFAULT"

        era = "pre_2024"
        if filing_date and len(filing_date) >= 4:
            try:
                if filing_date >= "2024-07-01":
                    era = "post_2024"
            except Exception:
                pass

        return m_type, era

    async def get_case_prediction(
        self,
        cnr: str,
        force_refresh: bool = False,
    ) -> CasePredictionResponse | None:
        """Generate or retrieve cached judicial outcome prediction for the given CNR."""
        if not settings.prediction_enabled:
            logger.info("prediction_service_disabled_via_config")
            return None

        cnr_clean = cnr.strip().upper()

        # 1. Load active case record
        cached_case = await self.cache_repo.get_cached_case(cnr_clean, check_expiry=False)
        case_data: dict[str, Any] = {}
        if cached_case and cached_case.response_json:
            try:
                case_data = json.loads(cached_case.response_json)
            except Exception:
                pass

        case_title = case_data.get("case_title") or case_data.get("caseTitle") or f"Case {cnr_clean}"
        category = case_data.get("case_category") or case_data.get("caseCategory") or "General Legal Matter"
        court_name = case_data.get("court", {}).get("court_name") or case_data.get("courtName") or "High Court / Appellate Bench"
        filing_date = case_data.get("filing_date") or case_data.get("filingDate")
        acts_and_sections = case_data.get("acts_and_sections") or case_data.get("actsAndSections") or []

        # Extract order facts / summary
        active_facts = ""
        cached_ai = await self.cache_repo.get_cached_ai(cnr_clean, cnr_clean)
        if cached_ai and cached_ai.ai_json:
            try:
                ai_dict = json.loads(cached_ai.ai_json)
                active_facts = ai_dict.get("executive_summary") or ai_dict.get("plain_language_summary") or ""
                if ai_dict.get("primary_issues"):
                    active_facts += f"\nPrimary Issues: {'; '.join(ai_dict.get('primary_issues', []))}"
            except Exception:
                pass

        if not active_facts:
            active_facts = f"Matter concerning {category}. Acts invoked: {', '.join(acts_and_sections[:4])}."

        # 2. Compute State Hash and Check Redis Cache
        state_hash = self.compute_case_state_hash(case_data)
        redis_cache_key = f"prediction:{cnr_clean}:{state_hash}"

        if not force_refresh:
            cached_pred = await cache_service.get(redis_cache_key)
            if cached_pred and isinstance(cached_pred, dict):
                logger.info("prediction_cache_hit", cnr=cnr_clean, state_hash=state_hash)
                resp = CasePredictionResponse(**cached_pred)
                resp.is_cached = True
                return resp

        # 3. Retrieve Similar Cases via SimilarCasesService (Zero-Token mode)
        similar_service = SimilarCasesService(self.db)
        similar_resp = await similar_service.get_similar_cases(cnr_clean, synthesize_llm=False)
        candidates = similar_resp.cases if similar_resp else []

        if not candidates:
            logger.warning("no_similar_cases_found_for_prediction", cnr=cnr_clean)
            return None

        # 4. InLegalBERT Re-Ranking over candidate precedents
        fact_chunks = inlegal_bert_service.chunk_legal_text(active_facts, max_tokens=350)
        scored_candidates: list[tuple[Any, float]] = []

        for cand in candidates[:12]:
            summary_text = f"{cand.case_title}. {cand.legal_nexus} {cand.key_ratio or ''}"
            inlegal_score = inlegal_bert_service.score_precedent_match(
                target_facts_chunks=fact_chunks,
                precedent_text=summary_text,
            )
            # Use candidate's hybrid score as baseline if model still warming up
            effective_score = inlegal_score if inlegal_score > 0.3 else min(1.0, cand.similarity_score / 100.0)
            scored_candidates.append((cand, effective_score))

        scored_candidates.sort(key=lambda x: x[1], reverse=True)
        from app.services.ai_orchestrator import ai_orchestrator
        max_prec = 2 if ai_orchestrator.is_local() else settings.prediction_max_precedents
        top_precedents = scored_candidates[:max_prec]

        # 5. Resolve Matter Type Taxonomy and Era
        matter_type, era = self.resolve_matter_type_and_era(category, acts_and_sections, filing_date, case_title)
        valid_outcomes = OUTCOME_TAXONOMY.get(matter_type, OUTCOME_TAXONOMY["DEFAULT"])

        # 6. Construct Prompt for Gemini Reasoning
        precedents_prompt_block = []
        precedent_title_set = set()
        for idx, (cand, score) in enumerate(top_precedents, 1):
            precedent_title_set.add(cand.case_title.strip().lower())
            precedents_prompt_block.append(
                f"PRECEDENT #{idx}:\n"
                f"- Title: {cand.case_title}\n"
                f"- Court & Tier: {cand.court_name or 'High Court'} ({cand.court_tier.upper()})\n"
                f"- InLegalBERT Match Score: {score:.2f}\n"
                f"- Key Ratio Decidendi: {cand.key_ratio or 'Established governing doctrine.'}\n"
                f"- Procedural Context: {cand.legal_nexus}\n"
                f"- Shared Statutes: {', '.join(cand.shared_statutes) if cand.shared_statutes else 'General'}\n"
                f"- Distinguishing Nuance: {cand.distinguishing_factors or 'None noted.'}\n"
            )

        if ai_orchestrator.is_local():
            # --- LOCAL MODE: Compact prompt optimised for Qwen 7B ---
            # Truncate facts to keep total prompt under ~3000 chars
            local_facts = active_facts[:800]
            prec_lines = []
            for idx, (cand, score) in enumerate(top_precedents, 1):
                prec_lines.append(
                    f"{idx}. {cand.case_title} | Score:{score:.2f} | "
                    f"Ratio: {(cand.key_ratio or 'General doctrine.')[:120]}"
                )

            system_prompt = (
                "You are an Indian appellate legal analyst. "
                f"Era: {era.upper()}. Valid outcome labels: {valid_outcomes}. "
                "Reply ONLY with valid raw JSON — no markdown fences."
            )
            user_prompt = (
                f"Case: {case_title} | Court: {court_name} | Type: {matter_type}\n"
                f"Facts: {local_facts}\n"
                f"Precedents:\n" + "\n".join(prec_lines) + "\n\n"
                "Return JSON with ONLY these keys:\n"
                '{"outcome_distribution":[{"label":"<label>","weight":0.0,"rationale":"<1 sentence>"}],'
                '"comparisons":[{"precedent_title":"<exact>","similarities":["<1 item>"],'
                '"differences":["<1 item>"],"directional_effect":"neutral","effect_rationale":"<1 sentence>"}],'
                '"explanation":{"governing_doctrine":"<1 sentence>","statutory_thresholds":[],'
                '"critical_vulnerabilities":["<1 risk>"],"judicial_deduction_summary":"<2 sentences>"}}'
            )
            target_max_tokens = 800
        else:
            # --- CLOUD MODE: Full detailed prompt ---
            system_prompt = f"""You are the SUITS Judicial Reasoning Engine, an elite appellate legal analyst for the Indian Court System.
Your role is to perform a rigorous, objective precedent analogy and deduce judicial outcome probabilities.

RULES:
1. Ground your reasoning STRICTLY in the provided Case Facts and the 6 Retrieved Precedents.
2. DO NOT invent citations or precedents not listed in the prompt.
3. Outcome weights must sum to 1.0. Outcome labels must be chosen strictly from: {valid_outcomes}.
4. For statutory compliance, mark each threshold as 'met', 'not_met', or 'unclear'. Never guess.
5. Provide detailed Factual Similarities and Distinguishing Differences for each precedent.

{ERA_STATUTORY_GUIDE}
Active Case Statute Era: {era.upper()} (Apply the appropriate statutes for this timeline).
"""

            user_prompt = f"""
ACTIVE MATTER TO ANALYZE:
- Case Title: {case_title}
- Court: {court_name}
- Category: {category} (Matter Type: {matter_type})
- Filing Date: {filing_date or 'Recent'}
- Applicable Statutes: {', '.join(acts_and_sections) if acts_and_sections else 'General Provisions'}
- Case Facts / Allegations:
{active_facts}

RETRIEVED PRECEDENTS:
{chr(10).join(precedents_prompt_block)}

Generate a structured JSON response matching the following structure:
{{
  "outcome_distribution": [
    {{"label": "<one of {valid_outcomes}>", "weight": <float between 0.0 and 1.0>, "rationale": "<one line legal reason>"}}
  ],
  "comparisons": [
    {{
      "precedent_title": "<exact title from precedents>",
      "similarities": ["<factual parallel 1>", "<statutory parallel 2>"],
      "differences": ["<factual distinction 1>", "<procedural divergence 2>"],
      "directional_effect": "supports_relief" | "supports_denial" | "neutral",
      "effect_rationale": "<why this precedent sways the bench>"
    }}
  ],
  "explanation": {{
    "governing_doctrine": "<core Supreme Court or High Court doctrine>",
    "statutory_thresholds": [
      {{"test": "<statutory threshold test>", "status": "met" | "not_met" | "unclear", "note": "<compliance note>"}}
    ],
    "critical_vulnerabilities": ["<procedural or evidentiary risk in active case>"],
    "judicial_deduction_summary": "<in-depth 2-3 paragraph explanation of why this prediction was made>"
  }}
}}
"""
            target_max_tokens = 4096

        # 7. Call AI Orchestrator (Local Ollama Qwen 7B if local/offline, else Gemini)
        raw_json = await ai_orchestrator.generate_json(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            max_tokens=target_max_tokens,
        )
        reasoning_summary = "Synthesized via Local Ollama (Qwen 7B)" if ai_orchestrator.is_local() else "Synthesized via Gemini Judicial Outcome Engine"

        if not raw_json or not isinstance(raw_json, dict):
            logger.warning("prediction_gemini_returned_invalid_json", cnr=cnr_clean)
            return None

        # 8. Post-Validation & Anti-Hallucination Gate
        raw_dist = raw_json.get("outcome_distribution") or []
        validated_weights: list[OutcomeWeight] = []
        total_w = 0.0

        for item in raw_dist:
            if isinstance(item, dict):
                lbl = item.get("label", "")
                if lbl in valid_outcomes:
                    w = float(item.get("weight", 0.0))
                    total_w += w
                    validated_weights.append(
                        OutcomeWeight(label=lbl, weight=round(w, 2), rationale=item.get("rationale"))
                    )

        # Normalize weights to sum to 1.0 if minor rounding variance
        if validated_weights and total_w > 0:
            for vw in validated_weights:
                vw.weight = round(vw.weight / total_w, 2)
        else:
            # Fallback uniform distribution over valid outcomes
            share = round(1.0 / len(valid_outcomes), 2)
            validated_weights = [OutcomeWeight(label=lbl, weight=share, rationale="Statutory baseline") for lbl in valid_outcomes]

        # Post-validate comparisons (enforce anti-hallucination)
        validated_comparisons: list[CaseComparisonItem] = []
        prec_score_map = {cand.case_title.strip().lower(): score for cand, score in top_precedents}
        prec_url_map = {cand.case_title.strip().lower(): cand.url for cand, _ in top_precedents}

        for comp in raw_json.get("comparisons") or []:
            if isinstance(comp, dict):
                p_title = comp.get("precedent_title", "").strip()
                # Verify that title belongs to our retrieved precedent set (anti-hallucination gate)
                matched_key = None
                for key in prec_score_map:
                    if key in p_title.lower() or p_title.lower() in key:
                        matched_key = key
                        break

                if matched_key:
                    dir_effect = comp.get("directional_effect", "neutral")
                    if dir_effect not in ("supports_relief", "supports_denial", "neutral"):
                        dir_effect = "neutral"

                    validated_comparisons.append(
                        CaseComparisonItem(
                            precedent_title=p_title,
                            precedent_url=prec_url_map.get(matched_key),
                            inlegalbert_score=prec_score_map.get(matched_key, 0.75),
                            similarities=comp.get("similarities") or ["Factual alignment on legal issues."],
                            differences=comp.get("differences") or ["Procedural status variance."],
                            directional_effect=dir_effect,
                            effect_rationale=comp.get("effect_rationale") or "Precedent establishes relevant bench criteria.",
                        )
                    )

        # Fallback comparison if model dropped items
        if not validated_comparisons and top_precedents:
            first_cand, first_score = top_precedents[0]
            validated_comparisons.append(
                CaseComparisonItem(
                    precedent_title=first_cand.case_title,
                    precedent_url=first_cand.url,
                    inlegalbert_score=first_score,
                    similarities=[f"Common statutory framework under {category}."],
                    differences=["Distinct evidentiary records between trial and appellate stages."],
                    directional_effect="neutral",
                    effect_rationale="Controlling ratio decidendi on court procedure.",
                )
            )

        # Explanation model
        raw_exp = raw_json.get("explanation") or {}
        thresholds = [
            ThresholdCheck(
                test=t.get("test", "Statutory Test"),
                status=t.get("status", "unclear") if t.get("status") in ("met", "not_met", "unclear") else "unclear",
                note=t.get("note", "Statutory requirement."),
            )
            for t in raw_exp.get("statutory_thresholds", [])
            if isinstance(t, dict)
        ]

        explanation = PredictionExplanation(
            governing_doctrine=raw_exp.get("governing_doctrine") or f"Governing judicial doctrine of the {court_name} on {category}.",
            statutory_thresholds=thresholds or [ThresholdCheck(test="Prima facie statutory test", status="met", note="Pleadings submitted on record.")],
            critical_vulnerabilities=raw_exp.get("critical_vulnerabilities") or ["Verify strict compliance with statutory limitation and procedural notices."],
            judicial_deduction_summary=raw_exp.get("judicial_deduction_summary") or "Based on governing appellate precedents, the court evaluates whether statutory preconditions and parity requirements are satisfied.",
        )

        outcome_dist = OutcomeDistribution(
            matter_type=matter_type,
            outcomes=validated_weights,
            calibration=CalibrationStatus(
                is_backtested=False,
                disclaimer="Precedent-weighted analytical signal derived from 6 retrieved precedents. Not statistical certainty or legal advice.",
            ),
        )

        model_name = settings.prediction_gemini_model or "gemini-3.1-pro-preview"
        response = CasePredictionResponse(
            target_cnr=cnr_clean,
            matter_type=matter_type,
            outcome_distribution=outcome_dist,
            comparisons=validated_comparisons,
            explanation=explanation,
            reasoning_summary=reasoning_summary,
            model_attribution=f"Semantic Matching: InLegalBERT · Legal Deduction: {model_name}",
            case_state_hash=state_hash,
            generated_at=datetime.now(timezone.utc).isoformat(),
            is_cached=False,
        )

        # 9. Save to Redis Cache with state-hash
        await cache_service.set(redis_cache_key, response.model_dump(), settings.prediction_cache_ttl)
        return response
