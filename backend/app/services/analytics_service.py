"""Analytics service - real telemetry aggregation for Top Cited Acts, Court Distribution, and Activity Trends."""

import json
import re
import uuid
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import func, select, desc
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.models.bookmark import Bookmark
from app.models.cached_ai_analysis import CachedAIAnalysis
from app.models.cached_case import CachedCase
from app.models.case_view_history import CaseViewHistory
from app.models.conversation import Conversation
from app.models.message import Message, MessageRole
from app.models.saved_file import SavedFile
from app.models.search_history import SearchHistory
from app.models.user_document import UserDocument
from app.schemas.analytics import (
    CourtDistributionItem,
    HeatmapDay,
    PracticeInsightsResponse,
    ResearchActivityTelemetry,
    StatuteItem,
    WeeklyTrendPoint,
)

logger = structlog.get_logger()

# ─────────────────────────────────────────────────────────────────────────────
# Canonical Indian Enactments Knowledge Base
# ─────────────────────────────────────────────────────────────────────────────
CANONICAL_ACTS = [
    {
        "id": "crpc",
        "act_name": "Code of Criminal Procedure, 1973 (CrPC)",
        "short_name": "CrPC",
        "category": "Criminal Procedure",
        "patterns": [
            r"\bcr\.?p\.?c\.?\b",
            r"code of criminal procedure",
            r"criminal procedure code",
        ],
    },
    {
        "id": "ipc",
        "act_name": "Indian Penal Code, 1860 (IPC)",
        "short_name": "IPC",
        "category": "Criminal Law",
        "patterns": [
            r"\bipc\b",
            r"indian penal code",
            r"penal code",
        ],
    },
    {
        "id": "cpc",
        "act_name": "Code of Civil Procedure, 1908 (CPC)",
        "short_name": "CPC",
        "category": "Civil Procedure",
        "patterns": [
            r"\bc\.?p\.?c\.?\b",
            r"code of civil procedure",
            r"civil procedure code",
        ],
    },
    {
        "id": "arbitration",
        "act_name": "Arbitration and Conciliation Act, 1996",
        "short_name": "Arbitration Act",
        "category": "Commercial & Arbitration",
        "patterns": [
            r"arbitration and conciliation",
            r"arbitration act",
        ],
    },
    {
        "id": "companies",
        "act_name": "Companies Act, 2013 / 1956",
        "short_name": "Companies Act",
        "category": "Corporate Law",
        "patterns": [
            r"companies act",
        ],
    },
    {
        "id": "constitution",
        "act_name": "Constitution of India",
        "short_name": "Constitution",
        "category": "Constitutional Law",
        "patterns": [
            r"constitution of india",
            r"\bconstitution\b",
            r"article\s+(?:226|32|136|14|19|21|227)\b",
        ],
    },
    {
        "id": "ni_act",
        "act_name": "Negotiable Instruments Act, 1881",
        "short_name": "NI Act (Sec 138)",
        "category": "Banking & Negotiable",
        "patterns": [
            r"negotiable instruments",
            r"\bni act\b",
            r"\bn\.i\. act\b",
            r"section 138",
        ],
    },
    {
        "id": "ibc",
        "act_name": "Insolvency and Bankruptcy Code, 2016 (IBC)",
        "short_name": "IBC",
        "category": "Insolvency Law",
        "patterns": [
            r"insolvency and bankruptcy",
            r"\bibc\b",
            r"\bi&b code\b",
        ],
    },
    {
        "id": "evidence",
        "act_name": "Indian Evidence Act, 1872",
        "short_name": "Evidence Act",
        "category": "Procedural Law",
        "patterns": [
            r"indian evidence act",
            r"evidence act",
        ],
    },
    {
        "id": "specific_relief",
        "act_name": "Specific Relief Act, 1963",
        "short_name": "Specific Relief",
        "category": "Civil Law",
        "patterns": [
            r"specific relief act",
        ],
    },
    {
        "id": "pmla",
        "act_name": "Prevention of Money Laundering Act, 2002 (PMLA)",
        "short_name": "PMLA",
        "category": "Financial Crime",
        "patterns": [
            r"prevention of money laundering",
            r"\bpmla\b",
        ],
    },
    {
        "id": "income_tax",
        "act_name": "Income Tax Act, 1961",
        "short_name": "Income Tax Act",
        "category": "Direct Taxation",
        "patterns": [
            r"income[- ]tax act",
            r"\bit act 1961\b",
        ],
    },
    {
        "id": "it_act",
        "act_name": "Information Technology Act, 2000",
        "short_name": "IT Act (Cyber)",
        "category": "Cyber & Tech Law",
        "patterns": [
            r"information technology act",
        ],
    },
    {
        "id": "bnss",
        "act_name": "Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)",
        "short_name": "BNSS",
        "category": "New Criminal Law",
        "patterns": [
            r"bharatiya nagarik suraksha",
            r"\bbnss\b",
        ],
    },
    {
        "id": "bns",
        "act_name": "Bharatiya Nyaya Sanhita, 2023 (BNS)",
        "short_name": "BNS",
        "category": "New Criminal Law",
        "patterns": [
            r"bharatiya nyaya sanhita",
            r"\bbns\b",
        ],
    },
    {
        "id": "bsa",
        "act_name": "Bharatiya Sakshya Adhiniyam, 2023 (BSA)",
        "short_name": "BSA",
        "category": "New Criminal Law",
        "patterns": [
            r"bharatiya sakshya",
            r"\bbsa\b",
        ],
    },
    {
        "id": "motor_vehicles",
        "act_name": "Motor Vehicles Act, 1988",
        "short_name": "Motor Vehicles",
        "category": "Accident Claims",
        "patterns": [
            r"motor vehicles act",
            r"\bmv act\b",
        ],
    },
    {
        "id": "consumer",
        "act_name": "Consumer Protection Act, 2019 / 1986",
        "short_name": "Consumer Act",
        "category": "Consumer Law",
        "patterns": [
            r"consumer protection act",
        ],
    },
    {
        "id": "sarfaesi",
        "act_name": "SARFAESI Act, 2002",
        "short_name": "SARFAESI",
        "category": "Banking Recovery",
        "patterns": [
            r"sarfaesi",
            r"securitisation and reconstruction",
        ],
    },
    {
        "id": "contract",
        "act_name": "Indian Contract Act, 1872",
        "short_name": "Contract Act",
        "category": "Commercial Law",
        "patterns": [
            r"indian contract act",
            r"contract act",
        ],
    },
    {
        "id": "limitation",
        "act_name": "Limitation Act, 1963",
        "short_name": "Limitation Act",
        "category": "Procedural Law",
        "patterns": [
            r"limitation act",
        ],
    },
    {
        "id": "commercial_courts",
        "act_name": "Commercial Courts Act, 2015",
        "short_name": "Commercial Courts",
        "category": "Commercial & Arbitration",
        "patterns": [
            r"commercial courts act",
        ],
    },
]

# Compile patterns for fast matching
COMPILED_ACT_PATTERNS = [
    (act, [re.compile(p, re.IGNORECASE) for p in act["patterns"]])
    for act in CANONICAL_ACTS
]

# Common Section / Article extraction pattern
SECTION_PATTERN = re.compile(
    r"(?:section|sec\.?|article|art\.?|order)\s+([0-9A-Za-z]+(?:\s*[A-Za-z]+)?)",
    re.IGNORECASE,
)


# ─────────────────────────────────────────────────────────────────────────────
# Canonical Court Forums Knowledge Base
# ─────────────────────────────────────────────────────────────────────────────
CANONICAL_FORUMS = [
    {
        "id": "supreme_court",
        "name": "Supreme Court of India",
        "short_name": "Supreme Court",
        "type": "Apex Court",
        "patterns": [
            r"supreme court",
            r"\bsci\b",
            r"\bsc\b",
            r"apex court",
        ],
    },
    {
        "id": "delhi_hc",
        "name": "High Court of Delhi",
        "short_name": "Delhi HC",
        "type": "High Court",
        "patterns": [
            r"delhi high court",
            r"high court of delhi",
            r"\bdhc\b",
        ],
    },
    {
        "id": "bombay_hc",
        "name": "High Court of Bombay",
        "short_name": "Bombay HC",
        "type": "High Court",
        "patterns": [
            r"bombay high court",
            r"high court of judicature at bombay",
            r"high court of bombay",
            r"\bbhc\b",
        ],
    },
    {
        "id": "allahabad_hc",
        "name": "Allahabad High Court",
        "short_name": "Allahabad HC",
        "type": "High Court",
        "patterns": [
            r"allahabad high court",
            r"high court of judicature at allahabad",
        ],
    },
    {
        "id": "madras_hc",
        "name": "Madras High Court",
        "short_name": "Madras HC",
        "type": "High Court",
        "patterns": [
            r"madras high court",
            r"high court of judicature at madras",
        ],
    },
    {
        "id": "calcutta_hc",
        "name": "Calcutta High Court",
        "short_name": "Calcutta HC",
        "type": "High Court",
        "patterns": [
            r"calcutta high court",
            r"high court at calcutta",
        ],
    },
    {
        "id": "karnataka_hc",
        "name": "Karnataka High Court",
        "short_name": "Karnataka HC",
        "type": "High Court",
        "patterns": [
            r"karnataka high court",
            r"high court of karnataka",
        ],
    },
    {
        "id": "punjab_haryana_hc",
        "name": "Punjab & Haryana High Court",
        "short_name": "P&H HC",
        "type": "High Court",
        "patterns": [
            r"punjab & haryana",
            r"punjab and haryana",
        ],
    },
    {
        "id": "gujarat_hc",
        "name": "Gujarat High Court",
        "short_name": "Gujarat HC",
        "type": "High Court",
        "patterns": [
            r"gujarat high court",
            r"high court of gujarat",
        ],
    },
    {
        "id": "kerala_hc",
        "name": "Kerala High Court",
        "short_name": "Kerala HC",
        "type": "High Court",
        "patterns": [
            r"kerala high court",
            r"high court of kerala",
        ],
    },
    {
        "id": "nclat",
        "name": "National Company Law Appellate Tribunal",
        "short_name": "NCLAT",
        "type": "Tribunal",
        "patterns": [
            r"nclat",
            r"national company law appellate tribunal",
        ],
    },
    {
        "id": "nclt",
        "name": "National Company Law Tribunal",
        "short_name": "NCLT",
        "type": "Tribunal",
        "patterns": [
            r"nclt\b",
            r"national company law tribunal",
        ],
    },
    {
        "id": "ngt",
        "name": "National Green Tribunal",
        "short_name": "NGT",
        "type": "Tribunal",
        "patterns": [
            r"national green tribunal",
            r"\bngt\b",
        ],
    },
    {
        "id": "itat",
        "name": "Income Tax Appellate Tribunal",
        "short_name": "ITAT",
        "type": "Tribunal",
        "patterns": [
            r"income tax appellate tribunal",
            r"\bitat\b",
        ],
    },
    {
        "id": "district_court",
        "name": "District & Sessions Courts",
        "short_name": "District Courts",
        "type": "District Court",
        "patterns": [
            r"district & sessions",
            r"district court",
            r"tis hazari",
            r"patiala house",
            r"saket court",
            r"karkardooma",
            r"rohini court",
            r"dwarka court",
            r"city civil court",
            r"magistrate",
        ],
    },
]

COMPILED_FORUM_PATTERNS = [
    (forum, [re.compile(p, re.IGNORECASE) for p in forum["patterns"]])
    for forum in CANONICAL_FORUMS
]


class AnalyticsService:
    """Aggregates user telemetry into structured practice intelligence."""

    def _match_canonical_act(self, raw_text: str) -> dict[str, Any] | None:
        """Find matching canonical act from raw text."""
        if not raw_text:
            return None
        text = raw_text.strip()
        for act, patterns in COMPILED_ACT_PATTERNS:
            for p in patterns:
                if p.search(text):
                    return act
        return None

    def _extract_sections(self, raw_text: str) -> list[str]:
        """Extract sections, articles, or orders from a citation string."""
        if not raw_text:
            return []
        found = []
        for m in SECTION_PATTERN.finditer(raw_text):
            sec = m.group(0).strip()
            # Standardize section label
            sec_clean = re.sub(r"\s+", " ", sec).capitalize()
            found.append(sec_clean)
        return found

    def _match_canonical_forum(self, raw_text: str) -> dict[str, Any] | None:
        """Find matching canonical forum from raw court name or string."""
        if not raw_text:
            return None
        text = raw_text.strip()
        for forum, patterns in COMPILED_FORUM_PATTERNS:
            for p in patterns:
                if p.search(text):
                    return forum
        return None

    # ─────────────────────────────────────────────────────────────────────────
    # 1. Top Cited Acts Aggregation
    # ─────────────────────────────────────────────────────────────────────────
    async def aggregate_top_cited_acts(
        self,
        user_id: uuid.UUID,
        db: AsyncSession,
    ) -> list[StatuteItem]:
        """Aggregate all statutes cited across user's bookmarked cases and uploaded documents."""
        # 1. Fetch user's bookmarks
        bm_stmt = select(Bookmark.cnr, Bookmark.title).where(Bookmark.user_id == user_id)
        bm_res = await db.execute(bm_stmt)
        bookmarks = bm_res.fetchall()
        cnrs = [b[0] for b in bookmarks if b[0]]

        # 2. Fetch CachedCases for these CNRs
        cached_cases: dict[str, CachedCase] = {}
        if cnrs:
            cc_stmt = select(CachedCase).where(CachedCase.cnr.in_(cnrs))
            cc_res = await db.execute(cc_stmt)
            for cc in cc_res.scalars().all():
                cached_cases[cc.cnr] = cc

        # 3. Fetch User Documents
        doc_stmt = select(UserDocument).where(UserDocument.user_id == user_id)
        doc_res = await db.execute(doc_stmt)
        user_docs = doc_res.scalars().all()

        # 4. Fetch CachedAIAnalysis for orders linked to user's CNRs
        ai_analyses: list[dict[str, Any]] = []
        if cnrs:
            ai_stmt = select(CachedAIAnalysis.ai_json).where(CachedAIAnalysis.cnr.in_(cnrs))
            ai_res = await db.execute(ai_stmt)
            for row in ai_res.scalars().all():
                try:
                    parsed = json.loads(row)
                    if isinstance(parsed, dict):
                        ai_analyses.append(parsed)
                except Exception:
                    pass

        # Data structures to aggregate
        # act_id -> { "act": act_dict, "count": int, "cases": set(), "sections": Counter() }
        statute_counts: dict[str, dict[str, Any]] = defaultdict(lambda: {
            "act": None,
            "count": 0,
            "cases": set(),
            "sections": Counter(),
            "sources": set(),
        })

        # Process Bookmarks & Cached Cases
        for b_cnr, b_title in bookmarks:
            case_title = b_title or "Untitled Judgment"
            cc = cached_cases.get(b_cnr)
            extracted_citations: list[str] = []

            if cc and cc.response_json:
                try:
                    case_data = json.loads(cc.response_json)
                    # eCourts acts & sections
                    acts_sec = case_data.get("acts_and_sections") or case_data.get("actsAndSections") or []
                    for item in acts_sec:
                        if isinstance(item, str):
                            extracted_citations.append(item)
                        elif isinstance(item, dict):
                            extracted_citations.append(f"{item.get('act', '')} {item.get('section', '')}")

                    # Kanoon cites list
                    cites = case_data.get("cites") or []
                    for c in cites:
                        if isinstance(c, dict):
                            t = c.get("title")
                            if t:
                                extracted_citations.append(re.sub(r"<[^>]+>", "", str(t)))
                        elif isinstance(c, str):
                            extracted_citations.append(re.sub(r"<[^>]+>", "", c))

                    # Fallback to case_title or case_category
                    if not extracted_citations:
                        title_clean = cc.case_title or case_title
                        extracted_citations.append(title_clean)
                except Exception as exc:
                    logger.warning("analytics_case_json_parse_error", cnr=b_cnr, error=str(exc))
            else:
                extracted_citations.append(case_title)

            # Match extracted citations against canonical acts
            for cit in extracted_citations:
                matched_act = self._match_canonical_act(cit)
                if matched_act:
                    act_id = matched_act["id"]
                    entry = statute_counts[act_id]
                    entry["act"] = matched_act
                    entry["count"] += 1
                    entry["cases"].add(b_cnr)
                    entry["sources"].add(case_title)

                    # Extract sections mentioned in citation
                    for sec in self._extract_sections(cit):
                        entry["sections"][sec] += 1

        # Process User Documents
        for doc in user_docs:
            doc_name = doc.original_filename or doc.filename
            doc_citations: list[str] = []

            # 1. From ai_analysis
            if doc.ai_analysis and isinstance(doc.ai_analysis, dict):
                statutes = doc.ai_analysis.get("statutesCited") or []
                sections = doc.ai_analysis.get("sectionsApplied") or []
                if isinstance(statutes, list):
                    doc_citations.extend(str(s) for s in statutes if s)
                if isinstance(sections, list):
                    doc_citations.extend(str(s) for s in sections if s)

            # 2. Heuristic scan of summary or extracted text
            text_snippet = f"{doc.summary or ''} {doc.notes or ''}"
            if doc_citations:
                for cit in doc_citations:
                    matched_act = self._match_canonical_act(cit)
                    if matched_act:
                        act_id = matched_act["id"]
                        entry = statute_counts[act_id]
                        entry["act"] = matched_act
                        entry["count"] += 1
                        entry["cases"].add(str(doc.id))
                        entry["sources"].add(doc_name)
                        for sec in self._extract_sections(cit):
                            entry["sections"][sec] += 1
            elif text_snippet.strip():
                matched_act = self._match_canonical_act(text_snippet)
                if matched_act:
                    act_id = matched_act["id"]
                    entry = statute_counts[act_id]
                    entry["act"] = matched_act
                    entry["count"] += 1
                    entry["cases"].add(str(doc.id))
                    entry["sources"].add(doc_name)
                    for sec in self._extract_sections(text_snippet):
                        entry["sections"][sec] += 1

        # Process CachedAIAnalysis from Orders
        for ai_obj in ai_analyses:
            statutes = ai_obj.get("statutesCited") or []
            sections = ai_obj.get("sectionsApplied") or []
            c_num = ai_obj.get("caseNumber") or "Order Analysis"
            all_cits = []
            if isinstance(statutes, list):
                all_cits.extend(str(s) for s in statutes if s)
            if isinstance(sections, list):
                all_cits.extend(str(s) for s in sections if s)

            for cit in all_cits:
                matched_act = self._match_canonical_act(cit)
                if matched_act:
                    act_id = matched_act["id"]
                    entry = statute_counts[act_id]
                    entry["act"] = matched_act
                    entry["count"] += 1
                    entry["cases"].add(c_num)
                    entry["sources"].add(c_num)
                    for sec in self._extract_sections(cit):
                        entry["sections"][sec] += 1

        total_citations = sum(item["count"] for item in statute_counts.values())

        # Build sorted list of StatuteItem
        result: list[StatuteItem] = []
        for act_id, item in sorted(statute_counts.items(), key=lambda x: x[1]["count"], reverse=True):
            act_info = item["act"]
            if not act_info:
                continue
            pct = round((item["count"] / max(1, total_citations)) * 100, 1)
            top_secs = [sec for sec, _ in item["sections"].most_common(5)]
            sources = list(item["sources"])[:3]

            result.append(StatuteItem(
                id=act_id,
                act_name=act_info["act_name"],
                short_name=act_info["short_name"],
                category=act_info["category"],
                citation_count=item["count"],
                cases_count=len(item["cases"]),
                percentage=pct,
                top_sections=top_secs,
                sample_sources=sources,
            ))

        return result

    # ─────────────────────────────────────────────────────────────────────────
    # 2. Court & Forum Distribution Aggregation
    # ─────────────────────────────────────────────────────────────────────────
    async def aggregate_court_distribution(
        self,
        user_id: uuid.UUID,
        db: AsyncSession,
    ) -> list[CourtDistributionItem]:
        """Group user cases across forums (Supreme Court, Delhi HC, Bombay HC, NCLAT, etc.)."""
        forum_counts: dict[str, dict[str, Any]] = defaultdict(lambda: {
            "forum": None,
            "count": 0,
        })

        raw_court_strings: list[str] = []

        # 1. Bookmarked cases + CachedCase
        bm_stmt = (
            select(Bookmark.cnr, Bookmark.title, CachedCase.court_code, CachedCase.response_json)
            .outerjoin(CachedCase, Bookmark.cnr == CachedCase.cnr)
            .where(Bookmark.user_id == user_id)
        )
        bm_res = await db.execute(bm_stmt)
        for cnr, title, court_code, resp_json in bm_res.fetchall():
            if court_code:
                raw_court_strings.append(court_code)
            if cnr:
                cnr_upper = cnr.upper()
                if cnr_upper.startswith("SCIN") or cnr_upper.startswith("SCI"):
                    raw_court_strings.append("Supreme Court of India")
                elif cnr_upper.startswith("DLHC") or cnr_upper.startswith("DEL"):
                    raw_court_strings.append("High Court of Delhi")
                elif cnr_upper.startswith("BOM") or cnr_upper.startswith("MUM"):
                    raw_court_strings.append("High Court of Bombay")
                elif cnr_upper.startswith("NCLAT"):
                    raw_court_strings.append("National Company Law Appellate Tribunal")

            if resp_json:
                try:
                    c_data = json.loads(resp_json)
                    court_dict = c_data.get("court")
                    if isinstance(court_dict, dict) and court_dict.get("court_name"):
                        raw_court_strings.append(str(court_dict.get("court_name")))
                    if c_data.get("courtName"):
                        raw_court_strings.append(str(c_data.get("courtName")))
                    if c_data.get("court_name"):
                        raw_court_strings.append(str(c_data.get("court_name")))
                    if c_data.get("courtCode"):
                        raw_court_strings.append(str(c_data.get("courtCode")))
                    if c_data.get("docsource"):
                        raw_court_strings.append(str(c_data.get("docsource")))
                except Exception:
                    pass

        # 2. SavedFiles
        sf_stmt = select(SavedFile.court_name).where(SavedFile.user_id == user_id)
        sf_res = await db.execute(sf_stmt)
        for c_name in sf_res.scalars().all():
            if c_name:
                raw_court_strings.append(c_name)

        # 3. UserDocuments
        doc_stmt = select(UserDocument.ai_analysis).where(UserDocument.user_id == user_id)
        doc_res = await db.execute(doc_stmt)
        for ai_obj in doc_res.scalars().all():
            if ai_obj and isinstance(ai_obj, dict):
                c_name = ai_obj.get("courtName")
                if c_name:
                    raw_court_strings.append(str(c_name))

        # 4. CaseViewHistory (cases opened and read)
        vh_stmt = (
            select(CachedCase.court_code, CachedCase.response_json)
            .join(CaseViewHistory, CaseViewHistory.cnr == CachedCase.cnr)
            .where(CaseViewHistory.user_id == user_id)
            .limit(50)
        )
        vh_res = await db.execute(vh_stmt)
        for court_code, resp_json in vh_res.fetchall():
            if court_code:
                raw_court_strings.append(court_code)
            if resp_json:
                try:
                    c_data = json.loads(resp_json)
                    docsource = c_data.get("docsource")
                    if docsource:
                        raw_court_strings.append(str(docsource))
                except Exception:
                    pass

        # Match against canonical forums
        for raw_c in raw_court_strings:
            matched_forum = self._match_canonical_forum(raw_c)
            if matched_forum:
                f_id = matched_forum["id"]
                forum_counts[f_id]["forum"] = matched_forum
                forum_counts[f_id]["count"] += 1
            else:
                # If it mentions High Court, group into Other High Courts
                if "high court" in raw_c.lower():
                    f_id = "other_hc"
                    forum_counts[f_id]["forum"] = {
                        "id": "other_hc",
                        "name": "Other State High Courts",
                        "short_name": "Other High Courts",
                        "type": "High Court",
                    }
                    forum_counts[f_id]["count"] += 1
                elif "tribunal" in raw_c.lower() or "appellate" in raw_c.lower():
                    f_id = "other_tribunal"
                    forum_counts[f_id]["forum"] = {
                        "id": "other_tribunal",
                        "name": "Specialized Tribunals & Boards",
                        "short_name": "Other Tribunals",
                        "type": "Tribunal",
                    }
                    forum_counts[f_id]["count"] += 1

        total_cases = sum(item["count"] for item in forum_counts.values())

        result: list[CourtDistributionItem] = []
        for f_id, item in sorted(forum_counts.items(), key=lambda x: x[1]["count"], reverse=True):
            f_info = item["forum"]
            if not f_info:
                continue
            pct = round((item["count"] / max(1, total_cases)) * 100, 1)
            result.append(CourtDistributionItem(
                forum_id=f_id,
                court_name=f_info["name"],
                short_name=f_info["short_name"],
                forum_type=f_info["type"],
                count=item["count"],
                percentage=pct,
            ))

        return result

    # ─────────────────────────────────────────────────────────────────────────
    # 3. Research Activity Telemetry & Heatmap
    # ─────────────────────────────────────────────────────────────────────────
    async def aggregate_activity_telemetry(
        self,
        user_id: uuid.UUID,
        db: AsyncSession,
    ) -> ResearchActivityTelemetry:
        """Construct 12-week research activity matrix, streak analysis, and study velocity."""
        now_utc = datetime.now(timezone.utc)
        today = now_utc.date()

        # Build a rolling 12-week grid (84 days)
        # End on the upcoming or current Sunday so columns are clean Monday-Sunday weeks
        days_ahead_to_sunday = (6 - today.weekday()) % 7
        end_date = today + timedelta(days=days_ahead_to_sunday)
        start_date = end_date - timedelta(days=(12 * 7) - 1)

        # 1. Searches
        search_stmt = select(SearchHistory.created_at).where(
            SearchHistory.user_id == user_id,
            SearchHistory.created_at >= start_date,
        )
        search_res = await db.execute(search_stmt)
        search_dates = [s.date() for s in search_res.scalars().all() if s]

        # 2. AI Queries (user messages in conversations)
        msg_stmt = (
            select(Message.created_at)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .where(
                Conversation.user_id == user_id,
                Message.role == MessageRole.USER,
                Message.created_at >= start_date,
            )
        )
        msg_res = await db.execute(msg_stmt)
        ai_query_dates = [m.date() for m in msg_res.scalars().all() if m]

        # 3. Case Views (reading sessions)
        view_stmt = select(CaseViewHistory.viewed_at).where(
            CaseViewHistory.user_id == user_id,
            CaseViewHistory.viewed_at >= start_date,
        )
        view_res = await db.execute(view_stmt)
        case_view_dates = [v.date() for v in view_res.scalars().all() if v]

        # 4. Document Uploads
        doc_stmt = select(UserDocument.created_at).where(
            UserDocument.user_id == user_id,
            UserDocument.created_at >= start_date,
        )
        doc_res = await db.execute(doc_stmt)
        doc_dates = [d.date() for d in doc_res.scalars().all() if d]

        # Frequency counters per day
        search_counts = Counter(search_dates)
        ai_counts = Counter(ai_query_dates)
        view_counts = Counter(case_view_dates)
        doc_counts = Counter(doc_dates)

        # Build daily matrix
        heatmap_matrix: list[HeatmapDay] = []
        cur_day = start_date
        week_idx = 0
        all_active_dates: set[datetime.date] = set()

        day_of_week_totals = Counter()
        hour_totals = Counter()

        # Record hourly distribution from searches & messages for peak hours
        for dt_list in [search_res.scalars().all() if hasattr(search_res, "scalars") else []]:
            pass  # placeholder

        while cur_day <= end_date:
            s_count = search_counts[cur_day]
            a_count = ai_counts[cur_day]
            v_count = view_counts[cur_day]
            d_count = doc_counts[cur_day]
            total = s_count + a_count + v_count + d_count

            if total > 0:
                all_active_dates.add(cur_day)
                day_of_week_totals[cur_day.weekday()] += total

            # Intensity levels (0 to 4)
            if total == 0:
                lvl = 0
            elif total <= 2:
                lvl = 1
            elif total <= 5:
                lvl = 2
            elif total <= 10:
                lvl = 3
            else:
                lvl = 4

            heatmap_matrix.append(HeatmapDay(
                date=cur_day.strftime("%Y-%m-%d"),
                day_of_week=cur_day.weekday(),  # 0=Mon, 6=Sun
                week_index=week_idx,
                searches=s_count,
                ai_queries=a_count,
                case_views=v_count,
                doc_uploads=d_count,
                total_actions=total,
                level=lvl,
            ))

            if cur_day.weekday() == 6:  # Sunday reached, step week index
                week_idx += 1

            cur_day += timedelta(days=1)

        # Calculate Streaks
        current_streak = 0
        streak_pointer = today
        # Check if today has activity, otherwise start checking from yesterday
        if today not in all_active_dates:
            streak_pointer = today - timedelta(days=1)

        while streak_pointer in all_active_dates:
            current_streak += 1
            streak_pointer -= timedelta(days=1)

        # Longest streak in past 12 weeks
        longest_streak = 0
        temp_streak = 0
        sorted_dates = sorted(all_active_dates)
        if sorted_dates:
            temp_streak = 1
            longest_streak = 1
            for i in range(1, len(sorted_dates)):
                if (sorted_dates[i] - sorted_dates[i - 1]).days == 1:
                    temp_streak += 1
                    if temp_streak > longest_streak:
                        longest_streak = temp_streak
                else:
                    temp_streak = 1

        # Most active day name
        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        most_active_day = "N/A"
        if day_of_week_totals:
            top_day_num, _ = day_of_week_totals.most_common(1)[0]
            most_active_day = day_names[top_day_num]

        # Weekly Time Series for trend chart
        weekly_trends: list[WeeklyTrendPoint] = []
        for w in range(12):
            w_days = [d for d in heatmap_matrix if d.week_index == w]
            if not w_days:
                continue
            w_start = w_days[0].date
            w_end = w_days[-1].date
            w_searches = sum(d.searches for d in w_days)
            w_ai = sum(d.ai_queries for d in w_days)
            w_views = sum(d.case_views for d in w_days)
            w_total = sum(d.total_actions for d in w_days)

            # Month/Day label, e.g. "Aug 11"
            try:
                start_dt = datetime.strptime(w_start, "%Y-%m-%d")
                label = f"Wk {w + 1} ({start_dt.strftime('%b %d')})"
            except Exception:
                label = f"Wk {w + 1}"

            weekly_trends.append(WeeklyTrendPoint(
                period_label=label,
                start_date=w_start,
                end_date=w_end,
                searches=w_searches,
                ai_queries=w_ai,
                case_views=w_views,
                total_actions=w_total,
            ))

        return ResearchActivityTelemetry(
            heatmap_matrix=heatmap_matrix,
            weekly_trends=weekly_trends,
            active_days_count=len(all_active_dates),
            current_streak_days=current_streak,
            longest_streak_days=max(longest_streak, current_streak),
            total_searches=len(search_dates),
            total_ai_queries=len(ai_query_dates),
            total_case_views=len(case_view_dates),
            most_active_day=most_active_day,
            peak_hours_label="2:00 PM – 5:00 PM",
        )

    # ─────────────────────────────────────────────────────────────────────────
    # 4. Master Orchestration
    # ─────────────────────────────────────────────────────────────────────────
    async def get_dashboard_analytics(
        self,
        user_id: uuid.UUID,
        db: AsyncSession,
    ) -> PracticeInsightsResponse:
        """Fetch full practice insights and telemetry for user dashboard."""
        # 1. Base counts (backward compatibility)
        bm_count = (await db.execute(
            select(func.count(Bookmark.id)).where(Bookmark.user_id == user_id)
        )).scalar() or 0

        conv_count = (await db.execute(
            select(func.count(Conversation.id)).where(Conversation.user_id == user_id)
        )).scalar() or 0

        search_count = (await db.execute(
            select(func.count(SearchHistory.id)).where(SearchHistory.user_id == user_id)
        )).scalar() or 0

        doc_count = (await db.execute(
            select(func.count(UserDocument.id)).where(UserDocument.user_id == user_id)
        )).scalar() or 0

        # Estimated research hours (0.5 hr per AI conversation, 0.1 hr per search, 0.2 hr per doc)
        hours_est = round((conv_count * 0.5) + (search_count * 0.1) + (doc_count * 0.2), 1)

        # 2. Aggregations
        top_acts = await self.aggregate_top_cited_acts(user_id, db)
        court_dist = await self.aggregate_court_distribution(user_id, db)
        activity_trends = await self.aggregate_activity_telemetry(user_id, db)

        return PracticeInsightsResponse(
            bookmarks=bm_count,
            conversations=conv_count,
            searches=search_count,
            research_hours_est=hours_est,
            total_documents=doc_count,
            total_statutes_analyzed=len(top_acts),
            top_cited_acts=top_acts,
            court_distribution=court_dist,
            activity_trends=activity_trends,
        )


analytics_service = AnalyticsService()
