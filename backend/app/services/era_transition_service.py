"""Criminal Law Era Transition Service (IPC/CrPC/IEA ↔ BNS/BNSS/BSA).

Provides:
1. Bi-directional statutory concordance lookup with InLegalBERT Mode 1 semantic doctrine matching.
2. Case era resolution (NEW_BNS_ERA, LEGACY_IPC_ERA, HYBRID_TRANSITION_ERA).
3. Precedent transposition and court-ready pleading paragraph synthesis via isolated Gemini client.
4. Procedural delta alerts (S. 105 BNSS videography, S. 173(3) preliminary inquiry, S. 187 custody splitting, S. 479 undertrial bail).
5. Redis & SQLite/PostgreSQL caching with state-hash invalidation.
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
from app.clients.openrouter_client import openrouter_client
from app.core.config import settings
from app.data.criminal_statutes_concordance import (
    CRIMINAL_CONCORDANCE_DATA,
    get_all_concordance_pairs,
)
from app.models.cached_case import CachedCase
from app.models.cached_era_analysis import CachedEraAnalysis
from app.models.cached_order import CachedOrder
from app.schemas.era_transition import (
    EraTransitionCaseAnalysis,
    PrecedentSummary,
    PrecedentTranspositionItem,
    StatuteConcordancePair,
    StatutoryDelta,
)
from app.services.cache_service import cache_service
from app.services.case_service import CaseService
from app.services.inlegal_bert_service import inlegal_bert_service

logger = structlog.get_logger()

# Effective date of Bharatiya Nyaya Sanhita, BNSS, and BSA
BNS_ENACTMENT_DATE = datetime(2024, 7, 1, tzinfo=timezone.utc)


class EraTransitionService:
    """Orchestrates criminal statutes concordance, doctrine matching, and pleading transposition."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.case_service = CaseService(db)
        self._doctrine_embeddings: dict[str, list[float]] | None = None

    def _get_doctrine_embeddings(self) -> dict[str, list[float]]:
        """Precompute or lazy-load InLegalBERT embeddings for all concordance doctrines."""
        if self._doctrine_embeddings is not None:
            return self._doctrine_embeddings

        embeddings: dict[str, list[float]] = {}
        for item in CRIMINAL_CONCORDANCE_DATA:
            cid = item["id"]
            text_to_embed = f"{item['concept_doctrine']} {item['doctrine_summary']}"
            embeddings[cid] = inlegal_bert_service.embed_text(text_to_embed)

        self._doctrine_embeddings = embeddings
        return self._doctrine_embeddings

    def lookup_concordance(self, query: str, limit: int = 12) -> list[StatuteConcordancePair]:
        """Search concordance pairs using exact section matching + InLegalBERT semantic matching."""
        if not query or not query.strip():
            # Return top core procedural & substantive pairs
            return [
                StatuteConcordancePair.model_validate(p)
                for p in CRIMINAL_CONCORDANCE_DATA[:limit]
            ]

        query_clean = query.strip()
        query_lower = query_clean.lower()
        # Extract alphanumeric section tokens (e.g., '438', '41A', '173', '302', '65B')
        section_tokens = re.findall(r"\b\d+[A-Za-z]*(?:\(\d+\))?\b", query_clean)

        exact_matches: list[tuple[dict[str, Any], float]] = []
        lexical_matches: list[tuple[dict[str, Any], float]] = []

        for item in CRIMINAL_CONCORDANCE_DATA:
            score = 0.0
            old_sec = item["old_section"].lower()
            new_sec = item["new_section"].lower()

            # 1. Exact section token match with word boundary (avoiding '7' matching '173')
            for token in section_tokens:
                tok_lower = token.lower()
                # Ignore isolated single-digit numbers like '3' or '7' from sentence context unless section is 1 digit
                if len(tok_lower) == 1 and tok_lower.isdigit() and old_sec != tok_lower and new_sec != tok_lower:
                    continue

                if re.search(rf"\b{re.escape(tok_lower)}\b", old_sec) or re.search(rf"\b{re.escape(tok_lower)}\b", new_sec):
                    score += 6.0
                elif tok_lower == item["old_code"].lower() or tok_lower == item["new_code"].lower():
                    score += 2.0

            # 2. Direct string substring matches
            if query_lower in item["concept_doctrine"].lower():
                score += 4.0
            if query_lower in item["old_title"].lower() or query_lower in item["new_title"].lower():
                score += 3.0
            if any(query_lower in p["title"].lower() for p in item.get("landmark_precedents", [])):
                score += 4.0

            # 3. Individual significant keyword matches
            words = [w for w in re.findall(r"[a-z]+", query_lower) if len(w) > 3]
            for w in words:
                if w in item["concept_doctrine"].lower():
                    score += 1.0
                if w in item["doctrine_summary"].lower():
                    score += 0.5

            if score >= 5.0:
                exact_matches.append((item, score))
            elif score > 0:
                lexical_matches.append((item, score))

        # If lexical matches found enough results
        if len(exact_matches) >= 3:
            exact_matches.sort(key=lambda x: x[1], reverse=True)
            return [
                StatuteConcordancePair.model_validate(item)
                for item, _ in exact_matches[:limit]
            ]

        # 3. InLegalBERT Semantic Doctrine Matching for conceptual queries
        # (e.g. 'custodial torture', 'delay in lodging FIR', 'undertrial bail release')
        query_vec = inlegal_bert_service.embed_text(query_clean)
        doctrine_vecs = self._get_doctrine_embeddings()

        semantic_scored: list[tuple[dict[str, Any], float]] = []
        seen_ids = {m[0]["id"] for m in exact_matches}

        for item in CRIMINAL_CONCORDANCE_DATA:
            cid = item["id"]
            if cid in seen_ids:
                continue

            doc_vec = doctrine_vecs.get(cid)
            if doc_vec:
                sim = inlegal_bert_service.compute_similarity(query_vec, doc_vec)
                semantic_scored.append((item, round(sim, 3)))

        semantic_scored.sort(key=lambda x: x[1], reverse=True)

        combined: list[StatuteConcordancePair] = []
        for item, _ in exact_matches:
            combined.append(StatuteConcordancePair.model_validate(item))

        for item, sim in semantic_scored:
            if len(combined) >= limit:
                break
            pair = StatuteConcordancePair.model_validate(item)
            pair.similarity_score = sim
            combined.append(pair)

        return combined

    def determine_case_era(
        self,
        case_data: dict[str, Any],
        orders_text: str = "",
    ) -> tuple[str, str]:
        """Determine applicable statutory era and provide legal explanation."""
        filing_str = case_data.get("filing_date") or case_data.get("registration_date")
        filing_dt: datetime | None = None

        if filing_str:
            try:
                filing_str_clean = filing_str.strip()[:10]
                if "-" in filing_str_clean:
                    parts = [int(p) for p in filing_str_clean.split("-")]
                    if len(parts) == 3:
                        if parts[0] > 1000:  # YYYY-MM-DD
                            filing_dt = datetime(parts[0], parts[1], parts[2], tzinfo=timezone.utc)
                        else:  # DD-MM-YYYY
                            filing_dt = datetime(parts[2], parts[1], parts[0], tzinfo=timezone.utc)
            except Exception:
                pass

        combined_text = f"{case_data.get('acts_sections', '')} {case_data.get('title', '')} {orders_text}".lower()

        has_bns = any(term in combined_text for term in ["bns", "bnss", "bsa", "nyaya sanhita", "nagarik suraksha", "sakshya"])
        has_ipc = any(term in combined_text for term in ["ipc", "crpc", "penal code", "criminal procedure code", "evidence act"])

        if has_bns and has_ipc:
            return (
                "HYBRID_TRANSITION_ERA",
                "Case involves transitional hybrid jurisprudence: charges, FIR, or orders reference both legacy "
                "colonial enactments (IPC/CrPC/IEA) and 2024 enactments (BNS/BNSS/BSA). Precedent transposition is vital "
                "to harmonize procedural compliance."
            )

        if filing_dt and filing_dt >= BNS_ENACTMENT_DATE:
            return (
                "NEW_BNS_ERA",
                f"Case was instituted on {filing_dt.strftime('%d-%b-%Y')}, after the 1 July 2024 enforcement of BNS, BNSS, and BSA. "
                "All primary procedures and charges are governed by the new codes. Historic Supreme Court precedent must be formally transposed."
            )

        if has_bns:
            return (
                "NEW_BNS_ERA",
                "Case record cites provisions of Bharatiya Nyaya Sanhita (BNS) / BNSS / BSA. Proceeding is actively governed "
                "under the 2024 criminal codes."
            )

        return (
            "LEGACY_IPC_ERA",
            "Case was registered under the Indian Penal Code, 1860, Code of Criminal Procedure, 1973, or Indian Evidence Act, 1872. "
            "If ongoing proceedings or appeals extend past 1 July 2024, procedural bridges to BNSS/BSA remain legally relevant."
        )

    def extract_relevant_concordance_pairs(
        self,
        case_data: dict[str, Any],
        orders_text: str = "",
    ) -> list[StatuteConcordancePair]:
        """Extract matching concordance pairs relevant to the specific case record."""
        search_blob = f"{case_data.get('acts_sections', '')} {case_data.get('case_type', '')} {case_data.get('title', '')} {orders_text}".lower()
        matched_ids: set[str] = set()
        matched_pairs: list[StatuteConcordancePair] = []

        for item in CRIMINAL_CONCORDANCE_DATA:
            old_s = item["old_section"].lower()
            new_s = item["new_section"].lower()
            old_c = item["old_code"].lower()
            new_c = item["new_code"].lower()

            # Check if section number is present in case text
            s_tokens = re.findall(r"\b\d+[A-Za-z]*\b", f"{old_s} {new_s}")
            is_matched = False
            for tok in s_tokens:
                pattern = rf"\b{re.escape(tok)}\b"
                if re.search(pattern, search_blob):
                    is_matched = True
                    break

            if is_matched and item["id"] not in matched_ids:
                matched_ids.add(item["id"])
                matched_pairs.append(StatuteConcordancePair.model_validate(item))

        # If no specific criminal sections extracted, provide core procedural anchors based on matter type
        if not matched_pairs:
            case_type = (case_data.get("case_type") or "").lower()
            if "bail" in case_type or "anticipatory" in search_blob:
                core_ids = ["crpc_438_bnss_482", "crpc_439_bnss_483", "crpc_41a_bnss_35_3", "crpc_436a_bnss_479"]
            elif "quash" in case_type or "482" in search_blob:
                core_ids = ["crpc_482_bnss_528", "ipc_420_bns_318_4", "crpc_154_bnss_173"]
            elif "appeal" in case_type or "murder" in search_blob:
                core_ids = ["ipc_302_bns_103", "iea_circumstantial_bsa_panchsheel", "iea_27_bsa_23_2", "crpc_100_165_bnss_105"]
            else:
                # General default criminal bundle
                core_ids = ["crpc_41a_bnss_35_3", "crpc_154_bnss_173", "crpc_438_bnss_482", "crpc_482_bnss_528", "iea_65b_bsa_63"]

            for item in CRIMINAL_CONCORDANCE_DATA:
                if item["id"] in core_ids and item["id"] not in matched_ids:
                    matched_ids.add(item["id"])
                    matched_pairs.append(StatuteConcordancePair.model_validate(item))

        return matched_pairs[:8]

    def _generate_fallback_transposition(
        self,
        pair: StatuteConcordancePair,
        era: str,
    ) -> PrecedentTranspositionItem:
        """Deterministic high-grade pleading synthesis when LLM is unavailable."""
        landmark = pair.landmark_precedents[0] if pair.landmark_precedents else None
        title = landmark.title if landmark else f"Supreme Court Landmark Precedent under {pair.old_code}"
        citation = landmark.citation if landmark else "Supreme Court of India"
        ratio = landmark.ratio if landmark else pair.doctrine_summary

        pleading_para = (
            f"It is respectfully submitted before this Hon'ble Court that while the instant proceeding is styled "
            f"under {pair.new_code} {pair.new_section}, the governing constitutional and statutory principle is squarely "
            f"settled by the Hon'ble Supreme Court in {title} [{citation}]. By operation of Section 8 of the "
            f"General Clauses Act, 1897, where any Central Act repeals and re-enacts with or without modification any provision "
            f"of a former enactment, references in any other statute or judicial instrument to the repealed provision "
            f"shall be construed as references to the provision so re-enacted. Furthermore, the legislative enactment of "
            f"{pair.new_code} {pair.new_section} maintains absolute pari materia identity with erstwhile {pair.old_code} {pair.old_section}. "
            f"Consequently, the ratio decidendi in {title}—mandating that {ratio[:160]}...—remains binding law under Article 141 "
            f"of the Constitution of India and strictly governs the adjudication of the present matter."
        )

        return PrecedentTranspositionItem(
            precedent_title=title,
            citation=citation,
            historic_section_cited=f"Section {pair.old_section} {pair.old_code}",
            transposed_section=f"Section {pair.new_section} {pair.new_code}",
            governing_doctrine=pair.concept_doctrine,
            court_pleading_paragraph=pleading_para,
            statutory_continuity_basis="Section 8, General Clauses Act, 1897 & Pari Materia Doctrine",
            persuasion_ratio=f"The ratio in {title} applies with full force to Section {pair.new_section} {pair.new_code}.",
        )

    async def _synthesize_transpositions_with_gemini(
        self,
        concordance_pairs: list[StatuteConcordancePair],
        case_data: dict[str, Any],
        era: str,
    ) -> list[PrecedentTranspositionItem]:
        """Call AI orchestrator to craft court-ready transposed pleading paragraphs.

        For local Ollama (Qwen 7B), uses the deterministic high-quality fallback directly to
        avoid slow LLM pleading generation. For cloud mode, calls Gemini/OpenRouter with a
        compact prompt limited to the top-2 concordance pairs.
        """
        from app.services.ai_orchestrator import ai_orchestrator

        # --- LOCAL MODE: Use deterministic fallback (zero-token, instant) ---
        if ai_orchestrator.is_local():
            logger.info("era_transition_local_mode_using_deterministic_fallback", pairs=len(concordance_pairs))
            return [self._generate_fallback_transposition(p, era) for p in concordance_pairs[:3]]

        # --- CLOUD MODE: LLM synthesis (limited to top 2 pairs) ---
        top_pairs = concordance_pairs[:2]
        system_prompt = (
            "You are a Senior Supreme Court Criminal Appellate Advocate and Constitutional Jurist. "
            "Transpose landmark Supreme Court ratios (IPC/CrPC/IEA) into new criminal codes (BNS/BNSS/BSA). "
            "Draft court-ready pleading paragraphs usable directly in petitions.\n"
            "Return valid JSON with key \"transpositions\": array of objects with: "
            "precedent_title, citation, historic_section_cited, transposed_section, "
            "governing_doctrine, court_pleading_paragraph, statutory_continuity_basis, persuasion_ratio."
        )

        pairs_summary = []
        for p in top_pairs:
            for prec in p.landmark_precedents[:1]:  # Only top precedent per pair
                pairs_summary.append({
                    "precedent": prec.title,
                    "citation": prec.citation,
                    "ratio": prec.ratio[:200],
                    "historic_section": f"Section {p.old_section} {p.old_code}",
                    "new_section": f"Section {p.new_section} {p.new_code}",
                    "doctrine": p.concept_doctrine,
                })

        user_prompt = (
            f"Case: {case_data.get('title', 'Criminal Matter')} | Era: {era} | "
            f"Type: {case_data.get('case_type', 'Criminal Proceeding')}\n"
            f"Targets: {json.dumps(pairs_summary)}\n"
            "Draft concise pleading paragraphs for each."
        )

        try:
            parsed_json = await ai_orchestrator.generate_json(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                max_tokens=900,
            )

            if parsed_json and "transpositions" in parsed_json and isinstance(parsed_json["transpositions"], list):
                items = []
                for raw in parsed_json["transpositions"]:
                    try:
                        items.append(PrecedentTranspositionItem.model_validate(raw))
                    except Exception as ve:
                        logger.warning("invalid_transposition_item_schema", error=str(ve))
                if items:
                    # Append deterministic fallbacks for remaining pairs not covered by LLM
                    covered_titles = {it.precedent_title.lower() for it in items}
                    for p in concordance_pairs:
                        if len(items) >= 4:
                            break
                        if not any(p.landmark_precedents and p.landmark_precedents[0].title.lower() in covered_titles):
                            items.append(self._generate_fallback_transposition(p, era))
                    return items
        except Exception as exc:
            logger.warning("transposition_synthesis_failed", error=str(exc))

        # Fallback synthesis
        return [self._generate_fallback_transposition(p, era) for p in concordance_pairs]

    async def get_instant_concordance(
        self,
        cnr: str,
    ) -> "EraTransitionInstant | None":
        """Return IPC⟺BNS concordance pairs instantly from the static Python dictionary.

        Zero LLM calls.  Zero tokens.  Runs in <10ms.  Safe to call on every
        criminal case load — the concordance is purely a dict lookup + regex scan.
        """
        from app.schemas.era_transition import EraTransitionInstant
        from datetime import datetime, timezone

        cnr_clean = cnr.strip().upper()

        # 1. Resolve case data from cache (already-fetched eCourts JSON)
        from sqlalchemy import select
        case_row = (
            await self.db.execute(select(CachedCase).where(CachedCase.cnr == cnr_clean))
        ).scalar_one_or_none()

        case_data: dict[str, Any] = {}
        if case_row and getattr(case_row, "response_json", None):
            try:
                case_data = json.loads(case_row.response_json)
            except Exception:
                pass

        if not case_data:
            # Try live fetch if not in cache yet
            try:
                resp = await self.case_service.get_case_details(cnr_clean)
                case_data = resp.model_dump()
            except Exception as e:
                logger.warning("instant_concordance_case_fetch_failed", cnr=cnr_clean, error=str(e))
                return None

        # 2. Resolve most-recent order text (for statute mention scanning)
        from app.models.cached_order import CachedOrder
        order_stmt = (
            select(CachedOrder)
            .where(CachedOrder.cnr == cnr_clean, CachedOrder.markdown.isnot(None))
            .order_by(CachedOrder.fetched_at.desc())
        )
        order_row = (await self.db.execute(order_stmt)).scalars().first()
        orders_text = order_row.markdown[:3000] if order_row and order_row.markdown else ""

        # 3. Determine era (pure date/keyword logic — 0 tokens)
        era, era_explanation = self.determine_case_era(case_data, orders_text)

        # 4. Extract concordance pairs for the specific sections cited (static dict lookup)
        concordance_pairs = self.extract_relevant_concordance_pairs(case_data, orders_text)

        # 5. Derive procedural risks from the concordance deltas (no LLM)
        procedural_risks: list[str] = []
        all_deltas: list[StatutoryDelta] = []
        for p in concordance_pairs:
            for d in p.statutory_deltas:
                all_deltas.append(d)
                warning = f"[{p.new_code} S. {p.new_section}] {d.litigator_warning}"
                if warning not in procedural_risks:
                    procedural_risks.append(warning)

        if not procedural_risks:
            procedural_risks.append(
                "Verify date of alleged commission of offence: offences committed prior to 1 July 2024 "
                "must carry substantive IPC charges pursuant to Article 20(1) ex post facto protections."
            )
            procedural_risks.append(
                "Ensure search & seizure adheres strictly to Section 105 BNSS audio-video electronic "
                "recording mandates where applicable."
            )

        return EraTransitionInstant(
            target_cnr=cnr_clean,
            active_era=era,  # type: ignore[arg-type]
            era_explanation=era_explanation,
            concordance_mappings=concordance_pairs,
            statutory_deltas=all_deltas,
            procedural_risks=procedural_risks[:6],
            source="STATIC_CONCORDANCE_DICT",
        )

    async def analyze_case_transition(
        self,
        cnr: str,
        force_refresh: bool = False,
    ) -> EraTransitionCaseAnalysis | None:
        """Fetch cached era transition analysis or execute full analysis and pleading synthesis."""
        cnr_clean = cnr.strip().upper()

        # 1. Resolve case details
        case_row = (await self.db.execute(select(CachedCase).where(CachedCase.cnr == cnr_clean))).scalar_one_or_none()
        case_data: dict[str, Any] = {}
        if case_row and getattr(case_row, "response_json", None):
            try:
                case_data = json.loads(case_row.response_json)
            except Exception:
                pass

        if not case_data:
            try:
                resp = await self.case_service.get_case_details(cnr_clean)
                case_data = resp.model_dump()
            except Exception as e:
                logger.warning("case_details_resolution_failed", cnr=cnr_clean, error=str(e))

        # Resolve order markdown if present
        order_stmt = (
            select(CachedOrder)
            .where(CachedOrder.cnr == cnr_clean, CachedOrder.markdown.isnot(None))
            .order_by(CachedOrder.fetched_at.desc())
        )
        order_row = (await self.db.execute(order_stmt)).scalars().first()
        orders_text = order_row.markdown[:3000] if order_row and order_row.markdown else ""

        # 2. State hash calculation
        state_repr = f"{cnr_clean}:{case_data.get('filing_date')}:{case_data.get('acts_sections')}:{len(orders_text)}"
        case_state_hash = hashlib.sha256(state_repr.encode("utf-8")).hexdigest()[:16]
        redis_key = f"era_transition:{cnr_clean}:{case_state_hash}"

        # 3. Cache Check
        if not force_refresh:
            cached_val = await cache_service.get(redis_key)
            if cached_val and isinstance(cached_val, dict):
                return EraTransitionCaseAnalysis.model_validate(cached_val)

            # Database check
            stmt = select(CachedEraAnalysis).where(
                CachedEraAnalysis.cnr == cnr_clean,
                CachedEraAnalysis.case_state_hash == case_state_hash,
            )
            db_row = (await self.db.execute(stmt)).scalar_one_or_none()
            if db_row and db_row.analysis_json:
                try:
                    loaded = json.loads(db_row.analysis_json)
                    analysis = EraTransitionCaseAnalysis.model_validate(loaded)
                    await cache_service.set(redis_key, analysis.model_dump(), settings.prediction_cache_ttl)
                    return analysis
                except Exception as e:
                    logger.warning("corrupt_cached_era_analysis", error=str(e))

        # 4. Pipeline Execution
        era, era_explanation = self.determine_case_era(case_data, orders_text)
        concordance_pairs = self.extract_relevant_concordance_pairs(case_data, orders_text)

        # Gather deltas and procedural risks
        all_deltas: list[StatutoryDelta] = []
        procedural_risks: list[str] = []
        for p in concordance_pairs:
            for d in p.statutory_deltas:
                all_deltas.append(d)
                if d.litigator_warning and d.litigator_warning not in procedural_risks:
                    procedural_risks.append(f"[{p.new_code} S. {p.new_section}] {d.litigator_warning}")

        # If general criminal risks needed
        if not procedural_risks:
            procedural_risks.append(
                "Verify date of alleged commission of offence: offences committed prior to 1 July 2024 "
                "must be substantive charges under IPC pursuant to Article 20(1) ex post facto protections."
            )
            procedural_risks.append(
                "Ensure search & seizure adheres strictly to Section 105 BNSS audio-video electronic recording mandates."
            )

        # 5. Gemini Precedent Transposition & Court Pleading Synthesis
        transposed_items = await self._synthesize_transpositions_with_gemini(
            concordance_pairs, case_data, era
        )

        analysis = EraTransitionCaseAnalysis(
            target_cnr=cnr_clean,
            active_era=era,  # type: ignore[arg-type]
            era_explanation=era_explanation,
            concordance_mappings=concordance_pairs,
            statutory_deltas=all_deltas,
            transposed_precedents=transposed_items,
            procedural_risks=procedural_risks[:6],
            model_attribution="InLegalBERT Mode 1 + Gemini 3.6 Flash",
            generated_at=datetime.now(timezone.utc).isoformat(),
        )

        # 6. Save to Cache & DB
        dumped = analysis.model_dump()
        dumped_json = json.dumps(dumped)

        try:
            await cache_service.set(redis_key, dumped, settings.prediction_cache_ttl)

            # Insert or replace in database
            stmt = select(CachedEraAnalysis).where(
                CachedEraAnalysis.cnr == cnr_clean,
                CachedEraAnalysis.case_state_hash == case_state_hash,
            )
            existing_row = (await self.db.execute(stmt)).scalar_one_or_none()
            if existing_row:
                existing_row.analysis_json = dumped_json
                existing_row.generated_at = datetime.now(timezone.utc)
            else:
                new_row = CachedEraAnalysis(
                    cnr=cnr_clean,
                    case_state_hash=case_state_hash,
                    analysis_json=dumped_json,
                )
                self.db.add(new_row)
            await self.db.commit()
            logger.info("era_transition_analysis_saved", cnr=cnr_clean, era=era)
        except Exception as exc:
            logger.warning("era_transition_cache_write_failed", error=str(exc))
            await self.db.rollback()

        return analysis
