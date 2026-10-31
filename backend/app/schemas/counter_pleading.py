"""Pydantic schemas for the Adversarial Defense Engine (Counter-Pleading & Written Statement Generator)."""

from typing import Optional
from pydantic import BaseModel, Field


class PlaintParagraph(BaseModel):
    """An individual paragraph extracted from an opposing Plaint or Writ Petition."""
    para_number: int
    text: str
    is_substantive: bool = True
    detected_topic: str = "General Allegation"


class StatutoryBar(BaseModel):
    """A procedural or substantive statutory bar detected in the plaint."""
    bar_id: str
    title: str
    statute: str
    precedent: str
    description: str
    suggested_objection_text: str
    is_selected: bool = True


class AnalyzePlaintRequest(BaseModel):
    """Request to analyze an opposing Plaint/Petition either by document_id or direct raw text."""
    document_id: Optional[str] = None
    raw_text: Optional[str] = None
    plaint_title: Optional[str] = None


class AnalyzePlaintResponse(BaseModel):
    """Extracted plaint structure, detected statutory bars, and paragraph breakdown."""
    court_name: str = "IN THE COURT OF THE DISTRICT JUDGE, COMMERCIAL DIVISION"
    suit_number: str = "CS (COMM) NO. ______ OF 2026"
    plaintiff: str = "PLAINTIFF"
    defendant: str = "DEFENDANT"
    paragraphs: list[PlaintParagraph] = Field(default_factory=list)
    detected_bars: list[StatutoryBar] = Field(default_factory=list)
    total_paragraphs: int = 0
    substantive_count: int = 0


class GenerateWrittenStatementRequest(BaseModel):
    """Request to synthesize a complete court-ready Written Statement under Order VIII CPC."""
    court_name: str = "IN THE COURT OF THE DISTRICT JUDGE, COMMERCIAL DIVISION"
    suit_number: str = "CS (COMM) NO. ______ OF 2026"
    plaintiff: str = "PLAINTIFF"
    defendant: str = "DEFENDANT"
    selected_bars: list[StatutoryBar] = Field(default_factory=list)
    paragraphs: list[PlaintParagraph] = Field(default_factory=list)
    defense_strategy: str = Field(
        default="aggressive_denial",
        description="Pleading stance: 'aggressive_denial', 'demurrer', or 'counter_claim'",
    )
    advocate_notes: Optional[str] = Field(
        default=None,
        description="Specific instructions or factual counters to be incorporated by the advocate",
    )


class TraverseItem(BaseModel):
    """An individual paragraph traverse in the Written Statement."""
    para_number: int
    allegation_summary: str
    traverse_text: str
    is_ai_generated: bool = False


class WrittenStatementResponse(BaseModel):
    """Court-ready Written Statement response with structured sections and compiled HTML."""
    title: str
    cause_title_html: str
    preliminary_objections_html: str
    preliminary_submissions_html: str
    para_wise_reply_html: str
    prayer_html: str
    verification_html: str
    full_draft_html: str
    traversals: list[TraverseItem] = Field(default_factory=list)
