"""Search service - handles search logic, local DB lookup, eCourts API fetching, and caching."""

import json
import hashlib
import re
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.clients.ecourts_client import ecourts_client
from app.clients.kanoon_client import kanoon_client
from app.core.config import settings
from app.core.exceptions import ECourtsAPIError
from app.models.cached_case import CachedCase
from app.repositories.cache_repository import CacheRepository
from app.schemas.search import SearchRequest, SearchResponse, SearchResultItem, SearchCapabilitiesResponse
from app.services.cache_service import cache_service

logger = structlog.get_logger()

CNR_PATTERN = re.compile(r"^[A-Z]{4}\d{12}$")

RESERVED_METADATA_KEYS = {
    "results", "totalhits", "page", "pagesize", "data", "status",
    "message", "error", "code", "success", "items", "cases",
    "content", "records", "facets", "total", "count", "limit", "offset"
}


def _build_search_params(request: SearchRequest) -> dict[str, Any]:
    """Convert SearchRequest into eCourts API query parameters."""
    params: dict[str, Any] = {}
    if request.query:
        params["query"] = request.query
    if request.petitioners:
        params["petitioners[]"] = request.petitioners
    if request.respondents:
        params["respondents[]"] = request.respondents
    if request.advocates:
        params["advocates[]"] = request.advocates
    if request.judges:
        params["judges[]"] = request.judges
    if request.name_match_mode:
        params["nameMatchMode"] = request.name_match_mode
    if request.court_code:
        params["courtCode"] = request.court_code
    if request.state_code:
        params["stateCode"] = request.state_code
    if request.district_code:
        params["districtCode"] = request.district_code
    if request.filing_year:
        params["filingYear"] = request.filing_year
    if request.case_type:
        params["caseType"] = request.case_type
    if request.case_status:
        params["caseStatus"] = request.case_status
    if request.sort_by:
        params["sortBy"] = request.sort_by
        params["sortOrder"] = request.sort_order
    params["page"] = request.page
    params["pageSize"] = request.page_size
    return params


def _make_case_title(petitioners: list[str], respondents: list[str]) -> str:
    """Transform petitioner/respondent arrays into a readable case title."""
    pet = petitioners[0] if petitioners else "Unknown"
    res = respondents[0] if respondents else "Unknown"
    return f"{pet} vs {res}"


def _ensure_list(val: Any) -> list[str]:
    """Safely convert string, list, or None into a list of strings."""
    if not val:
        return []
    if isinstance(val, list):
        return [str(v) for v in val if v]
    if isinstance(val, str):
        return [val.strip()]
    return [str(val)]


def _extract_results_list(raw_response: Any) -> list:
    """Extract a list of case items safely from any raw API response format (including nested dicts)."""
    if isinstance(raw_response, list):
        return raw_response
    if isinstance(raw_response, dict):
        # 1. Direct list in known keys
        for key in ["results", "data", "cases", "items", "searchResults", "content", "records"]:
            val = raw_response.get(key)
            if isinstance(val, list):
                return val
            if isinstance(val, dict):
                nested = _extract_results_list(val)
                if nested:
                    return nested
    return []




def _raw_to_search_item(item: dict[str, Any] | str) -> SearchResultItem | None:
    """Convert a raw API response item (dict or str) safely into a SearchResultItem DTO."""
    if isinstance(item, str):
        clean_str = item.strip()
        if clean_str.lower() in RESERVED_METADATA_KEYS or len(clean_str) < 8:
            return None  # Ignore JSON keys / metadata strings
        return SearchResultItem(
            cnr=clean_str,
            case_title=f"Case {clean_str}",
            case_type=None,
            case_status=None,
            petitioners=[],
            respondents=[],
        )

    if not isinstance(item, dict):
        return None

    # Support both eCourts cnr/id and Kanoon tid
    cnr = str(item.get("tid", item.get("cnr", item.get("caseNumberRecord", item.get("case_number", item.get("id", "")))))).strip()
    if not cnr or cnr.lower() in RESERVED_METADATA_KEYS:
        return None

    petitioners = _ensure_list(item.get("petitioners", item.get("petitioner")))
    respondents = _ensure_list(item.get("respondents", item.get("respondent")))
    advocates = _ensure_list(item.get("advocates", item.get("advocate")))
    judges = _ensure_list(item.get("judges", item.get("judge")))
    acts_and_sections = _ensure_list(item.get("actsAndSections", item.get("acts_and_sections")))
    ai_keywords = _ensure_list(item.get("aiKeywords", item.get("ai_keywords")))

    # Indian Kanoon uses "title", eCourts uses "case_title"
    case_title = item.get("title", item.get("case_title", item.get("caseTitle", _make_case_title(petitioners, respondents))))
    
    # Strip HTML tags from Kanoon title if present
    import re
    case_title = re.sub(r'<[^>]+>', '', str(case_title))
    
    if not case_title or case_title == "Unknown vs Unknown":
        case_title = f"Document {cnr}"

    # Kanoon publishdate mapping
    decision_date = item.get("publishdate", item.get("decisionDate", item.get("decision_date")))
    
    # Kanoon docsource mapping
    court_name = item.get("docsource", item.get("courtName", item.get("court_name")))

    return SearchResultItem(
        cnr=cnr,
        case_title=str(case_title),
        case_type=item.get("caseType", item.get("case_type")),
        case_type_label=item.get("caseTypeLabel", item.get("case_type_label", item.get("caseType"))),
        case_status=item.get("caseStatus", item.get("case_status")),
        case_status_label=item.get("caseStatusLabel", item.get("case_status_label", item.get("caseStatus"))),
        filing_date=item.get("filingDate", item.get("filing_date")),
        decision_date=decision_date,
        next_hearing_date=item.get("nextHearingDate", item.get("next_hearing_date")),
        petitioners=petitioners,
        respondents=respondents,
        advocates=advocates,
        judges=judges,
        court_code=item.get("courtCode", item.get("court_code")),
        court_name=court_name,
        acts_and_sections=acts_and_sections,
        ai_keywords=ai_keywords,
    )


def _apply_filters(items: list[SearchResultItem], request: SearchRequest) -> list[SearchResultItem]:
    """Strictly filter results by active search filter parameters."""
    filtered: list[SearchResultItem] = []
    for item in items:
        # 1. Case Status
        if request.case_status and request.case_status.strip():
            st = request.case_status.strip().upper()
            item_st = (item.case_status or "").upper()
            if st not in item_st and item_st not in st:
                continue

        # 2. Case Type
        if request.case_type and request.case_type.strip():
            ct = request.case_type.strip().upper()
            item_ct = (item.case_type or "").upper()
            if ct not in item_ct and item_ct not in ct:
                continue

        # 3. Filing Year
        if request.filing_year:
            target_yr = str(request.filing_year).strip()
            item_yr = ""
            if item.filing_date and len(item.filing_date) >= 4:
                item_yr = item.filing_date[:4]
            elif item.cnr and len(item.cnr) >= 4:
                item_yr = item.cnr[-4:]
            
            if target_yr != item_yr and target_yr not in (item.filing_date or ""):
                continue

        # 4. Court Code
        if request.court_code and request.court_code.strip():
            cc = request.court_code.strip().upper()
            item_cc = (item.court_code or "").upper()
            if cc not in item_cc:
                continue

        filtered.append(item)
    return filtered


# Realistic initial dataset for local DB seeding when external API is unreachable
DEMO_CASES_DATASET: list[dict[str, Any]] = [
    {
        "cnr": "SCIN010177522021",
        "case_title": "The Editors Guild of India vs Union of India",
        "caseType": "WP_C",
        "caseTypeLabel": "Writ Petition (Civil)",
        "caseStatus": "ADMITTED",
        "caseStatusLabel": "Admitted",
        "filingDate": "2021-08-03",
        "nextHearingDate": "2025-07-30",
        "petitioners": ["The Editors Guild of India", "Mrinal Pande"],
        "respondents": ["Union of India"],
        "advocates": ["LZAFEER AHMAD B. F."],
        "judges": ["Hon'ble SURYA KANT", "Hon'ble NONGMEIKAPAM KOTISWAR SINGH"],
        "courtCode": "SCIN01",
        "courtName": "Supreme Court of India, New Delhi",
        "actsAndSections": ["Constitution of India - Article 32", "IT Act - Section 66A"],
        "aiKeywords": ["Press Freedom", "Writ Petition", "Surveillance"],
    },
    {
        "cnr": "DLHC010631472005",
        "case_title": "Apex Infrastructure Ltd vs Union of India & Ors",
        "caseType": "WP_C",
        "caseTypeLabel": "Writ Petition (Civil)",
        "caseStatus": "PENDING",
        "caseStatusLabel": "Pending",
        "filingDate": "2023-04-12",
        "nextHearingDate": "2026-09-15",
        "petitioners": ["Apex Infrastructure Ltd"],
        "respondents": ["Union of India", "Ministry of Commerce & Industry"],
        "advocates": ["Adv. A. K. Sharma", "Adv. R. Mehta"],
        "judges": ["Justice Sanjiv Khanna", "Justice M. M. Sundresh"],
        "courtCode": "DLHC01",
        "courtName": "Delhi High Court",
        "actsAndSections": ["Constitution of India - Article 226", "Arbitration Act - Section 11"],
        "aiKeywords": ["Contractual Dispute", "Writ Petition", "Interim Relief"],
    },
    {
        "cnr": "DLND020047882015",
        "case_title": "State vs Criminal Syndicate & Ors",
        "caseType": "CRL_A",
        "caseTypeLabel": "Criminal Appeal",
        "caseStatus": "DISPOSED",
        "caseStatusLabel": "Disposed",
        "filingDate": "2021-08-20",
        "decisionDate": "2025-11-10",
        "petitioners": ["State (NCT of Delhi)"],
        "respondents": ["Criminal Syndicate Ltd", "Ramesh Verma"],
        "advocates": ["Adv. P. V. Kapur"],
        "judges": ["Justice D. Y. Chandrachud"],
        "courtCode": "DLND02",
        "courtName": "New Delhi District Court",
        "actsAndSections": ["Indian Penal Code - Section 420", "IPC - Section 120B"],
        "aiKeywords": ["Criminal Appeal", "Financial Offence", "Acquittal"],
    },
    {
        "cnr": "DLHC010001232024",
        "case_title": "Mehta & Sons vs Logistics Corp Ltd",
        "caseType": "CS",
        "caseTypeLabel": "Civil Suit",
        "caseStatus": "PENDING",
        "caseStatusLabel": "Pending",
        "filingDate": "2024-01-15",
        "nextHearingDate": "2026-10-02",
        "petitioners": ["Mehta & Sons"],
        "respondents": ["Logistics Corp Ltd"],
        "advocates": ["Adv. S. N. Mukherjee"],
        "judges": ["Justice Sanjiv Khanna"],
        "courtCode": "DLHC01",
        "courtName": "Delhi High Court",
        "actsAndSections": ["Code of Civil Procedure - Order 39"],
        "aiKeywords": ["Civil Suit", "Injunction", "Breach of Contract"],
    },
    {
        "cnr": "BOMHC01008892022",
        "case_title": "Reliance Global Trading vs Commissioner of Income Tax",
        "caseType": "RFA",
        "caseTypeLabel": "Regular First Appeal",
        "caseStatus": "PENDING",
        "caseStatusLabel": "Pending",
        "filingDate": "2022-06-18",
        "nextHearingDate": "2026-08-25",
        "petitioners": ["Reliance Global Trading"],
        "respondents": ["Commissioner of Income Tax"],
        "advocates": ["Adv. Harish Salve", "Adv. Mukul Rohatgi"],
        "judges": ["Justice B. R. Gavai"],
        "courtCode": "BOMHC01",
        "courtName": "Bombay High Court",
        "actsAndSections": ["Income Tax Act - Section 260A"],
        "aiKeywords": ["Taxation", "Corporate Tax", "Assessment Year"],
    },
    {
        "cnr": "KARHC01004562023",
        "case_title": "TechWorks Software Solutions vs State of Karnataka",
        "caseType": "WP_C",
        "caseTypeLabel": "Writ Petition (Civil)",
        "caseStatus": "DISPOSED",
        "caseStatusLabel": "Disposed",
        "filingDate": "2023-11-05",
        "decisionDate": "2024-12-19",
        "petitioners": ["TechWorks Software Solutions"],
        "respondents": ["State of Karnataka", "Karnataka Industrial Area Development Board"],
        "advocates": ["Adv. Uday Holla"],
        "judges": ["Justice P. S. Narasimha"],
        "courtCode": "KARHC01",
        "courtName": "Karnataka High Court",
        "actsAndSections": ["Karnataka Land Acquisition Act - Section 28"],
        "aiKeywords": ["Land Acquisition", "IT Park", "Compensation"],
    },
    {
        "cnr": "SCIN010000122025",
        "case_title": "Central Bureau of Investigation vs Sharma & Associates",
        "caseType": "SLP",
        "caseTypeLabel": "Special Leave Petition",
        "caseStatus": "PENDING",
        "caseStatusLabel": "Pending",
        "filingDate": "2025-02-01",
        "nextHearingDate": "2026-11-12",
        "petitioners": ["Central Bureau of Investigation"],
        "respondents": ["Sharma & Associates", "Vijay Sharma"],
        "advocates": ["Solicitor General Tushar Mehta"],
        "judges": ["Chief Justice B. R. Gavai", "Justice Surya Kant"],
        "courtCode": "SCIN01",
        "courtName": "Supreme Court of India",
        "actsAndSections": ["Prevention of Corruption Act - Section 7", "CrPC - Section 482"],
        "aiKeywords": ["Criminal Special Leave", "Quashing Petition", "CBI Probe"],
    },
]


class SearchService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.cache_repo = CacheRepository(db)

    async def search(self, request: SearchRequest) -> SearchResponse:
        """Execute search following the documented strategy:

        1. Check Redis search cache
        2. Query local database (CachedCase table) for existing matches
        3. If NOT found in local database -> execute eCourts API call
        4. Apply strict filters (case_status, case_type, filing_year, court_code)
        5. Return filtered SearchResponse
        """
        params = _build_search_params(request)
        cache_key = f"search:{hashlib.md5(json.dumps(params, sort_keys=True).encode()).hexdigest()}"



        # 1. Check Redis cache
        cached = await cache_service.get(cache_key)
        if cached:
            logger.info("search_redis_hit", query=request.query)
            return SearchResponse(**cached)

        results: list[SearchResultItem] = []
        page_size = request.page_size or 20
        total_hits = 0

        # 2. Search Indian Kanoon Live API as Primary Search Provider
        if request.query and request.query.strip():
            try:
                logger.info("searching_via_kanoon_primary", query=request.query, page=request.page)
                kanoon_res = await kanoon_client.search_docs(
                    query=request.query.strip(),
                    pagenum=request.page or 1,
                )
                docs = kanoon_res.get("docs", [])
                if docs:
                    for doc in docs:
                        item = _raw_to_search_item(doc)
                        if item and item.cnr:
                            results.append(item)
                    results = _apply_filters(results, request)

                    # Parse total hits safely from Kanoon string or int
                    raw_found = kanoon_res.get("found")
                    total_hits = len(results)
                    if isinstance(raw_found, int):
                        total_hits = raw_found
                    elif isinstance(raw_found, str):
                        match = re.search(r'of\s+([0-9,]+)', raw_found)
                        if match:
                            total_hits = int(match.group(1).replace(',', ''))
                        else:
                            digits = re.findall(r'\d+', raw_found)
                            if digits:
                                total_hits = int(digits[-1])

                    # Format facets safely as dict
                    facets_dict: dict[str, Any] = {}
                    cats = kanoon_res.get("categories")
                    if isinstance(cats, dict):
                        facets_dict = cats
                    elif isinstance(cats, list):
                        for cat_item in cats:
                            if isinstance(cat_item, list) and len(cat_item) == 2:
                                facets_dict[str(cat_item[0])] = cat_item[1]

                    if results:
                        response = SearchResponse(
                            results=results,
                            total_hits=total_hits,
                            page=request.page or 1,
                            page_size=page_size,
                            total_pages=(total_hits + page_size - 1) // page_size if page_size > 0 else 1,
                            facets=facets_dict,
                        )
                        await cache_service.set(cache_key, response.model_dump(), settings.cache_ttl_search)
                        return response
            except Exception as kanoon_exc:
                logger.warning("kanoon_search_failed", error=str(kanoon_exc))

        # 3. Fallback: Query Local Database
        local_db_cases = await self.cache_repo.search_local_cases(
            query=request.query,
            court_code=request.court_code,
            case_status=request.case_status,
            case_type=request.case_type,
            filing_year=request.filing_year,
        )

        if local_db_cases:
            logger.info("search_local_db_hit", query=request.query, match_count=len(local_db_cases))
            for db_case in local_db_cases:
                try:
                    data = json.loads(db_case.response_json)
                    item = _raw_to_search_item(data)
                    if item:
                        results.append(item)
                except Exception:
                    continue

            results = _apply_filters(results, request)
            if results:
                total_hits = len(results)
                offset = ((request.page or 1) - 1) * page_size
                paginated_results = results[offset : offset + page_size]

                response = SearchResponse(
                    results=paginated_results,
                    total_hits=total_hits,
                    page=request.page,
                    page_size=page_size,
                    total_pages=(total_hits + page_size - 1) // page_size if page_size > 0 else 1,
                    facets={},
                )
                await cache_service.set(cache_key, response.model_dump(), settings.cache_ttl_search)
                return response

        # Return empty response gracefully
        return SearchResponse(
            results=[],
            total_hits=0,
            page=request.page,
            page_size=page_size,
            total_pages=0,
            facets={},
        )

    async def get_capabilities(self) -> SearchCapabilitiesResponse:
        """Get search capabilities with 24-hour cache."""
        cache_key = "search:capabilities"
        cached = await cache_service.get(cache_key)
        if cached:
            return SearchCapabilitiesResponse(**cached)

        # Kanoon doesn't have a capabilities endpoint, so we return generic capabilities
        response = SearchCapabilitiesResponse(
            sortable_fields=["filingDate", "decisionDate", "nextHearingDate", "filingYear"],
            facetable_fields=["caseStatus", "caseType", "courtCode", "filingYear"],
            projectable_fields=["cnr", "petitioners", "respondents", "advocates", "judges"],
            name_match_modes=["all", "any", "phrase", "fuzzy"],
            court_levels=["supreme_court", "high_court", "district_court"],
            max_page_size=100,
            multi_value_params=["petitioners", "respondents", "advocates", "judges", "caseStatus", "caseType", "courtCode", "stateCode", "districtCode"],
        )
        await cache_service.set(cache_key, response.model_dump(), settings.cache_ttl_enums)
        return response
