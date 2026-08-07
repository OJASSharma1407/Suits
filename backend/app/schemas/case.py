"""Case schemas - DTOs for case details, timeline, hearings."""

from typing import Any
from pydantic import BaseModel, ConfigDict


class PartyInfo(BaseModel):
    model_config = ConfigDict(coerce_numbers_to_str=True)
    petitioners: list[str] = []
    respondents: list[str] = []
    petitioner_advocates: list[str] = []
    respondent_advocates: list[str] = []


class HearingItem(BaseModel):
    model_config = ConfigDict(coerce_numbers_to_str=True)
    hearing_date: str | None = None
    business_date: str | None = None
    judge: str | None = None
    purpose: str | None = None


class BusinessHistoryItem(BaseModel):
    model_config = ConfigDict(coerce_numbers_to_str=True)
    date: str | None = None
    court: str | None = None
    petitioner: str | None = None
    respondent: str | None = None
    proceedings: str | None = None
    next_purpose: str | None = None
    next_hearing_date: str | None = None


class OrderItem(BaseModel):
    """Unified order model combining interim and judgment orders."""
    model_config = ConfigDict(coerce_numbers_to_str=True)
    order_date: str | None = None
    description: str | None = None
    order_type: str = "interim"  # "interim" or "judgment"
    filename: str | None = None
    order_url: str | None = None


class CaseStatistics(BaseModel):
    order_count: int = 0
    interim_order_count: int = 0
    judgment_count: int = 0
    hearing_count: int = 0
    ia_count: int = 0


class TimelineEvent(BaseModel):
    """Unified timeline event merging hearings, orders, and business history."""
    model_config = ConfigDict(coerce_numbers_to_str=True)
    date: str
    event_type: str  # "hearing", "order", "judgment", "filing"
    title: str
    description: str | None = None
    metadata: dict[str, Any] = {}


class CourtInfo(BaseModel):
    model_config = ConfigDict(coerce_numbers_to_str=True)
    court_name: str | None = None
    court_number: str | None = None
    court_code: str | None = None
    court_complex: str | None = None
    district: str | None = None
    state: str | None = None
    state_code: str | None = None
    district_code: str | None = None


class CaseDetailsResponse(BaseModel):
    """Complete case details response sent to the frontend."""
    model_config = ConfigDict(coerce_numbers_to_str=True)
    cnr: str
    case_title: str
    case_number: str | None = None
    filing_number: str | None = None
    registration_number: str | None = None
    filing_date: str | None = None
    registration_date: str | None = None
    first_hearing_date: str | None = None
    next_hearing_date: str | None = None
    last_hearing_date: str | None = None
    decision_date: str | None = None
    case_status: str | None = None
    case_status_label: str | None = None
    case_type: str | None = None
    case_type_label: str | None = None
    case_duration: str | None = None

    court: CourtInfo = CourtInfo()
    parties: PartyInfo = PartyInfo()
    judges: list[str] = []
    hearings: list[HearingItem] = []
    business_history: list[BusinessHistoryItem] = []
    orders: list[OrderItem] = []
    statistics: CaseStatistics = CaseStatistics()
    timeline: list[TimelineEvent] = []

    case_category: str | None = None
    bench_type: str | None = None
    judicial_section: str | None = None

    related_cases: list[str] = []
    acts_and_sections: list[str] = []

    fetched_at: str | None = None
    is_cached: bool = False


class RefreshResponse(BaseModel):
    model_config = ConfigDict(coerce_numbers_to_str=True)
    request_id: str | None = None
    status: str
    message: str
    timestamp: str | None = None
