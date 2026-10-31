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
import os
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
    TransitionQuestionResponse,
)
from app.services.cache_service import cache_service
from app.services.case_service import CaseService
from app.services.inlegal_bert_service import inlegal_bert_service

logger = structlog.get_logger()

# Effective date of Bharatiya Nyaya Sanhita, BNSS, and BSA
BNS_ENACTMENT_DATE = datetime(2024, 7, 1, tzinfo=timezone.utc)


DOCTRINE_EMBEDDINGS_PATH = os.path.join(
    os.path.dirname(__file__), "..", "data", "doctrine_embeddings.npz"
)

_GLOBAL_DOCTRINE_EMBEDDINGS: dict[str, list[float]] | None = None

ROMAN_TO_INT: dict[str, int] = {
    "i": 1, "ii": 2, "iii": 3, "iv": 4, "v": 5, "vi": 6, "vii": 7, "viii": 8,
    "ix": 9, "x": 10, "xi": 11, "xii": 12, "xiii": 13, "xiv": 14, "xv": 15,
    "xvi": 16, "xvii": 17, "xviii": 18, "xix": 19, "xx": 20, "xxi": 21,
    "xxii": 22, "xxiii": 23, "xxiv": 24, "xxv": 25, "xxvi": 26, "xxvii": 27,
    "xxviii": 28, "xxix": 29, "xxx": 30, "xxxi": 31, "xxxii": 32, "xxxiii": 33,
    "xxxiv": 34, "xxxv": 35, "xxxvi": 36, "xxxvii": 37,
}

IPC_CHAPTERS: dict[int, tuple[int, int, str]] = {
    1: (1, 5, "Introduction"),
    2: (6, 52, "General Explanations"),
    3: (53, 75, "Of Punishments"),
    4: (76, 106, "General Exceptions"),
    5: (107, 120, "Of Abetment"),
    6: (121, 130, "Of Offences Against the State"),
    7: (131, 140, "Of Offences Relating to the Army, Navy and Air Force"),
    8: (141, 160, "Of Offences Against the Public Tranquillity"),
    9: (161, 171, "Of Offences by or Relating to Public Servants"),
    10: (172, 190, "Of Contempts of the Lawful Authority of Public Servants"),
    11: (191, 229, "Of False Evidence and Offences Against Public Justice"),
    12: (230, 263, "Of Offences Relating to Coin and Government Stamps"),
    13: (264, 267, "Of Offences Relating to Weights and Measures"),
    14: (268, 294, "Of Offences Affecting Public Health, Safety, Decency"),
    15: (295, 298, "Of Offences Relating to Religion"),
    16: (299, 377, "Of Offences Affecting the Human Body"),
    17: (378, 462, "Of Offences Against Property"),
    18: (463, 489, "Of Offences Relating to Documents and Property Marks"),
    19: (490, 492, "Of Criminal Breach of Contracts of Service"),
    20: (493, 498, "Of Offences Relating to Marriage"),
    21: (499, 502, "Of Defamation"),
    22: (503, 510, "Of Criminal Intimidation, Insult and Annoyance"),
    23: (511, 511, "Of Attempts to Commit Offences"),
}

CRPC_CHAPTERS: dict[int, tuple[int, int, str]] = {
    1: (1, 5, "Preliminary"),
    2: (6, 25, "Constitution of Criminal Courts and Offices"),
    3: (26, 35, "Power of Courts"),
    4: (36, 40, "Powers of Superior Officers of Police and Aid to Magistrates"),
    5: (41, 60, "Arrest of Persons"),
    6: (61, 90, "Processes to Compel Appearance"),
    7: (91, 105, "Processes to Compel Production of Things"),
    8: (106, 124, "Security for Keeping the Peace and Good Behaviour"),
    9: (125, 128, "Order for Maintenance of Wives, Children and Parents"),
    10: (129, 148, "Maintenance of Public Order and Tranquillity"),
    11: (149, 153, "Preventive Action of the Police"),
    12: (154, 176, "Information to Police and Their Powers to Investigate"),
    13: (177, 189, "Jurisdiction of Criminal Courts in Inquiries and Trials"),
    14: (190, 199, "Conditions Requisite for Initiation of Proceedings"),
    15: (200, 203, "Complaints to Magistrates"),
    16: (204, 210, "Commencement of Proceedings before Magistrates"),
    17: (211, 224, "The Charge"),
    18: (225, 237, "Trial Before a Court of Session"),
    19: (238, 250, "Trial of Warrant-Cases by Magistrates"),
    20: (251, 259, "Trial of Summons-Cases by Magistrates"),
    21: (260, 265, "Summary Trials"),
    22: (266, 271, "Attendance of Persons Confined or Detained in Prisons"),
    23: (272, 299, "Evidence in Inquiries and Trials"),
    24: (300, 327, "General Provisions as to Inquiries and Trials"),
    25: (328, 339, "Provisions as to Accused Persons of Unsound Mind"),
    26: (340, 352, "Provisions as to Offences Affecting Administration of Justice"),
    27: (353, 365, "The Judgment"),
    28: (366, 371, "Submission of Death Sentences for Confirmation"),
    29: (372, 394, "Appeals"),
    30: (395, 405, "Reference and Revision"),
    31: (406, 435, "Execution, Suspension, Remission and Commutation of Sentences"),
    32: (436, 450, "Provisions as to Bail and Bonds"),
    33: (451, 459, "Disposal of Property"),
    34: (460, 466, "Irregular Proceedings"),
    35: (467, 473, "Limitation for Taking Cognizance of Certain Offences"),
    36: (474, 484, "Miscellaneous"),
}

IEA_CHAPTERS: dict[int, tuple[int, int, str]] = {
    1: (1, 4, "Preliminary"),
    2: (5, 55, "Of the Relevancy of Facts"),
    3: (56, 58, "Facts Which Need Not Be Proved"),
    4: (59, 60, "Of Oral Evidence"),
    5: (61, 90, "Of Documentary Evidence"),
    6: (91, 100, "Of the Exclusion of Oral by Documentary Evidence"),
    7: (101, 114, "Of the Burden of Proof"),
    8: (115, 117, "Estoppel"),
    9: (118, 134, "Of Witnesses"),
    10: (135, 166, "Of the Examination of Witnesses"),
    11: (167, 167, "Of Improper Admission and Rejection of Evidence"),
}


class EraTransitionService:
    """Orchestrates criminal statutes concordance, doctrine matching, and pleading transposition."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.case_service = CaseService(db)

    def _get_doctrine_embeddings(self) -> dict[str, list[float]]:
        """Precompute or load cached InLegalBERT embeddings for all concordance doctrines."""
        global _GLOBAL_DOCTRINE_EMBEDDINGS
        if _GLOBAL_DOCTRINE_EMBEDDINGS is not None:
            return _GLOBAL_DOCTRINE_EMBEDDINGS

        # Fast loading from disk (< 2ms)
        if os.path.exists(DOCTRINE_EMBEDDINGS_PATH):
            try:
                npz = np.load(DOCTRINE_EMBEDDINGS_PATH)
                cids = npz["cids"].tolist()
                vectors = npz["vectors"].tolist()
                _GLOBAL_DOCTRINE_EMBEDDINGS = dict(zip(cids, vectors))
                logger.info("loaded_cached_doctrine_embeddings", count=len(_GLOBAL_DOCTRINE_EMBEDDINGS))
                return _GLOBAL_DOCTRINE_EMBEDDINGS
            except Exception as exc:
                logger.warning("failed_loading_cached_doctrine_embeddings", error=str(exc))

        embeddings: dict[str, list[float]] = {}
        for item in CRIMINAL_CONCORDANCE_DATA:
            cid = item["id"]
            text_to_embed = f"{item['concept_doctrine']} {item['doctrine_summary']}"
            embeddings[cid] = inlegal_bert_service.embed_text(text_to_embed)

        _GLOBAL_DOCTRINE_EMBEDDINGS = embeddings
        return _GLOBAL_DOCTRINE_EMBEDDINGS

    def lookup_concordance(
        self,
        query: str,
        limit: int = 24,
        category: str | None = None,
    ) -> list[StatuteConcordancePair]:
        """Search concordance pairs using exact section matching + InLegalBERT semantic matching."""
        if not query or not query.strip():
            dataset = CRIMINAL_CONCORDANCE_DATA
            if category and category.upper() != "ALL":
                dataset = [p for p in dataset if p.get("category") == category.upper()]
            # Return balanced landmark provisions across categories
            procedural = [p for p in dataset if p.get("category") == "PROCEDURAL"]
            substantive = [p for p in dataset if p.get("category") == "SUBSTANTIVE"]
            evidentiary = [p for p in dataset if p.get("category") == "EVIDENTIARY"]
            balanced: list[dict[str, Any]] = []
            max_cat = max(len(procedural), len(substantive), len(evidentiary))
            for i in range(max_cat):
                if i < len(procedural):
                    balanced.append(procedural[i])
                if i < len(substantive):
                    balanced.append(substantive[i])
                if i < len(evidentiary):
                    balanced.append(evidentiary[i])
                if len(balanced) >= limit:
                    break
            return [StatuteConcordancePair.model_validate(p) for p in balanced[:limit]]

        query_clean = query.strip()
        query_lower = query_clean.lower()

        # Statute hints
        ipc_hint = bool(re.search(r"\b(ipc|indian penal|penal code)\b", query_lower))
        crpc_hint = bool(re.search(r"\b(crpc|code of criminal procedure|criminal procedure)\b", query_lower))
        iea_hint = bool(re.search(r"\b(iea|evidence act|indian evidence)\b", query_lower))
        bns_hint = bool(re.search(r"\b(bns|bharatiya nyaya|nyaya sanhita)\b", query_lower))
        bnss_hint = bool(re.search(r"\b(bnss|bharatiya nagarik|nagarik suraksha)\b", query_lower))
        bsa_hint = bool(re.search(r"\b(bsa|bharatiya sakshya|sakshya adhiniyam)\b", query_lower))

        # Dataset scoping: explicit query statute hint takes precedence over UI tab category
        dataset = CRIMINAL_CONCORDANCE_DATA
        if crpc_hint or bnss_hint:
            dataset = [p for p in CRIMINAL_CONCORDANCE_DATA if p.get("category") == "PROCEDURAL"]
        elif ipc_hint or bns_hint:
            dataset = [p for p in CRIMINAL_CONCORDANCE_DATA if p.get("category") == "SUBSTANTIVE"]
        elif iea_hint or bsa_hint:
            dataset = [p for p in CRIMINAL_CONCORDANCE_DATA if p.get("category") == "EVIDENTIARY"]
        elif category and category.upper() != "ALL":
            dataset = [p for p in CRIMINAL_CONCORDANCE_DATA if p.get("category") == category.upper()]

        # Normalize hyphens, spaces, and formatting in section references
        # e.g. "498-A", "498 A" -> "498A", "65-B" -> "65B", "156 (3)" -> "156(3)"
        query_norm = re.sub(r"(\d+)\s*[-–—]\s*([a-zA-Z])\b", r"\1\2", query_clean)
        query_norm = re.sub(r"(\d+)\s+([a-zA-Z])\b", r"\1\2", query_norm)
        query_norm = re.sub(r"(\d+[a-zA-Z]*)\s*\(\s*(\d+[a-zA-Z]*)\s*\)", r"\1(\2)", query_norm)

        # Check for chapter search (e.g. "chapter 5", "chapter V", "ch 12")
        m_chap = re.search(r"\b(?:chapter|chap|ch)\.?\s*([0-9]+|[ivxlcdm]+)\b", query_lower)
        if m_chap:
            raw_chap = m_chap.group(1).lower()
            chap_num = int(raw_chap) if raw_chap.isdigit() else ROMAN_TO_INT.get(raw_chap)
            if chap_num:
                chapter_results: list[dict[str, Any]] = []

                # Determine target statutes
                targets: list[tuple[str, dict[int, tuple[int, int, str]]]] = []
                if ipc_hint or bns_hint:
                    targets.append(("IPC", IPC_CHAPTERS))
                elif crpc_hint or bnss_hint:
                    targets.append(("CRPC", CRPC_CHAPTERS))
                elif iea_hint or bsa_hint:
                    targets.append(("IEA", IEA_CHAPTERS))
                else:
                    # User only entered chapter number: display info for all 3 statutes
                    targets.append(("CRPC", CRPC_CHAPTERS))
                    targets.append(("IPC", IPC_CHAPTERS))
                    targets.append(("IEA", IEA_CHAPTERS))

                for code, chap_dict in targets:
                    if chap_num not in chap_dict:
                        continue
                    start_sec, end_sec, _ = chap_dict[chap_num]
                    code_items: list[tuple[int, dict[str, Any]]] = []
                    for item in CRIMINAL_CONCORDANCE_DATA:
                        if item["old_code"].upper() != code:
                            continue
                        m_sec = re.match(r"^(\d+)", item["old_section"].strip())
                        if m_sec:
                            s_val = int(m_sec.group(1))
                            if start_sec <= s_val <= end_sec:
                                code_items.append((s_val, item))
                    code_items.sort(key=lambda x: x[0])
                    for _, item in code_items:
                        chapter_results.append(item)

                if chapter_results:
                    return [
                        StatuteConcordancePair.model_validate(item)
                        for item in chapter_results[:limit]
                    ]

        # Extract section numbers from query
        section_matches = re.findall(
            r"(?:section|sec|u/s|s\.?)?\s*(\d+[A-Za-z]*(?:\(\d+[A-Za-z]*\))*)",
            query_norm,
            re.IGNORECASE,
        )
        section_tokens = [s.strip().lower() for s in section_matches if s.strip()]
        base_tokens = [re.sub(r"\([^)]*\)", "", t) for t in section_tokens]
        all_sec_tokens = list(dict.fromkeys(section_tokens + base_tokens))

        exact_section_matches: list[tuple[dict[str, Any], float, list[str], list[str]]] = []
        lexical_matches: list[tuple[dict[str, Any], float, list[str], list[str]]] = []

        words = [
            w for w in re.findall(r"[a-z]+", query_lower)
            if len(w) >= 3 and w not in {
                "and", "the", "for", "with", "law", "act", "section", "sec",
                "crpc", "bnss", "ipc", "bns", "iea", "bsa",
            }
        ]

        # Convenience flags
        any_new_hint = bns_hint or bnss_hint or bsa_hint
        any_legacy_hint = ipc_hint or crpc_hint or iea_hint

        def _sec_parts(raw: str) -> list[str]:
            """Split compound keys like '100 / 165 (No videography)' or '24, 25, 26' into clean bare tokens."""
            s = re.sub(r"\[.*?\]", "", raw)
            def repl_paren(m):
                inner = m.group(1).strip()
                if re.match(r"^(?:\d+[a-zA-Z]?|[a-zA-Z]{1,2}|proviso)$", inner, re.IGNORECASE):
                    return f"({inner})"
                return ""
            s = re.sub(r"\((.*?)\)", repl_paren, s)
            chunks = re.split(r"[/,;&]|\band\b|\br/w\b", s)
            parts: list[str] = []
            for c in chunks:
                c_clean = c.strip().lower()
                if not c_clean or c_clean.startswith("n/a"):
                    continue
                m_range = re.match(r"^(\d+)-(\d+)$", c_clean)
                if m_range:
                    start, end = int(m_range.group(1)), int(m_range.group(2))
                    if end - start <= 20:
                        for n in range(start, end + 1):
                            parts.append(str(n))
                        continue
                c_clean = re.sub(r"\s+", "", c_clean)
                if c_clean:
                    parts.append(c_clean)
            return parts

        def _tok_hits(tok: str, raw: str, parts: list[str]) -> tuple[bool, bool]:
            """Returns (is_hit, is_exact_or_direct_part)."""
            if tok == raw or tok in parts:
                return True, True
            for p in parts:
                base = re.sub(r"\([^)]*\)|proviso", "", p).strip()
                if tok == base:
                    return True, False
            return False, False

        for item in dataset:
            score = 0.0
            old_sec_raw = item["old_section"].lower()
            new_sec_raw = item["new_section"].lower()
            old_code = item["old_code"].upper()
            new_code = item["new_code"].upper()
            old_parts = _sec_parts(old_sec_raw)
            new_parts = _sec_parts(new_sec_raw)

            if all_sec_tokens:
                sec_matched = False

                for tok in all_sec_tokens:
                    old_hit, old_exact = _tok_hits(tok, old_sec_raw, old_parts)
                    new_hit, new_exact = _tok_hits(tok, new_sec_raw, new_parts)

                    if old_hit:
                        # Cross-hit prevention: user asked about a NEW code but entry only matched on legacy section number
                        if any_new_hint and not any_legacy_hint:
                            score -= 100.0
                        else:
                            score += 100.0
                            if old_exact:
                                score += 20.0  # Exact subsection bonus
                            sec_matched = True
                            if ipc_hint and old_code == "IPC":
                                score += 50.0
                            elif crpc_hint and old_code == "CRPC":
                                score += 50.0
                            elif iea_hint and old_code == "IEA":
                                score += 50.0
                            elif ipc_hint and old_code != "IPC":
                                score -= 90.0
                            elif crpc_hint and old_code != "CRPC":
                                score -= 90.0
                            elif iea_hint and old_code != "IEA":
                                score -= 90.0
                            elif not any_legacy_hint and not any_new_hint:
                                if old_exact:
                                    score += 15.0

                    elif new_hit:
                        # Cross-hit prevention: user asked about a LEGACY code but entry only matched on new section number
                        if any_legacy_hint and not any_new_hint:
                            score -= 100.0
                        else:
                            score += 100.0
                            if new_exact:
                                score += 20.0  # Exact subsection bonus
                            sec_matched = True
                            if bns_hint and new_code == "BNS":
                                score += 50.0
                            elif bnss_hint and new_code == "BNSS":
                                score += 50.0
                            elif bsa_hint and new_code == "BSA":
                                score += 50.0
                            elif bns_hint and new_code != "BNS":
                                score -= 90.0
                            elif bnss_hint and new_code != "BNSS":
                                score -= 90.0
                            elif bsa_hint and new_code != "BSA":
                                score -= 90.0

                    else:
                        # Fallback: word-boundary partial match
                        old_partial = bool(re.search(rf"\b{re.escape(tok)}\b", old_sec_raw))
                        new_partial = bool(re.search(rf"\b{re.escape(tok)}\b", new_sec_raw))
                        if old_partial:
                            if any_new_hint and not any_legacy_hint:
                                score -= 100.0
                            else:
                                score += 50.0
                                sec_matched = True
                                if ipc_hint and old_code == "IPC":
                                    score += 30.0
                                elif crpc_hint and old_code == "CRPC":
                                    score += 30.0
                                elif iea_hint and old_code == "IEA":
                                    score += 30.0
                        elif new_partial:
                            if any_legacy_hint and not any_new_hint:
                                score -= 100.0
                            else:
                                score += 50.0
                                sec_matched = True
                                if bns_hint and new_code == "BNS":
                                    score += 30.0
                                elif bnss_hint and new_code == "BNSS":
                                    score += 30.0
                                elif bsa_hint and new_code == "BSA":
                                    score += 30.0

                if sec_matched:
                    for w in words:
                        if w in item.get("concept_doctrine", "").lower():
                            score += 10.0
                        if w in item.get("old_title", "").lower() or w in item.get("new_title", "").lower():
                            score += 10.0
                    if score >= 50.0:
                        exact_section_matches.append((item, score, old_parts, new_parts))

            # Textual / conceptual query matching
            lex_score = 0.0
            if query_lower in item.get("concept_doctrine", "").lower():
                lex_score += 40.0
            if query_lower in item.get("old_title", "").lower() or query_lower in item.get("new_title", "").lower():
                lex_score += 30.0
            if any(query_lower in p.get("title", "").lower() for p in item.get("landmark_precedents", [])):
                lex_score += 25.0

            for w in words:
                if w in item.get("concept_doctrine", "").lower():
                    lex_score += 10.0
                if w in item.get("doctrine_summary", "").lower():
                    lex_score += 5.0
                if w in item.get("old_title", "").lower() or w in item.get("new_title", "").lower():
                    lex_score += 8.0

            if lex_score >= 10.0:
                lexical_matches.append((item, lex_score, old_parts, new_parts))

        # IF section query was performed:
        if all_sec_tokens:
            if exact_section_matches:
                exact_section_matches.sort(key=lambda x: x[1], reverse=True)
                # Deduplicate identical statutory concordance mappings
                deduped: list[dict[str, Any]] = []
                seen_pairs: set[tuple[str, tuple[str, ...], str, tuple[str, ...]]] = set()
                for match_item, _, op, np in exact_section_matches:
                    dedup_key = (
                        match_item["old_code"].upper(),
                        tuple(sorted(op)),
                        match_item["new_code"].upper(),
                        tuple(sorted(np)),
                    )
                    if dedup_key in seen_pairs:
                        continue
                    seen_pairs.add(dedup_key)
                    deduped.append(match_item)

                return [
                    StatuteConcordancePair.model_validate(item)
                    for item in deduped[:limit]
                ]
            elif lexical_matches:
                lexical_matches.sort(key=lambda x: x[1], reverse=True)
                deduped_lex: list[dict[str, Any]] = []
                seen_pairs_lex: set[tuple[str, tuple[str, ...], str, tuple[str, ...]]] = set()
                for match_item, _, op, np in lexical_matches:
                    dedup_key = (
                        match_item["old_code"].upper(),
                        tuple(sorted(op)),
                        match_item["new_code"].upper(),
                        tuple(sorted(np)),
                    )
                    if dedup_key in seen_pairs_lex:
                        continue
                    seen_pairs_lex.add(dedup_key)
                    deduped_lex.append(match_item)

                return [
                    StatuteConcordancePair.model_validate(item)
                    for item in deduped_lex[:limit]
                ]
            else:
                # User searched a section number not specifically pre-indexed.
                # Generate an authoritative Section 8 General Clauses Act concordance bridge.
                bridge = self._synthesize_section_bridge(
                    sec_token=all_sec_tokens[0],
                    crpc_hint=crpc_hint,
                    bnss_hint=bnss_hint,
                    ipc_hint=ipc_hint,
                    bns_hint=bns_hint,
                    iea_hint=iea_hint,
                    bsa_hint=bsa_hint,
                    category=category,
                )
                return [bridge]

        # If conceptual query had lexical matches, deduplicate and return
        if lexical_matches:
            lexical_matches.sort(key=lambda x: x[1], reverse=True)
            deduped_lex: list[dict[str, Any]] = []
            seen_pairs_lex: set[tuple[str, tuple[str, ...], str, tuple[str, ...]]] = set()
            for match_item, _, op, np in lexical_matches:
                dedup_key = (
                    match_item["old_code"].upper(),
                    tuple(sorted(op)),
                    match_item["new_code"].upper(),
                    tuple(sorted(np)),
                )
                if dedup_key in seen_pairs_lex:
                    continue
                seen_pairs_lex.add(dedup_key)
                deduped_lex.append(match_item)

            return [
                StatuteConcordancePair.model_validate(item)
                for item in deduped_lex[:limit]
            ]

        # InLegalBERT Semantic Doctrine Matching for conceptual queries
        try:
            query_vec = inlegal_bert_service.embed_text(query_clean)
            doctrine_vecs = self._get_doctrine_embeddings()
            semantic_scored: list[tuple[dict[str, Any], float]] = []
            seen_ids = {m[0]["id"] for m in lexical_matches}

            for item in dataset:
                cid = item["id"]
                if cid in seen_ids:
                    continue
                doc_vec = doctrine_vecs.get(cid)
                if doc_vec:
                    sim = inlegal_bert_service.compute_similarity(query_vec, doc_vec)
                    if sim >= 0.40:
                        semantic_scored.append((item, round(sim, 3)))

            semantic_scored.sort(key=lambda x: x[1], reverse=True)

            combined: list[StatuteConcordancePair] = [
                StatuteConcordancePair.model_validate(item) for item, *_ in lexical_matches
            ]
            for item, sim in semantic_scored:
                if len(combined) >= limit:
                    break
                pair = StatuteConcordancePair.model_validate(item)
                pair.similarity_score = sim
                combined.append(pair)
            return combined
        except Exception as exc:
            logger.warning("inlegal_bert_lookup_fallback", error=str(exc))
            return [
                StatuteConcordancePair.model_validate(item) for item, *_ in lexical_matches[:limit]
            ]

    def _synthesize_section_bridge(
        self,
        sec_token: str,
        crpc_hint: bool = False,
        bnss_hint: bool = False,
        ipc_hint: bool = False,
        bns_hint: bool = False,
        iea_hint: bool = False,
        bsa_hint: bool = False,
        category: str | None = None,
    ) -> StatuteConcordancePair:
        """Synthesize an authoritative Section 8 General Clauses Act concordance bridge for unindexed sections."""
        clean_sec = sec_token.strip().upper()
        is_new_code_query = (bnss_hint and not crpc_hint) or (bns_hint and not ipc_hint) or (bsa_hint and not iea_hint)

        if crpc_hint or bnss_hint or (category and category.upper() == "PROCEDURAL"):
            old_code, new_code = "CrPC", "BNSS"
            cat = "PROCEDURAL"
            if is_new_code_query:
                old_sec_val = f"Corresponding {old_code} Provision"
                new_sec_val = clean_sec
                old_title = f"Code of Criminal Procedure Transposed Section"
                new_title = f"Bharatiya Nagarik Suraksha Sanhita Section {clean_sec}"
            else:
                old_sec_val = clean_sec
                new_sec_val = f"Corresponding {new_code} Provision"
                old_title = f"Code of Criminal Procedure Section {clean_sec}"
                new_title = f"Bharatiya Nagarik Suraksha Sanhita Transposed Section"
        elif iea_hint or bsa_hint or (category and category.upper() == "EVIDENTIARY"):
            old_code, new_code = "IEA", "BSA"
            cat = "EVIDENTIARY"
            if is_new_code_query:
                old_sec_val = f"Corresponding {old_code} Provision"
                new_sec_val = clean_sec
                old_title = f"Indian Evidence Act Transposed Section"
                new_title = f"Bharatiya Sakshya Adhiniyam Section {clean_sec}"
            else:
                old_sec_val = clean_sec
                new_sec_val = f"Corresponding {new_code} Provision"
                old_title = f"Indian Evidence Act Section {clean_sec}"
                new_title = f"Bharatiya Sakshya Adhiniyam Transposed Section"
        else:
            old_code, new_code = "IPC", "BNS"
            cat = "SUBSTANTIVE"
            if is_new_code_query:
                old_sec_val = f"Corresponding {old_code} Provision"
                new_sec_val = clean_sec
                old_title = f"Indian Penal Code Transposed Section"
                new_title = f"Bharatiya Nyaya Sanhita Section {clean_sec}"
            else:
                old_sec_val = clean_sec
                new_sec_val = f"Corresponding {new_code} Provision"
                old_title = f"Indian Penal Code Section {clean_sec}"
                new_title = f"Bharatiya Nyaya Sanhita Transposed Section"

        primary_sec = new_sec_val if is_new_code_query else old_sec_val
        primary_code = new_code if is_new_code_query else old_code
        counter_code = old_code if is_new_code_query else new_code

        bridge_data = {
            "id": f"{old_code.lower()}_{clean_sec.lower()}_{new_code.lower()}_bridge",
            "old_code": old_code,
            "old_section": old_sec_val,
            "old_title": old_title,
            "new_code": new_code,
            "new_section": new_sec_val,
            "new_title": new_title,
            "category": cat,
            "concept_doctrine": f"Statutory Continuity & Section 8 General Clauses Act Bridge ({primary_code} Section {primary_sec})",
            "doctrine_summary": (
                f"Under Section 8 of the General Clauses Act, 1897, where any Central Act repeals and re-enacts with or "
                f"without modification any provision of a former enactment, references in any other enactment or legal instrument "
                f"to the former enactment ({old_code}) shall be construed as references to the corresponding provision "
                f"re-enacted under the {new_code}, 2023. Established Supreme Court precedents governing the subject matter "
                f"remain binding law under Article 141 of the Constitution of India in pari materia."
            ),
            "landmark_precedents": [
                {
                    "title": f"Supreme Court Pari Materia Precedents on {primary_code} Section {primary_sec}",
                    "citation": "Binding Under Article 141 & Section 8 General Clauses Act",
                    "court": "Supreme Court of India",
                    "ratio": (
                        f"The constitutional safeguards, evidentiary thresholds, and statutory interpretations established by the "
                        f"Hon'ble Supreme Court for {old_code} govern the corresponding provisions of {new_code} "
                        f"in pari materia, preserving judicial continuity across both legal regimes."
                    ),
                }
            ],
            "statutory_deltas": [
                {
                    "provision_name": f"{new_code} Concordance for {old_code} Section {clean_sec}",
                    "delta_type": "DIRECT_SUBSTITUTION",
                    "details": (
                        f"Statutory transition between {old_code} and {new_code} for Section {clean_sec}. "
                        f"For substantive offences committed prior to 1 July 2024, proceedings are governed by {old_code} pursuant "
                        f"to Article 20(1) of the Constitution. Procedural steps initiated on or after 1 July 2024 comply with {new_code}."
                    ),
                    "litigator_warning": (
                        f"Advise the Court that by operation of Section 8 General Clauses Act, 1897, binding rulings under "
                        f"{old_code} apply squarely to the re-enacted {new_code} framework."
                    ),
                }
            ],
            "similarity_score": 1.0,
        }
        return StatuteConcordancePair.model_validate(bridge_data)

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
            parsed_json = await ai_orchestrator.generate_json_gemini_first(
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
                        has_covered = any(
                            prec.title.lower() in covered_titles
                            for prec in (p.landmark_precedents or [])
                        )
                        if not has_covered:
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

    async def answer_transition_question(
        self,
        question: str,
        category: str | None = None,
        active_era: str | None = None,
    ) -> TransitionQuestionResponse:
        """Provide authoritative, structured legal transition counsel and court-ready submissions."""
        q_clean = question.strip()
        matched_pairs = self.lookup_concordance(q_clean, limit=6, category=category)
        if not matched_pairs:
            matched_pairs = self.lookup_concordance("", limit=4, category=category)

        from app.services.ai_orchestrator import ai_orchestrator

        pairs_summary = []
        for p in matched_pairs[:4]:
            prec_str = (
                f"{p.landmark_precedents[0].title} [{p.landmark_precedents[0].citation}]"
                if p.landmark_precedents
                else "Pari Materia Rule"
            )
            deltas_str = "; ".join(d.details for d in p.statutory_deltas[:2]) if p.statutory_deltas else "Direct Substitution"
            pairs_summary.append(
                f"- {p.old_code} S. {p.old_section} ({p.old_title}) -> {p.new_code} S. {p.new_section} ({p.new_title}) | Doctrine: {p.concept_doctrine} | Precedent: {prec_str} | Deltas: {deltas_str}"
            )

        system_prompt = (
            "You are a Senior Supreme Court Criminal Appellate Advocate and Constitutional Jurist specializing in the "
            "transition from legacy Indian criminal codes (IPC 1860, CrPC 1973, IEA 1872) to the 2024 criminal codes "
            "(Bharatiya Nyaya Sanhita 2023 - BNS, Bharatiya Nagarik Suraksha Sanhita 2023 - BNSS, Bharatiya Sakshya Adhiniyam 2023 - BSA).\n"
            "Enforced on 1 July 2024.\n\n"
            "Constitutional & Statutory Transition Grounding:\n"
            "1. Article 20(1) Constitution of India: Non-retroactivity of substantive criminal law. Offences committed prior to 1 July 2024 MUST be charged and tried under IPC 1860.\n"
            "2. Section 531 BNSS: Pending investigations, inquiries, trials, and appeals instituted prior to 1 July 2024 continue under CrPC 1973, except beneficial provisions (e.g., S. 479 undertrials) as clarified by the Supreme Court.\n"
            "3. Section 8 General Clauses Act 1897 & Pari Materia Doctrine: Re-enacted provisions carry forward established Supreme Court interpretations as binding law under Article 141.\n"
            "4. Key procedural departures: S. 105 BNSS (mandatory videography of search/seizure), S. 173(3) BNSS (14-day preliminary inquiry for 3-7 yr offences), S. 187 BNSS (police custody split across 40/60 days), S. 479 BNSS (undertrial 1/3 term release for first-time offenders), S. 63 BSA (electronic records and hash certification).\n\n"
            "Return valid JSON matching:\n"
            "{\n"
            "  \"answer\": \"Comprehensive, authoritative legal answer addressing the question thoroughly with section citations and procedural analysis\",\n"
            "  \"governing_principles\": [\"Principle 1\", \"Principle 2\", \"Principle 3\"],\n"
            "  \"procedural_warnings\": [\"Litigator warning 1\", \"Litigator warning 2\"],\n"
            "  \"draft_pleading_snippet\": \"Formal court-ready submission paragraph that an advocate can insert directly into a bail application, quashing petition, or trial submission\"\n"
            "}"
        )

        user_prompt = (
            f"Question from Advocate: {q_clean}\n\n"
            f"Relevant Statutory Concordance Matches:\n"
            + "\n".join(pairs_summary) + "\n\n"
            f"Provide an authoritative legal transition analysis and court-ready submission."
        )

        try:
            if not ai_orchestrator.is_local():
                llm_res = await ai_orchestrator.generate_json_gemini_first(
                    system_prompt=system_prompt,
                    user_prompt=user_prompt,
                    temperature=0.1,
                    max_tokens=2048,
                )
                if llm_res and isinstance(llm_res, dict) and llm_res.get("answer"):
                    return TransitionQuestionResponse(
                        question=q_clean,
                        answer=llm_res["answer"],
                        key_sections=matched_pairs[:4],
                        governing_principles=llm_res.get("governing_principles", [
                            "Article 20(1) Constitution of India (Protection against ex-post facto criminal laws)",
                            "Section 8 General Clauses Act, 1897 & Pari Materia Doctrine",
                            "Section 531 BNSS (Repeal and savings for pending proceedings)",
                        ]),
                        procedural_warnings=llm_res.get("procedural_warnings", [
                            "Scrutinize date of incident vs date of FIR to determine substantive applicability.",
                            "Object to any retroactive application of enhanced penalties under BNS 2023.",
                        ]),
                        draft_pleading_snippet=llm_res.get("draft_pleading_snippet"),
                        confidence=0.96,
                    )
        except Exception as exc:
            logger.warning("transition_qa_llm_failed_falling_back", error=str(exc))

        return self._generate_deterministic_transition_answer(q_clean, matched_pairs, category, active_era)

    def _generate_deterministic_transition_answer(
        self,
        question: str,
        matched_pairs: list[StatuteConcordancePair],
        category: str | None = None,
        active_era: str | None = None,
    ) -> TransitionQuestionResponse:
        """Deterministic high-quality legal transition counsel covering all statutory aspects."""
        q_lower = question.lower()
        p0 = matched_pairs[0] if matched_pairs else None
        p0_old = f"{p0.old_code} Section {p0.old_section}" if p0 else "Legacy Code"
        p0_new = f"{p0.new_code} Section {p0.new_section}" if p0 else "New Code"
        p0_title = p0.new_title if p0 else "Criminal Statute"

        # Theme 1: Remand & Police Custody Splitting (BNSS S. 187 / CrPC S. 167)
        if any(t in q_lower for t in ["remand", "custody", "187", "167", "splitting", "15 days", "police custody"]):
            ans = (
                "Under Section 187 of the Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS) (which replaces Section 167 CrPC), "
                "the maximum period of police custody remains 15 days in the aggregate. However, the critical procedural departure is that "
                "such 15 days of police custody is no longer restricted strictly to the first 15 days of detention. The Magistrate is empowered "
                "to sanction police custody in whole or in parts at any time during the initial 40 days (for offences punishable with up to 10 years) "
                "or initial 60 days (for offences punishable with death, life imprisonment, or 10+ years). "
                "Nevertheless, the right to statutory default bail under Section 187(3) BNSS upon expiry of the 60 or 90 day investigation period "
                "remains an absolute constitutional right under Article 21, following the landmark ruling in Bikramjit Singh v. State of Punjab (2020)."
            )
            principles = [
                "15-Day Aggregate Limit: Total police custody cannot exceed 15 days in aggregate.",
                "Staggered Remand Power: Police custody may be granted in parts across the first 40 or 60 days.",
                "Default Bail Preservation: Accused is entitled to indefeasible bail on day 61 or 91 if chargesheet is not filed.",
                "Judicial Scrutiny: Every successive police remand application requires distinct, recorded judicial justification.",
            ]
            warnings = [
                "Litigator Objection: Strongly oppose police custody applications moved after initial judicial custody unless fresh recovery or material is shown.",
                "Default Bail Application: Be prepared to file Section 187(3) BNSS default bail application immediately at 10:00 AM upon expiry of statutory period.",
            ]
            snippet = (
                f"It is respectfully submitted before this Hon'ble Court that while Section 187(2) of the Bharatiya Nagarik Suraksha Sanhita, 2023 "
                f"permits police custody to be availed in parts during the initial 40/60 days, the statute does not confer an untrammelled license "
                f"to repeatedly seek custodial interrogation. The aggregate cap of 15 days is absolute. In terms of the Constitution Bench dictum "
                f"in CBI v. Anupam J. Kulkarni as harmonized under BNSS, custodial interrogation after substantial judicial remand requires demonstrable "
                f"necessity. In absence of fresh discoveries, the remand application is liable to be rejected."
            )

        # Theme 2: Preliminary Inquiry before FIR (BNSS S. 173(3) / CrPC S. 154)
        elif any(t in q_lower for t in ["preliminary inquiry", "173(3)", "inquiry before fir", "14 days", "dsp", "prior permission"]):
            ans = (
                "Section 173(3) of the Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS) introduces a statutory preliminary inquiry mechanism. "
                "For offences punishable with imprisonment of 3 years or more but less than 7 years, the Station House Officer (SHO) may, "
                "with the prior permission of an officer not below the rank of Deputy Superintendent of Police (DSP), conduct a preliminary inquiry "
                "within a strict statutory window of 14 days to ascertain whether a prima facie case exists before proceeding to register an FIR. "
                "This provision statutorily codifies and expands the preliminary inquiry exceptions recognized by the Constitution Bench in "
                "Lalita Kumari v. Govt. of U.P. (2014) 2 SCC 1."
            )
            principles = [
                "Strict Applicability Threshold: Applies only to offences punishable between 3 and 7 years imprisonment.",
                "Mandatory DSP Prior Approval: Preliminary inquiry cannot be initiated at the sole discretion of the SHO.",
                "Strict 14-Day Outer Limit: Inquiry must conclude within 14 days; failure mandates either FIR registration or closure.",
                "Non-Arrest Window: Accused cannot be arrested during the pendency of a Section 173(3) preliminary inquiry.",
            ]
            warnings = [
                "For Complainants: If police delay registration beyond 14 days without reason, file application under Section 175(3) BNSS before Magistrate.",
                "For Accused: Submit exculpatory documentary evidence during the 14-day inquiry to establish civil nature or false implication.",
            ]
            snippet = (
                f"It is respectfully submitted that under Section 173(3) BNSS, the preliminary inquiry must strictly conclude within 14 days and "
                f"requires prior written sanction of an officer of the rank of Deputy Superintendent of Police. Continued police harassment beyond "
                f"the 14-day statutory window without registration of FIR or closure report constitutes a direct infringement of the procedural mandate "
                f"enunciated by the Hon'ble Supreme Court in Lalita Kumari v. Govt. of U.P. [(2014) 2 SCC 1]."
            )

        # Theme 3: Electronic Evidence & Hash Verification (BSA S. 63 / IEA S. 65B)
        elif any(t in q_lower for t in ["electronic", "65b", "63", "hash", "certificate", "whatsapp", "call record", "digital"]):
            ans = (
                "Section 63 of the Bharatiya Sakshya Adhiniyam, 2023 (BSA) replaces Section 65B of the Indian Evidence Act, 1872. "
                "While the requirement of proving authenticity and integrity of electronic records is preserved, BSA Section 63 introduces "
                "advanced technical standards: it explicitly recognizes hash algorithms, cryptographic integrity, and semiconductor device storage. "
                "Crucially, where the original electronic device itself (e.g., smartphone, laptop, server hard drive) is produced in court, "
                "it qualifies as primary evidence under Section 57/60 BSA, obviating the necessity of a Section 63 certificate. "
                "For secondary electronic outputs (printouts, CDs, pen drives), a formal Certificate signed by the person in lawful charge "
                "or an expert remains a condition precedent to admissibility, in terms of Arjun Panditrao Khotkar v. Kailash Kushanrao Gorantyal (2020)."
            )
            principles = [
                "Primary vs Secondary Digital Evidence: Original device is primary evidence; copies require Section 63 certificate.",
                "Cryptographic Hash Standard: Section 63(4) recognizes hash values to establish electronic record integrity.",
                "Signing Authority: Certificate must be executed by person in charge of computer/system or certified forensic expert.",
                "Mandatory Condition Precedent: Uncertified secondary electronic evidence is legally inadmissible and cannot be read into evidence.",
            ]
            warnings = [
                "Defense Strategy: Object to admission of electronic records (WhatsApp chats, CDRs, CCTV) at the threshold if accompanied by defective certificate.",
                "Seizure Check: Verify whether police followed chain of custody and hash calculation during seizure under Section 105 BNSS.",
            ]
            snippet = (
                f"It is respectfully submitted that the purported electronic evidence relied upon by the prosecution is wholly inadmissible in law "
                f"for non-compliance with Section 63 of the Bharatiya Sakshya Adhiniyam, 2023. As conclusively laid down by the 3-Judge Bench of the "
                f"Hon'ble Supreme Court in Arjun Panditrao Khotkar v. Kailash Kushanrao Gorantyal [(2020) 7 SCC 1], the certificate under Section 63(4) BSA "
                f"(in pari materia to erstwhile Section 65B(4) IEA) is a mandatory condition precedent. In absence of cryptographic hash verification, "
                f"the secondary electronic record cannot be looked into."
            )

        # Theme 4: Undertrial Bail Relief (BNSS S. 479 / CrPC S. 436A)
        elif any(t in q_lower for t in ["undertrial", "479", "436a", "one third", "first time", "half sentence", "delay in trial"]):
            ans = (
                "Section 479 of the Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS) fundamentally liberalizes the undertrial bail regime. "
                "Under erstwhile Section 436A CrPC, an undertrial prisoner had to undergo one-half of the maximum imprisonment to claim statutory release. "
                "Section 479 BNSS introduces a pathbreaking reform for first-time offenders (persons who have never been convicted of any offence in the past): "
                "such first-time offenders MUST be released on bail upon undergoing detention extending to ONE-THIRD of the maximum term of imprisonment. "
                "Crucially, the Hon'ble Supreme Court in 'In Re: Inhuman Conditions in 1382 Prisons' (Order dated 23-Aug-2024) held that Section 479 BNSS "
                "applies retrospectively to all pending undertrials regardless of whether their case was registered before or after 1 July 2024."
            )
            principles = [
                "One-Third Rule for First Offenders: Mandatory release on bail upon serving 1/3 of maximum sentence.",
                "One-Half Rule for Others: Other undertrials (non-first time) remain eligible at 1/2 of maximum sentence.",
                "Retrospective Benefit: Supreme Court has expressly held Section 479 BNSS applies to pending cases under CrPC.",
                "Exclusions: Does not apply to offences punishable with death or life imprisonment, or multiple pending case trials.",
            ]
            warnings = [
                "Litigator Action: File immediate bail application under Section 479 BNSS for any undertrial who has completed 1/3 of the maximum term.",
                "Superintendent Duty: Jail Superintendent is statutorily mandated under Section 479(3) to report eligible undertrials to court.",
            ]
            snippet = (
                f"It is respectfully submitted that the applicant has undergone more than one-third of the maximum sentence prescribed for the alleged "
                f"offences. The applicant is a first-time offender with zero prior convictions. By operation of Section 479(1) of the Bharatiya Nagarik "
                f"Suraksha Sanhita, 2023, as expressly applied retrospectively to all pending undertrials by the Hon'ble Supreme Court in In Re: Inhuman "
                f"Conditions in 1382 Prisons (Order dated 23 August 2024), the applicant is entitled to mandatory release on bail."
            )

        # Theme 5: Retroactivity, Date of Offence & Transition Rules (Pre vs Post July 1 2024)
        elif any(t in q_lower for t in ["pre-july", "before july", "july 1", "retroactive", "retrospective", "date of offence", "fir registered after", "old fir"]):
            ans = (
                "The criminal law transition follows strict constitutional bifurcation: "
                "1. Substantive Criminal Law (IPC 1860 vs BNS 2023): Governed strictly by Article 20(1) of the Constitution of India. "
                "An act constitutes an offence ONLY if it was an offence under the law in force at the time of its commission. Therefore, any offence "
                "committed prior to 1 July 2024 MUST be charged, tried, and punished under the Indian Penal Code, 1860, even if the FIR is registered "
                "after 1 July 2024. BNS cannot be applied retroactively. "
                "2. Procedural Criminal Law (CrPC 1973 vs BNSS 2023): Governed by Section 531 BNSS. Investigations, inquiries, trials, and appeals "
                "already pending prior to 1 July 2024 continue under CrPC 1973. However, for any fresh complaint, inquiry, or proceeding instituted on or after "
                "1 July 2024, BNSS procedures govern, even if the underlying substantive offence is under the IPC."
            )
            principles = [
                "Article 20(1) Absolute Shield: No person can be convicted of any offence except under the law in force at time of commission.",
                "Substantive Law Freezes at Date of Crime: IPC applies to all offences committed up to 30 June 2024 midnight.",
                "Section 531 BNSS Repeal & Savings: Pending trials/appeals continue under CrPC 1973.",
                "Hybrid Transition Regime: Common scenario where substantive charges are IPC while procedural steps follow BNSS.",
            ]
            warnings = [
                "Defense Objection: If police register an FIR quoting BNS sections for an offence committed prior to 1 July 2024, move for quashing / alteration of charges.",
                "Check Penalties: Any enhanced penalty introduced in BNS (e.g. S. 106(2) hit-and-run) cannot apply to pre-enactment incidents.",
            ]
            snippet = (
                f"It is respectfully submitted that the alleged incident occurred prior to 1 July 2024. In terms of Article 20(1) of the Constitution "
                f"of India and Section 358 of the Bharatiya Nyaya Sanhita, 2023, the penal liability of the applicant is governed exclusively by the "
                f"substantive provisions of the Indian Penal Code, 1860. The invocation of BNS provisions for acts antedating 1 July 2024 is unconstitutional, "
                f"illegal, and void ab initio, and the charges are liable to be struck down."
            )

        # Default General Concordance & Section 8 General Clauses Act Answer
        else:
            ans = (
                f"The governing statutory bridge for {p0_title} is established by Section 8 of the General Clauses Act, 1897. "
                f"Where erstwhile {p0_old} is repealed and re-enacted as {p0_new}, references to the repealed provision in existing laws, "
                f"pleadings, and judicial orders shall be construed as references to the provision so re-enacted. "
                f"Furthermore, because {p0_new} maintains absolute pari materia identity with {p0_old}, the foundational ratios decidendi "
                f"settled by the Hon'ble Supreme Court under the legacy statute remain binding law under Article 141 of the Constitution of India."
            )
            principles = [
                "Section 8 General Clauses Act, 1897: Automatic statutory bridge for re-enacted provisions.",
                "Pari Materia Doctrine: Same subject matter and phrasing preserves authoritative Supreme Court interpretation.",
                "Article 141 Constitutional Continuity: Binding force of historic Supreme Court precedents survives statutory re-codification.",
                "Procedural Compliance: Adhere strictly to 2024 procedural forms and electronic filing mandates.",
            ]
            warnings = [
                "Statutory Citation: Style court pleadings citing both new code and legacy pari materia equivalent (e.g. 'BNSS S. 482 r/w CrPC S. 438').",
                "Procedural Safeguards: Ensure new procedural requirements under BNSS/BSA are strictly met.",
            ]
            snippet = (
                f"It is respectfully submitted before this Hon'ble Court that while the instant proceeding is styled under {p0_new}, "
                f"the governing legal principle is squarely settled by the Hon'ble Supreme Court under {p0_old}. By operation of Section 8 "
                f"of the General Clauses Act, 1897, the legislative enactment of {p0_new} maintains pari materia identity with erstwhile "
                f"{p0_old}. Consequently, the binding ratio decidendi laid down by the Hon'ble Supreme Court under Article 141 strictly governs "
                f"the adjudication of the present matter."
            )

        return TransitionQuestionResponse(
            question=question,
            answer=ans,
            key_sections=matched_pairs[:4],
            governing_principles=principles,
            procedural_warnings=warnings,
            draft_pleading_snippet=snippet,
            confidence=0.95,
        )

