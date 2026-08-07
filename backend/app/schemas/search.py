"""Search schemas - DTOs for search requests and results."""

from typing import Any
from pydantic import BaseModel, Field


class SearchRequest(BaseModel):
    """Search query parameters."""
    query: str | None = None
    petitioners: list[str] | None = None
    respondents: list[str] | None = None
    litigants: list[str] | None = None
    advocates: list[str] | None = None
    judges: list[str] | None = None
    name_match_mode: str = "all"
    court_code: str | None = None
    district_code: str | None = None
    state_code: str | None = None
    filing_year: int | None = None
    decision_year: int | None = None
    case_type: str | None = None
    case_status: str | None = None
    bench_type: str | None = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    sort_by: str | None = None
    sort_order: str = "desc"


class SearchResultItem(BaseModel):
    """Individual search result."""
    cnr: str
    case_title: str
    case_type: str | None = None
    case_type_label: str | None = None
    case_status: str | None = None
    case_status_label: str | None = None
    filing_date: str | None = None
    decision_date: str | None = None
    next_hearing_date: str | None = None
    petitioners: list[str] = []
    respondents: list[str] = []
    advocates: list[str] = []
    judges: list[str] = []
    court_code: str | None = None
    court_name: str | None = None
    acts_and_sections: list[str] = []
    ai_keywords: list[str] = []


class SearchResponse(BaseModel):
    """Search response with results and metadata."""
    results: list[SearchResultItem] = []
    total_hits: int = 0
    page: int = 1
    page_size: int = 20
    total_pages: int = 0
    facets: dict[str, Any] = {}


class SearchCapabilitiesResponse(BaseModel):
    """Search capabilities returned by the API."""
    sortable_fields: list[str] = []
    facetable_fields: list[str] = []
    projectable_fields: list[str] = []
    name_match_modes: list[str] = []
    court_levels: list[str] = []
    max_page_size: int = 100
    multi_value_params: list[str] = []
