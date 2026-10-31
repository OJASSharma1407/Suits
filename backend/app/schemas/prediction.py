"""Prediction schemas - Matter-Type-Aware Judicial Outcome & Precedent Comparison models."""

from typing import Literal
from pydantic import BaseModel, ConfigDict, Field


OUTCOME_TAXONOMY: dict[str, list[str]] = {
    "BAIL": ["Granted", "Granted with conditions", "Rejected", "Withdrawn"],
    "WRIT": ["Allowed", "Partly allowed", "Dismissed", "Disposed with directions", "Withdrawn"],
    "CRIMINAL_APPEAL": ["Conviction upheld", "Acquitted", "Sentence modified", "Remanded"],
    "CIVIL_APPEAL": ["Decreed", "Partly decreed", "Dismissed", "Remanded", "Settled"],
    "NI_138": ["Conviction", "Acquittal", "Compounded"],
    "INTERIM_APP": ["Granted", "Granted in part", "Refused"],
    "DEFAULT": ["Relief granted", "Partly granted", "Denied", "Remanded"],
}


class OutcomeWeight(BaseModel):
    """Weight and short rationale assigned to a possible case outcome."""
    model_config = ConfigDict(coerce_numbers_to_str=False)

    label: str = Field(..., description="Standardized outcome label from resolved taxonomy")
    weight: float = Field(..., ge=0.0, le=1.0, description="Precedent-weighted probability between 0.0 and 1.0")
    rationale: str | None = Field(default=None, description="One-line legal justification for this probability")


class CalibrationStatus(BaseModel):
    """Statistical calibration metadata and mandatory disclosure."""
    is_backtested: bool = Field(default=False, description="True if verified against ILDC / ground-truth backtest dataset")
    backtest_sample_size: int | None = Field(default=None, description="Sample size of backtested judgments")
    backtest_accuracy: float | None = Field(default=None, description="Accuracy or macro-F1 achieved on test partition")
    matter_type_evaluated: bool = Field(default=False, description="Whether this specific matter type has backtest coverage")
    disclaimer: str = Field(
        default="Precedent-weighted analytical signal derived from retrieved similar judgments. Not statistical certainty or legal advice.",
        description="Mandatory professional responsibility disclaimer"
    )


class OutcomeDistribution(BaseModel):
    """Complete distribution of potential outcomes for the matter type."""
    matter_type: str = Field(..., description="Resolved matter type: BAIL, WRIT, etc.")
    outcomes: list[OutcomeWeight] = Field(default_factory=list, description="Distribution summing to 1.0")
    basis: Literal["precedent_weighted"] = Field(default="precedent_weighted")
    calibration: CalibrationStatus = Field(default_factory=CalibrationStatus)


class CaseComparisonItem(BaseModel):
    """Precedent comparison item detailing similarities and differences."""
    precedent_title: str = Field(..., description="Full case title of the retrieved precedent")
    precedent_citation: str | None = Field(default=None, description="Official law report citation or Kanoon TID")
    precedent_url: str | None = Field(default=None, description="Link to source judgment on Indian Kanoon")
    inlegalbert_score: float = Field(..., ge=0.0, le=1.0, description="InLegalBERT semantic similarity score")
    similarities: list[str] = Field(default_factory=list, description="Key factual and statutory parallels")
    differences: list[str] = Field(default_factory=list, description="Distinguishing facts, procedural variances, or evidential distinctions")
    directional_effect: Literal["supports_relief", "supports_denial", "neutral"] = Field(
        ...,
        description="Strategic directional tendency of this precedent"
    )
    effect_rationale: str = Field(..., description="Why this precedent sways the bench toward relief or denial")


class ThresholdCheck(BaseModel):
    """Statutory threshold compliance check."""
    test: str = Field(..., description="Statutory rule or threshold requirement (e.g., S. 35(3) BNSS notice)")
    status: Literal["met", "not_met", "unclear"] = Field(..., description="Whether condition is satisfied on record")
    note: str = Field(..., description="Short explanation of compliance status")


class PredictionExplanation(BaseModel):
    """Deep legal explanation of the judicial deduction."""
    governing_doctrine: str = Field(..., description="Core Supreme Court / High Court ratio decidendi governing this issue")
    statutory_thresholds: list[ThresholdCheck] = Field(default_factory=list, description="Checklist of essential statutory preconditions")
    critical_vulnerabilities: list[str] = Field(default_factory=list, description="Procedural or factual weaknesses in the active matter")
    judicial_deduction_summary: str = Field(..., description="Comprehensive synthesis of the legal rationale")


class CasePredictionResponse(BaseModel):
    """Complete response payload for Judicial Outcome & Precedent Comparison."""
    model_config = ConfigDict(coerce_numbers_to_str=True)

    target_cnr: str = Field(..., description="CNR or unique case identifier")
    matter_type: str = Field(..., description="Resolved case taxonomy category")
    outcome_distribution: OutcomeDistribution
    comparisons: list[CaseComparisonItem] = Field(default_factory=list)
    explanation: PredictionExplanation
    reasoning_summary: str | None = Field(default=None, description="Model-generated judicial deduction thought summary")
    model_attribution: str = Field(
        default="Semantic Matching: InLegalBERT · Legal Deduction: Gemini 3.1 Pro",
        description="Model attribution badge"
    )
    case_state_hash: str = Field(..., description="Hash of latest order date, order count, and hearing counts")
    generated_at: str = Field(..., description="ISO timestamp of generation")
    is_cached: bool = Field(default=False, description="True if loaded from Redis / state-hash cache")
