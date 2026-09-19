"""Pydantic v2 schemas for Automated Publisher-Grade Headnote & Ratio Extractor."""

from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field


class PrecedentTreatmentItem(BaseModel):
    """Citator analysis of a precedent cited in the court judgment."""
    precedent_name: str = Field(description="Exact case citation or party name cited in judgment")
    treatment: Literal[
        "OVERRULED",
        "FOLLOWED",
        "RELIED ON",
        "DISTINGUISHED",
        "EXPLAINED",
        "REFERRED",
        "DOUBTED"
    ] = Field(description="Judicial treatment classification of this authority")
    bench_commentary: str = Field(description="Brief explanation of how the court treated this precedent")
    overruled_specific_ratio: str | None = Field(
        default=None,
        description="If overruled or distinguished, the specific proposition that was discarded or narrowed",
    )


class StatutoryInterpretationItem(BaseModel):
    """Statutory provision analyzed and nature of judicial interpretation."""
    act_name: str = Field(description="Full name of the statute (e.g. Arbitration and Conciliation Act, 1996)")
    section_article: str = Field(description="Section, Rule, or Constitutional Article (e.g. Section 11(6), Article 226)")
    nature_of_interpretation: Literal[
        "STRICT",
        "PURPOSIVE",
        "HARMONIOUS",
        "READ_DOWN",
        "VALIDITY_UPHELD",
        "PROSPECTIVE_OVERRULING",
        "GENERAL_APPLICATION"
    ] = Field(description="Judicial technique used by the bench")
    interpretation_summary: str = Field(description="Brief statement of how the court interpreted this provision")


class CaseHeadnote(BaseModel):
    """Publisher-grade legal headnote conforming to SCC / AIR editorial standards."""
    catchwords: list[str] = Field(
        description="Hierarchical dash-separated catchwords: [Act/Subject] — [Section] — [Focal Point] — [Core Doctrine]."
    )
    held_points: list[str] = Field(
        description="Numbered publisher-grade 'Held' statements articulating the pure ratio decidendi."
    )
    ratio_decidendi_summary: str = Field(
        description="Comprehensive 2-3 paragraph analytical distillation of the core rule of law."
    )
    obiter_dicta: list[str] = Field(
        default=[],
        description="Non-binding observations, judicial concerns, or passing remarks made by the bench."
    )
    precedent_citator_table: list[PrecedentTreatmentItem] = Field(
        default=[],
        description="Detailed table of past authorities cited and how they were treated (Overruled, Followed, Distinguished).",
    )
    statutory_provisions_considered: list[StatutoryInterpretationItem] = Field(
        default=[],
        description="Provisions of law examined and interpreted in this judgment.",
    )
    operative_disposition: str = Field(
        description="Final operative order: 'Appeal Allowed', 'Writ Dismissed', 'Interim Injunction Granted', etc."
    )


class CaseHeadnoteResponse(BaseModel):
    """Full API response for case headnote."""
    target_cnr: str
    order_id: str | None = None
    order_title: str | None = None
    order_date: str | None = None
    court_name: str | None = None
    bench_coram: list[str] = Field(default=[])
    headnote: CaseHeadnote
    model_attribution: str = Field(
        default="Rhetorical Segmentation: InLegalBERT · Synthesis: Gemini 3.6 Flash"
    )
    order_hash: str
    is_cached: bool = False
    generated_at: str
