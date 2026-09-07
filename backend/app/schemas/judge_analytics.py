"""Pydantic schemas for Judicial Analytics & Bench Intelligence Dossier."""

from typing import Optional
from pydantic import BaseModel, Field


class StatuteMetric(BaseModel):
    statute: str
    count: int
    percentage: float
    category: str = "General"


class SubjectAreaMetric(BaseModel):
    area: str
    count: int
    percentage: float
    icon: str = "Scale"


class CadenceYearMetric(BaseModel):
    year: int
    count: int


class LandmarkJudgment(BaseModel):
    tid: Optional[str | int] = None
    title: str
    year: int | str
    citation: str
    subject: str
    bench_strength: str = "Division Bench"
    ratio_summary: str
    disposition: Optional[str] = "Disposed"
    court: Optional[str] = None


class BenchPartner(BaseModel):
    name: str
    joint_cases_count: int
    notable_case: Optional[str] = None


class BenchInsight(BaseModel):
    title: str
    tip: str
    tag: str = "Advocacy Insight"


class JudgeAnalyticsDossier(BaseModel):
    judge_name: str
    clean_name: str
    salutation: str = "Hon'ble Mr. Justice"
    court: str
    tenure: str
    is_sitting: bool = True
    total_judgments: int
    disposal_rate: str = "Active"
    primary_focus: str
    experience_years: int = 15
    top_statutes: list[StatuteMetric] = Field(default_factory=list)
    subject_areas: list[SubjectAreaMetric] = Field(default_factory=list)
    disposal_cadence: list[CadenceYearMetric] = Field(default_factory=list)
    landmark_judgments: list[LandmarkJudgment] = Field(default_factory=list)
    bench_partners: list[BenchPartner] = Field(default_factory=list)
    bench_insights: list[BenchInsight] = Field(default_factory=list)
    source: str = "Indian Kanoon Legal Repository & Bench Intelligence Analytics"
    fetched_at: str
    is_cached: bool = False
