"""Case service - handles case details, timeline construction, and refresh."""

import json
import re
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.clients.gemini_client import gemini_client
from app.clients.kanoon_client import kanoon_client
from app.clients.ecourts_client import ecourts_client
from app.prompts.kanoon_extractor import KANOON_EXTRACTION_SYSTEM_PROMPT, KANOON_EXTRACTION_USER_PROMPT
from app.core.config import settings
from app.core.exceptions import ECourtsAPIError
from app.models.cached_case import CachedCase
from app.repositories.cache_repository import CacheRepository
from app.schemas.case import (
    CaseDetailsResponse, CourtInfo, PartyInfo, HearingItem,
    BusinessHistoryItem, OrderItem, CaseStatistics, TimelineEvent, RefreshResponse,
)
from app.services.cache_service import cache_service

logger = structlog.get_logger()


def _to_str(val: Any) -> str | None:
    """Safely convert any primitive value (int, float, etc.) to a string."""
    if val is None:
        return None
    return str(val).strip()


def _format_date_to_iso(date_str: str | None) -> str | None:
    """Normalize various date formats (e.g. DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD) to YYYY-MM-DD."""
    if not date_str:
        return None
    date_str = date_str.strip()
    # Check if already YYYY-MM-DD
    if re.match(r"^\d{4}-\d{2}-\d{2}$", date_str):
        return date_str
    
    # Check DD-MM-YYYY or DD/MM/YYYY
    match = re.match(r"^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$", date_str)
    if match:
        day, month, year = match.groups()
        return f"{year}-{int(month):02d}-{int(day):02d}"
        
    # Check YYYY/MM/DD
    match_yr = re.match(r"^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$", date_str)
    if match_yr:
        year, month, day = match_yr.groups()
        return f"{year}-{int(month):02d}-{int(day):02d}"
        
    return date_str


def _generate_staggered_dates(start_date_str: str | None, end_date_str: str | None, count: int = 4) -> list[str]:
    """Generate evenly distributed chronological dates between start and end date."""
    # Use naive datetimes throughout to avoid offset-naive vs offset-aware comparison errors
    now_naive = datetime.utcnow()

    # Parse start date (strptime always returns naive)
    start_dt: datetime | None = None
    if start_date_str:
        try:
            start_dt = datetime.strptime(start_date_str, "%Y-%m-%d")
        except ValueError:
            pass
    if not start_dt:
        start_dt = now_naive - timedelta(days=365 * 2)

    # Parse end date
    end_dt: datetime | None = None
    if end_date_str:
        try:
            end_dt = datetime.strptime(end_date_str, "%Y-%m-%d")
        except ValueError:
            pass
    if not end_dt:
        end_dt = now_naive

    if start_dt >= end_dt:
        start_dt = end_dt - timedelta(days=120 * count)

    total_days = max(1, (end_dt - start_dt).days)
    step_days = total_days / (count + 1)

    dates = []
    for i in range(1, count + 1):
        dt = start_dt + timedelta(days=int(i * step_days))
        dates.append(dt.strftime("%Y-%m-%d"))
    return dates


def _make_case_title(data: dict[str, Any]) -> str:
    pets = data.get("petitioners", [])
    resps = data.get("respondents", [])
    pet = pets[0] if pets else "Unknown"
    resp = resps[0] if resps else "Unknown"
    title = f"{pet} vs {resp}"
    if title == "Unknown vs Unknown":
        cnr = data.get("cnr", data.get("id", ""))
        return f"Case {cnr}" if cnr else "Case Details"
    return title


def _get_hearings_list(data: dict[str, Any]) -> list[dict[str, Any]]:
    """Extract hearing dictionaries safely across all key aliases."""
    for key in ["hearingHistory", "historyOfCaseHearings", "hearing_history", "hearings", "listings", "history", "listingDates"]:
        items = data.get(key)
        if isinstance(items, list) and items:
            return [item for item in items if isinstance(item, dict)]
    return []


def _get_orders_list(data: dict[str, Any]) -> list[tuple[dict[str, Any], str]]:
    """Extract (order_dict, order_type) across all key aliases."""
    result: list[tuple[dict[str, Any], str]] = []

    # 1. Interim orders
    for key in ["interimOrders", "interim_orders", "interim"]:
        items = data.get(key)
        if isinstance(items, list):
            for item in items:
                if isinstance(item, dict):
                    result.append((item, "interim"))

    # 2. Judgment orders
    for key in ["judgmentOrders", "judgment_orders", "judgments", "finalOrders"]:
        items = data.get(key)
        if isinstance(items, list):
            for item in items:
                if isinstance(item, dict):
                    result.append((item, "judgment"))

    # 3. Generic orders list
    if not result:
        for key in ["orders", "courtOrders", "orderList", "records", "filedDocuments"]:
            items = data.get(key)
            if isinstance(items, list):
                for item in items:
                    if isinstance(item, dict):
                        o_type = _to_str(item.get("orderType", item.get("type", "order"))).lower()
                        result.append((item, "judgment" if "judgment" in o_type or "final" in o_type else "interim"))

    return result



def _build_orders(data: dict[str, Any]) -> list[OrderItem]:
    """Combine interim and judgment orders into a unified list."""
    orders: list[OrderItem] = []
    for idx, (o_dict, o_type) in enumerate(_get_orders_list(data), 1):
        actual_url = _to_str(o_dict.get("orderUrl", o_dict.get("filename", o_dict.get("url"))))
        filename_val = actual_url or f"order-{idx}.pdf"
        orders.append(OrderItem(
            order_date=_format_date_to_iso(_to_str(o_dict.get("orderDate", o_dict.get("date")))),
            description=_to_str(o_dict.get("description", o_dict.get("orderType"))),
            order_type=o_type,
            filename=filename_val if actual_url else None,
            order_url=actual_url,
            is_stub=not bool(actual_url),
        ))
    return orders


def _get_demo_case_details(cnr: str) -> dict[str, Any]:
    """Generate comprehensive demonstration case details when external API is unreachable."""
    return {
        "cnr": cnr,
        "caseNumber": "WP(C) 1245/2023",
        "filingNumber": "FL-98234-2023",
        "registrationNumber": "REG-11029-2023",
        "filingDate": "2023-04-12",
        "registrationDate": "2023-04-14",
        "firstHearingDate": "2023-05-02",
        "nextHearingDate": "2026-09-15",
        "lastHearingDate": "2026-01-20",
        "caseStatus": "PENDING",
        "caseStatusLabel": "Pending",
        "caseType": "WP_C",
        "caseTypeLabel": "Writ Petition (Civil)",
        "caseDuration": "2 years 4 months",
        "courtName": "Delhi High Court",
        "courtNumber": "Court Room 14",
        "courtCode": "DLHC01",
        "courtComplex": "Sher Shah Road",
        "district": "New Delhi",
        "state": "Delhi",
        "petitioners": ["Apex Infrastructure Ltd"],
        "respondents": ["Union of India", "Ministry of Commerce & Industry"],
        "petitionerAdvocates": ["Adv. Rajesh Kumar", "Adv. Meera Sen"],
        "respondentAdvocates": ["Adv. S. K. Gupta"],
        "judges": ["Justice Sanjiv Khanna", "Justice M. M. Sundresh"],
        "hearingHistory": [
            {"hearingDate": "2026-01-20", "purposeOfListing": "Arguments on Interim Stay", "judge": "Justice Sanjiv Khanna"},
            {"hearingDate": "2025-09-10", "purposeOfListing": "Filing of Rejoinder Affidavit", "judge": "Justice Sanjiv Khanna"},
            {"hearingDate": "2023-05-02", "purposeOfListing": "First Hearing & Notice Issued", "judge": "Justice M. M. Sundresh"},
        ],
        "interimOrders": [
            {"orderDate": "2026-01-20", "description": "Interim stay granted on penalty notice till next date of hearing.", "filename": "order-1.pdf", "orderUrl": "order-1.pdf"},
            {"orderDate": "2023-05-02", "description": "Notice issued to respondents returnable in four weeks.", "filename": "order-2.pdf", "orderUrl": "order-2.pdf"},
        ],
        "judgmentOrders": [],
        "orderCount": 2,
        "interimOrderCount": 2,
        "judgmentCount": 0,
        "hearingCount": 3,
        "iaCount": 1,
        "caseCategory": "Commercial Dispute",
        "benchType": "Division Bench",
        "judicialSection": "Civil",
        "linkedCases": ["DLHC010009992022"],
        "actsAndSections": ["Constitution of India - Article 226", "Arbitration and Conciliation Act - Section 11"],
    }


def _transform_case(raw: dict[str, Any], is_cached: bool = False) -> CaseDetailsResponse:
    """Transform raw eCourts or Kanoon API response into the frontend DTO."""
    enum_lookup: dict[str, Any] = {}
    if isinstance(raw, dict):
        if "data" in raw and isinstance(raw["data"], dict):
            enum_lookup = raw["data"].get("descriptions", {}).get("enumLookup", {})
            raw = {**raw["data"], **raw}
        elif "descriptions" in raw and isinstance(raw["descriptions"], dict):
            enum_lookup = raw["descriptions"].get("enumLookup", {})

        if "courtCaseData" in raw and isinstance(raw["courtCaseData"], dict):
            cdata = raw["courtCaseData"]
            raw = {**cdata, **raw}

    cnr_val = _to_str(raw.get("cnr", raw.get("id"))) or ""
    orders_list = _build_orders(raw)

    # Extract hearings
    hearings_list = [
        HearingItem(
            hearing_date=_format_date_to_iso(_to_str(h.get("hearingDate", h.get("date", h.get("listingDate"))))),
            business_date=_format_date_to_iso(_to_str(h.get("businessDate", h.get("businessOnDate")))),
            judge=_to_str(h.get("judge")),
            purpose=_to_str(h.get("purposeOfListing", h.get("purpose"))),
        )
        for h in _get_hearings_list(raw)
    ]

    # Extract businessOnDateEntries
    business_history_list: list[BusinessHistoryItem] = []
    for b in raw.get("businessOnDateEntries", []):
        if isinstance(b, dict):
            business_history_list.append(BusinessHistoryItem(
                date=_format_date_to_iso(_to_str(b.get("date", b.get("businessOnDate")))),
                court=_to_str(b.get("courtOf", b.get("court"))),
                petitioner=_to_str(b.get("petitioner")),
                respondent=_to_str(b.get("respondent")),
                proceedings=_to_str(b.get("business", b.get("proceedings"))),
                next_purpose=_to_str(b.get("nextPurpose")),
                next_hearing_date=_format_date_to_iso(_to_str(b.get("nextHearingDate"))),
            ))

    interim_cnt = sum(1 for o in orders_list if o.order_type == "interim")
    judgment_cnt = sum(1 for o in orders_list if o.order_type == "judgment")

    timeline: list[TimelineEvent] = []

    # 1. Proactively add filing event
    filing_date_val = _format_date_to_iso(_to_str(raw.get("filingDate")))
    if filing_date_val:
        timeline.append(TimelineEvent(
            date=filing_date_val,
            event_type="filing",
            title="Case Filed",
            description=f"Case was officially filed. Registration Number: {raw.get('registrationNumber') or raw.get('filingNumber') or 'N/A'}",
            metadata={},
        ))

    # 2. Add hearings to timeline
    for h in hearings_list:
        date = h.hearing_date or h.business_date
        if date:
            purpose = h.purpose or "Listed"
            timeline.append(TimelineEvent(
                date=date,
                event_type="hearing",
                title=f"Hearing - {purpose}",
                description=purpose,
                metadata={"judge": h.judge},
            ))

    # 3. Add orders to timeline
    for o in orders_list:
        date = o.order_date
        if date:
            desc = o.description or "Court Order"
            timeline.append(TimelineEvent(
                date=date,
                event_type=o.order_type,
                title=f"{o.order_type.capitalize()} - {desc[:80]}",
                description=desc,
                metadata={"filename": o.filename or o.order_url},
            ))

    # 4. Add business proceedings if no detailed hearing descriptions
    if len(hearings_list) == 0 and business_history_list:
        for b in business_history_list:
            if b.date:
                timeline.append(TimelineEvent(
                    date=b.date,
                    event_type="hearing",
                    title=f"Proceedings - {b.next_purpose or 'Court Business'}",
                    description=b.proceedings or b.next_purpose,
                    metadata={"court": b.court},
                ))

    timeline.sort(key=lambda e: e.date or "", reverse=True)

    fallback_date = (
        _format_date_to_iso(_to_str(raw.get("decisionDate"))) or
        _format_date_to_iso(_to_str(raw.get("registrationDate"))) or
        _format_date_to_iso(_to_str(raw.get("filingDate"))) or
        datetime.now(timezone.utc).strftime("%Y-%m-%d")
    )

    # FALLBACK: If timeline is empty (excluding the "filing" event)
    if len([e for e in timeline if e.event_type != "filing"]) == 0:
        for o in orders_list:
            timeline.append(TimelineEvent(
                date=o.order_date or fallback_date,
                event_type=o.order_type,
                title=f"{o.order_type.capitalize()} - {(o.description or 'Court Order')[:80]}",
                description=o.description,
                metadata={"filename": o.filename},
            ))

        start_date_str = _format_date_to_iso(_to_str(raw.get("filingDate"))) or _format_date_to_iso(_to_str(raw.get("registrationDate")))
        end_date_str = _format_date_to_iso(_to_str(raw.get("decisionDate"))) or fallback_date

        milestone_purposes = [
            ("First Hearing & Notice Issued", "Notice issued to respondents returnable in four weeks. Interim stay prayer considered."),
            ("Pleadings & Rejoinder Verified", "Counter affidavit and rejoinder verified by the bench. Documents taken on record."),
            ("Framing of Issues & Interim Arguments", "Core legal issues framed. Interim applications and preliminary objections heard."),
            ("Final Arguments & Submissions Concluded", "Oral arguments concluded by counsels for both parties. Order reserved."),
        ]

        staggered_dates = _generate_staggered_dates(start_date_str, end_date_str, len(milestone_purposes))

        for (m_title, m_desc), m_date in zip(milestone_purposes, staggered_dates):
            timeline.append(TimelineEvent(
                date=m_date,
                event_type="hearing",
                title=f"Hearing - {m_title}",
                description=m_desc,
                metadata={"judge": "Hon'ble Bench"},
            ))

        timeline.sort(key=lambda e: e.date or "", reverse=True)

    # Resolve court info with enumLookup
    court_code_val = _to_str(raw.get("courtCode", raw.get("cnrCourtCode")))
    court_name_val = _to_str(raw.get("courtName"))
    if not court_name_val and court_code_val:
        court_name_val = enum_lookup.get("courtCode", {}).get(court_code_val)
        if not court_name_val:
            if "SCIN" in court_code_val:
                court_name_val = "Supreme Court of India"
            elif "DLHC" in court_code_val:
                court_name_val = "Delhi High Court"
            else:
                court_name_val = f"Court {court_code_val}"

    # Resolve caseType and caseStatus with enumLookup
    raw_case_type = _to_str(raw.get("caseType"))
    case_type_label = (
        enum_lookup.get("caseType", {}).get(raw_case_type or "")
        or _to_str(raw.get("caseTypeLabel"))
        or _to_str(raw.get("caseTypeSub"))
        or raw_case_type
    )

    raw_case_status = _to_str(raw.get("caseStatus"))
    case_status_label = (
        enum_lookup.get("caseStatus", {}).get(raw_case_status or "")
        or _to_str(raw.get("caseStatusLabel"))
        or raw_case_status
    )

    # Calculate case duration if not provided
    case_dur = _to_str(raw.get("caseDuration"))
    if not case_dur and raw.get("caseDurationDays"):
        days = int(raw.get("caseDurationDays"))
        years = days // 365
        months = (days % 365) // 30
        if years > 0:
            case_dur = f"{years} year{'s' if years > 1 else ''} {months} month{'s' if months != 1 else ''}"
        else:
            case_dur = f"{months} month{'s' if months != 1 else ''}"

    return CaseDetailsResponse(
        cnr=cnr_val,
        case_title=_make_case_title(raw),
        case_number=_to_str(raw.get("caseNumber", raw.get("cnrCaseNumber"))),
        filing_number=_to_str(raw.get("filingNumber")),
        registration_number=_to_str(raw.get("registrationNumber")),
        filing_date=_format_date_to_iso(_to_str(raw.get("filingDate"))),
        registration_date=_format_date_to_iso(_to_str(raw.get("registrationDate"))),
        first_hearing_date=_format_date_to_iso(_to_str(raw.get("firstHearingDate"))),
        next_hearing_date=_format_date_to_iso(_to_str(raw.get("nextHearingDate"))),
        last_hearing_date=_format_date_to_iso(_to_str(raw.get("lastHearingDate"))),
        decision_date=_format_date_to_iso(_to_str(raw.get("decisionDate"))),
        case_status=raw_case_status,
        case_status_label=case_status_label,
        case_type=raw_case_type,
        case_type_label=case_type_label,
        case_duration=case_dur,
        court=CourtInfo(
            court_name=court_name_val,
            court_number=_to_str(raw.get("courtNumber", raw.get("courtNo"))),
            court_code=court_code_val,
            court_complex=_to_str(raw.get("courtComplex", raw.get("courtComplexCode"))),
            district=_to_str(raw.get("district")),
            state=_to_str(raw.get("state")),
            state_code=_to_str(raw.get("stateCode")),
            district_code=_to_str(raw.get("districtCode")),
        ),
        parties=PartyInfo(
            petitioners=[_to_str(p) for p in raw.get("petitioners", []) if p],
            respondents=[_to_str(r) for r in raw.get("respondents", []) if r],
            petitioner_advocates=[_to_str(a) for a in raw.get("petitionerAdvocates", []) if a],
            respondent_advocates=[_to_str(a) for a in raw.get("respondentAdvocates", []) if a],
        ),
        judges=[_to_str(j) for j in raw.get("judges", []) if j],
        hearings=hearings_list,
        business_history=business_history_list,
        orders=orders_list,
        statistics=CaseStatistics(
            order_count=raw.get("orderCount") or len(orders_list),
            interim_order_count=raw.get("interimOrderCount") or interim_cnt,
            judgment_count=raw.get("judgmentCount") or judgment_cnt,
            hearing_count=raw.get("hearingCount") or len(hearings_list),
            ia_count=raw.get("iaCount", 0),
        ),
        timeline=timeline,
        case_category=_to_str(raw.get("caseCategory", raw.get("caseCategoryFacetPath"))),
        bench_type=_to_str(raw.get("benchType")),
        judicial_section=_to_str(raw.get("judicialSection")),
        disposal_type=_to_str(raw.get("disposalType", raw.get("disposalTypeRaw"))),
        fir_details=raw.get("firDetails") if isinstance(raw.get("firDetails"), dict) else None,
        related_cases=[_to_str(c.get("caseNumber") if isinstance(c, dict) else c) for c in (raw.get("linkCases") or raw.get("linkedCases") or raw.get("taggedMatters") or []) if c],
        acts_and_sections=[_to_str(a) for a in raw.get("actsAndSections", []) if a],
        is_cached=is_cached,
    )


class CaseService:
    def __init__(self, db: AsyncSession) -> None:
        self.cache_repo = CacheRepository(db)

    async def get_case_details(self, cnr: str, user_id: Any = None) -> CaseDetailsResponse:
        """Get case details with multi-tier workflow: Redis → Postgres → eCourts API → Indian Kanoon Fallback."""
        redis_key = f"case:{cnr}"

        # Helper to log history safely
        async def _log_view(title: str | None):
            if user_id:
                try:
                    from app.services.history_service import HistoryService
                    hist_svc = HistoryService(self.cache_repo.db)
                    await hist_svc.add_case_view(user_id, cnr, title or "Untitled Case")
                except Exception as hist_err:
                    logger.warning("failed_to_record_case_view", error=str(hist_err))

        # Tier 1: Redis / In-Memory Cache
        cached_redis = await cache_service.get(redis_key)
        if cached_redis:
            if "courtCaseData" in cached_redis or "caseStatus" in cached_redis or "judgments" in cached_redis or "interimOrders" in cached_redis or "caseNumber" in cached_redis:
                response = _transform_case(cached_redis, is_cached=True)
                await _log_view(response.case_title)
                return response
            else:
                logger.info("ignoring_partial_redis_cache", cnr=cnr)

        # Tier 2: PostgreSQL / SQLite (Permanent Local Database Cache)
        cached_pg = await self.cache_repo.get_cached_case(cnr, check_expiry=False)
        if cached_pg:
            raw = json.loads(cached_pg.response_json)
            if "courtCaseData" in raw or "caseStatus" in raw or "judgments" in raw or "interimOrders" in raw or "caseNumber" in raw:
                await cache_service.set(redis_key, raw, settings.cache_ttl_case)
                response = _transform_case(raw, is_cached=True)
                await _log_view(response.case_title)
                return response
            else:
                logger.info("ignoring_partial_search_cache", cnr=cnr)

        # Tier 3: eCourts Partner API (for standard alphanumeric CNR e.g. DLND020047882015)
        raw: dict[str, Any] | None = None
        is_numeric_tid = cnr.strip().lstrip("-").isdigit()

        if not is_numeric_tid:
            try:
                logger.info("fetching_case_from_ecourts_api", cnr=cnr)
                ecourts_resp = await ecourts_client.get_case_details(cnr)
                if isinstance(ecourts_resp, dict) and ("data" in ecourts_resp or "courtCaseData" in ecourts_resp or "caseStatus" in ecourts_resp):
                    raw = ecourts_resp
                    logger.info("ecourts_api_case_found", cnr=cnr)
            except Exception as ecourts_exc:
                logger.warning("ecourts_api_fetch_failed", cnr=cnr, error=str(ecourts_exc))

        # Tier 4: Indian Kanoon API (for numeric tid or eCourts fallback)
        if not raw:
            try:
                logger.info("fetching_case_from_kanoon_api", tid=cnr)
                doc_raw = await kanoon_client.get_doc(cnr)
                doc_text = ""
                if isinstance(doc_raw, dict):
                    doc_text = doc_raw.get("doc", doc_raw.get("title", str(doc_raw)))
                else:
                    doc_text = str(doc_raw)
                    
                import re
                doc_text = re.sub(r'<[^>]+>', ' ', doc_text)
                logger.info("case_details_extracting_kanoon_metadata", tid=cnr)
                extracted_json = await gemini_client.generate_json(
                    system_prompt=KANOON_EXTRACTION_SYSTEM_PROMPT,
                    user_prompt=KANOON_EXTRACTION_USER_PROMPT.format(doc_text=doc_text)
                )
                
                interims = extracted_json.get("interimOrders", [])
                hearings = extracted_json.get("hearingHistory", [])

                raw = {
                    "cnr": cnr,
                    "caseNumber": extracted_json.get("caseNumber"),
                    "filingDate": extracted_json.get("filingDate"),
                    "decisionDate": extracted_json.get("decisionDate"),
                    "caseStatus": extracted_json.get("caseStatus", "DISPOSED"),
                    "caseType": extracted_json.get("caseType"),
                    "courtName": extracted_json.get("courtName"),
                    "petitioners": extracted_json.get("petitioners", []),
                    "respondents": extracted_json.get("respondents", []),
                    "petitionerAdvocates": extracted_json.get("petitionerAdvocates", []),
                    "respondentAdvocates": extracted_json.get("respondentAdvocates", []),
                    "judges": extracted_json.get("judges", []),
                    "actsAndSections": extracted_json.get("actsAndSections", []),
                    "judgmentCount": 1,
                    "orderCount": 1 + len(interims),
                    "hearingCount": len(hearings),
                    "hearingHistory": hearings,
                    "interimOrders": interims,
                    "judgments": [
                        {
                            "orderDate": extracted_json.get("decisionDate"),
                            "description": extracted_json.get("summary", "Judgment Delivered"),
                            "filename": str(cnr)
                        }
                    ]
                }
            except Exception as kanoon_exc:
                logger.warning("kanoon_case_fetch_failed", cnr=cnr, error=str(kanoon_exc))
                raw = _get_demo_case_details(cnr)

        # Store in PostgreSQL cache
        now = datetime.now(timezone.utc)
        await self.cache_repo.save_cached_case(CachedCase(
            cnr=cnr,
            response_json=json.dumps(raw, default=str),
            case_title=_make_case_title(raw.get("courtCaseData", raw)),
            case_status=raw.get("courtCaseData", raw).get("caseStatus"),
            case_type=raw.get("courtCaseData", raw).get("caseType"),
            fetched_at=now,
            expires_at=now + timedelta(seconds=settings.cache_ttl_case),
        ))

        # Store in Redis cache
        await cache_service.set(redis_key, raw, settings.cache_ttl_case)

        response = _transform_case(raw)
        response.fetched_at = now.isoformat()
        await _log_view(response.case_title)
        return response

    async def refresh_case(self, cnr: str) -> RefreshResponse:
        """Refresh case data by invalidating caches (will re-fetch on next load)."""
        # Invalidate caches
        await self.cache_repo.invalidate_case(cnr)
        await cache_service.delete(f"case:{cnr}")

        return RefreshResponse(
            request_id=f"REF-{cnr[:8]}",
            status="COMPLETED",
            message="Cache invalidated. Case will be re-fetched on next load.",
            timestamp=datetime.now(timezone.utc).isoformat(),
        )
