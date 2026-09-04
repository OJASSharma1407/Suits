"""Analytics schemas - DTOs for real telemetry, statute analysis, and activity trends."""

from pydantic import BaseModel, ConfigDict, Field


class StatuteItem(BaseModel):
    model_config = ConfigDict(coerce_numbers_to_str=True)
    id: str
    act_name: str
    short_name: str
    category: str
    citation_count: int = 0
    cases_count: int = 0
    percentage: float = 0.0
    top_sections: list[str] = Field(default_factory=list)
    sample_sources: list[str] = Field(default_factory=list)


class CourtDistributionItem(BaseModel):
    model_config = ConfigDict(coerce_numbers_to_str=True)
    forum_id: str
    court_name: str
    short_name: str
    forum_type: str  # "Apex Court", "High Court", "Tribunal", "District Court", "Special Forum"
    count: int = 0
    percentage: float = 0.0


class HeatmapDay(BaseModel):
    model_config = ConfigDict(coerce_numbers_to_str=True)
    date: str  # YYYY-MM-DD
    day_of_week: int  # 0 = Monday, 6 = Sunday
    week_index: int  # 0 to 11
    searches: int = 0
    ai_queries: int = 0
    case_views: int = 0
    doc_uploads: int = 0
    total_actions: int = 0
    level: int = 0  # 0 to 4


class WeeklyTrendPoint(BaseModel):
    model_config = ConfigDict(coerce_numbers_to_str=True)
    period_label: str  # e.g., "Wk 32 (Aug 10)"
    start_date: str
    end_date: str
    searches: int = 0
    ai_queries: int = 0
    case_views: int = 0
    total_actions: int = 0


class ResearchActivityTelemetry(BaseModel):
    model_config = ConfigDict(coerce_numbers_to_str=True)
    heatmap_matrix: list[HeatmapDay] = Field(default_factory=list)
    weekly_trends: list[WeeklyTrendPoint] = Field(default_factory=list)
    active_days_count: int = 0
    current_streak_days: int = 0
    longest_streak_days: int = 0
    total_searches: int = 0
    total_ai_queries: int = 0
    total_case_views: int = 0
    most_active_day: str = "N/A"
    peak_hours_label: str = "N/A"


class PracticeInsightsResponse(BaseModel):
    model_config = ConfigDict(coerce_numbers_to_str=True)
    
    # Backward compatible summary counts
    bookmarks: int = 0
    conversations: int = 0
    searches: int = 0
    research_hours_est: float = 0.0
    total_documents: int = 0
    total_statutes_analyzed: int = 0

    # Real telemetry datasets
    top_cited_acts: list[StatuteItem] = Field(default_factory=list)
    court_distribution: list[CourtDistributionItem] = Field(default_factory=list)
    activity_trends: ResearchActivityTelemetry = Field(default_factory=ResearchActivityTelemetry)
