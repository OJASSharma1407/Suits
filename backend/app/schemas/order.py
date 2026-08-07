"""Order schemas - DTOs for order AI, markdown, and download endpoints."""

from typing import Any
from pydantic import BaseModel


class OrderMarkdownResponse(BaseModel):
    """Markdown representation of a court order."""
    cnr: str
    filename: str
    markdown: str


class OrderAIResponse(BaseModel):
    """AI-generated analysis of a court order."""
    cnr: str
    filename: str

    # Foundational metadata
    case_number: str | None = None
    court_name: str | None = None
    judge_names: list[str] = []
    order_date: str | None = None

    # Parties
    petitioners: list[dict[str, Any]] = []
    respondents: list[dict[str, Any]] = []

    # Legal representation
    counsel_petitioner: list[str] = []
    counsel_respondent: list[str] = []

    # Procedural details
    order_nature: str | None = None
    disposition_status: str | None = None
    outcome: str | None = None
    court_directions: list[str] = []

    # Legal content
    primary_issues: list[str] = []
    statutes_cited: list[str] = []
    sections_applied: list[str] = []
    case_laws_referenced: list[str] = []

    # Arguments & reasoning
    petitioner_arguments: list[str] = []
    respondent_arguments: list[str] = []
    court_reasoning: str | None = None
    ratio_decidendi: str | None = None

    # AI summaries
    executive_summary: str | None = None
    plain_language_summary: str | None = None
    litigant_friendly_explanation: str | None = None

    # Practical insights
    compliance_directions: list[str] = []
    risks: list[str] = []
    implications: list[str] = []

    # Quality metadata
    extraction_confidence: float | None = None
    raw_data: dict[str, Any] = {}
