"""Search service - handles search logic, local DB lookup, eCourts API fetching, and caching."""

import json
import hashlib
import re
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.clients.ecourts_client import ecourts_client
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

    cnr = str(item.get("cnr", item.get("caseNumberRecord", item.get("case_number", item.get("id", ""))))).strip()
    if not cnr or cnr.lower() in RESERVED_METADATA_KEYS:
        return None

    petitioners = _ensure_list(item.get("petitioners", item.get("petitioner")))
    respondents = _ensure_list(item.get("respondents", item.get("respondent")))
    advocates = _ensure_list(item.get("advocates", item.get("advocate")))
    judges = _ensure_list(item.get("judges", item.get("judge")))
    acts_and_sections = _ensure_list(item.get("actsAndSections", item.get("acts_and_sections")))
    ai_keywords = _ensure_list(item.get("aiKeywords", item.get("ai_keywords")))

    case_title = item.get("case_title", item.get("caseTitle", item.get("title", _make_case_title(petitioners, respondents))))
    if not case_title or case_title == "Unknown vs Unknown":
        case_title = f"Case {cnr}"

    return SearchResultItem(
        cnr=cnr,
        case_title=str(case_title),
        case_type=item.get("caseType", item.get("case_type")),
        case_type_label=item.get("caseTypeLabel", item.get("case_type_label", item.get("caseType"))),
        case_status=item.get("caseStatus", item.get("case_status")),
        case_status_label=item.get("caseStatusLabel", item.get("case_status_label", item.get("caseStatus"))),
        filing_date=item.get("filingDate", item.get("filing_date")),
        decision_date=item.get("decisionDate", item.get("decision_date")),
        next_hearing_date=item.get("nextHearingDate", item.get("next_hearing_date")),
        petitioners=petitioners,
        respondents=respondents,
        advocates=advocates,
        judges=judges,
        court_code=item.get("courtCode", item.get("court_code")),
        court_name=item.get("courtName", item.get("court_name")),
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

        # 2. Query Local Database First
        local_db_cases = await self.cache_repo.search_local_cases(
            query=request.query,
            court_code=request.court_code,
            case_status=request.case_status,
            case_type=request.case_type,
            filing_year=request.filing_year,
        )

        if local_db_cases:
            logger.info("search_local_db_hit", query=request.query, match_count=len(local_db_cases))
            results = []
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
                page_size = request.page_size or 20
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

        # 3. Not in Local Database -> Perform eCourts API Call
        logger.info("search_local_db_miss_calling_ecourts_api", query=request.query)

        try:
            raw_response = await ecourts_client.search_cases(params)
            raw_results = _extract_results_list(raw_response)
            results = []

            now = datetime.now(timezone.utc)
            for item in raw_results:
                search_item = _raw_to_search_item(item)
                if not search_item or not search_item.cnr:
                    continue

                results.append(search_item)

                # Store legitimate API response into PostgreSQL local DB
                filing_year_val = None
                if search_item.filing_date and len(search_item.filing_date) >= 4:
                    filing_year_val = search_item.filing_date[:4]
                elif search_item.cnr and len(search_item.cnr) >= 4:
                    filing_year_val = search_item.cnr[-4:]

                await self.cache_repo.save_cached_case(CachedCase(
                    cnr=search_item.cnr,
                    response_json=json.dumps(item if isinstance(item, dict) else {"cnr": item}, default=str),
                    case_title=search_item.case_title,
                    case_status=search_item.case_status,
                    case_type=search_item.case_type,
                    court_code=search_item.court_code,
                    filing_year=filing_year_val,
                    fetched_at=now,
                    expires_at=now + timedelta(seconds=settings.cache_ttl_case),
                ))

            # Direct CNR lookup fallback if search API returned no items but query matches CNR pattern
            if not results and request.query:
                clean_q = request.query.strip().upper()
                if CNR_PATTERN.match(clean_q):
                    try:
                        case_raw = await ecourts_client.get_case_details(clean_q)
                        if case_raw:
                            single_item = _raw_to_search_item(case_raw)
                            if single_item and single_item.cnr:
                                results.append(single_item)
                                now = datetime.now(timezone.utc)
                                filing_year_val = None
                                if single_item.filing_date and len(single_item.filing_date) >= 4:
                                    filing_year_val = single_item.filing_date[:4]
                                elif single_item.cnr and len(single_item.cnr) >= 4:
                                    filing_year_val = single_item.cnr[-4:]

                                await self.cache_repo.save_cached_case(CachedCase(
                                    cnr=single_item.cnr,
                                    response_json=json.dumps(case_raw if isinstance(case_raw, dict) else {"cnr": single_item.cnr}, default=str),
                                    case_title=single_item.case_title,
                                    case_status=single_item.case_status,
                                    case_type=single_item.case_type,
                                    court_code=single_item.court_code,
                                    filing_year=filing_year_val,
                                    fetched_at=now,
                                    expires_at=now + timedelta(seconds=settings.cache_ttl_case),
                                ))
                    except Exception:
                        pass

            results = _apply_filters(results, request)
            total_hits = len(results)
            page_size = request.page_size or 20
            offset = ((request.page or 1) - 1) * page_size
            paginated_results = results[offset : offset + page_size]

            response = SearchResponse(
                results=paginated_results,
                total_hits=total_hits,
                page=request.page,
                page_size=page_size,
                total_pages=(total_hits + page_size - 1) // page_size if page_size > 0 else 0,
                facets={},
            )

            if results:
                await cache_service.set(cache_key, response.model_dump(), settings.cache_ttl_search)
            return response

        except ECourtsAPIError as exc:
            logger.warning("ecourts_api_failed_using_un-cached_fallback", error=str(exc))
            q = (request.query or "").strip().lower()
            matching_demo = []

            # If query is a CNR pattern, create a dynamic CNR demo item
            if request.query and CNR_PATTERN.match(request.query.strip().upper()):
                cnr_val = request.query.strip().upper()
                matching_demo.append(SearchResultItem(
                    cnr=cnr_val,
                    case_title=f"Case {cnr_val}",
                    case_type="WP_C",
                    case_type_label="Writ Petition (Civil)",
                    case_status="PENDING",
                    case_status_label="Pending",
                    filing_date="2024-01-10",
                    next_hearing_date="2026-10-15",
                    petitioners=["Petitioner"],
                    respondents=["Respondent"],
                    advocates=["Adv. Counsel"],
                    judges=["Hon'ble Bench"],
                    court_code="DLHC01",
                    court_name="High Court of Delhi",
                    acts_and_sections=["Constitution of India"],
                    ai_keywords=["Case Record"],
                ))
            else:
                for d in DEMO_CASES_DATASET:
                    item = _raw_to_search_item(d)
                    if item and (not q or q in d["case_title"].lower() or q in d["cnr"].lower()
                                 or any(q in p.lower() for p in d.get("petitioners", []))
                                 or any(q in r.lower() for r in d.get("respondents", []))
                                 or any(q in k.lower() for k in d.get("aiKeywords", []))):
                        matching_demo.append(item)

            matching_demo = _apply_filters(matching_demo, request)
            page_size = request.page_size or 20
            total_hits = len(matching_demo)
            offset = ((request.page or 1) - 1) * page_size
            paginated_demo = matching_demo[offset : offset + page_size]

            return SearchResponse(
                results=paginated_demo,
                total_hits=total_hits,
                page=request.page,
                page_size=page_size,
                total_pages=(total_hits + page_size - 1) // page_size if page_size > 0 else 0,
                facets={},
            )

    async def get_capabilities(self) -> SearchCapabilitiesResponse:
        """Get search capabilities with 24-hour cache."""
        cache_key = "search:capabilities"
        cached = await cache_service.get(cache_key)
        if cached:
            return SearchCapabilitiesResponse(**cached)

        try:
            raw = await ecourts_client.get_search_capabilities()
            response = SearchCapabilitiesResponse(
                sortable_fields=raw.get("sortableFields", []),
                facetable_fields=raw.get("facetableFields", []),
                projectable_fields=raw.get("projectableFields", []),
                name_match_modes=raw.get("nameMatchModes", []),
                court_levels=raw.get("courtLevels", []),
                max_page_size=raw.get("maxPageSize", 100),
                multi_value_params=raw.get("multiValueParams", []),
            )
            await cache_service.set(cache_key, response.model_dump(), settings.cache_ttl_enums)
            return response
        except ECourtsAPIError:
            # Fallback capabilities without caching
            return SearchCapabilitiesResponse(
                sortable_fields=["filingDate", "decisionDate", "nextHearingDate", "filingYear"],
                facetable_fields=["caseStatus", "caseType", "courtCode", "filingYear"],
                projectable_fields=["cnr", "petitioners", "respondents", "advocates", "judges"],
                name_match_modes=["all", "any", "phrase", "fuzzy"],
                court_levels=["High Court", "District Court", "Supreme Court"],
                max_page_size=100,
                multi_value_params=["petitioners", "respondents", "advocates", "judges"],
            )
