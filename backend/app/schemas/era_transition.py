"""Schemas for Criminal Law Era Transition Engine (IPC/CrPC/IEA ↔ BNS/BNSS/BSA)."""

from __future__ import annotations

from typing import Any, Literal
from pydantic import BaseModel, Field


class PrecedentSummary(BaseModel):
    """Landmark precedent citation and ratio."""
    title: str = Field(description="Case title, e.g., 'Arnesh Kumar v. State of Bihar'")
    citation: str = Field(description="Law report citation, e.g., '(2014) 8 SCC 273'")
    court: str = Field(description="Court name, e.g., 'Supreme Court of India'")
    ratio: str = Field(description="Core legal ratio decidendi")


class StatutoryDelta(BaseModel):
    """Statutory variation, newly added proviso, or procedural departure."""
    provision_name: str = Field(description="Name of the specific amended section or proviso")
    delta_type: Literal[
        "SUBSTANTIAL_CHANGE",
        "NEW_PROVISO_ADDED",
        "PROCEDURE_MODIFIED",
        "PENALTY_ENHANCED",
        "DIRECT_SUBSTITUTION",
    ] = Field(description="Nature of legal variation")
    details: str = Field(description="Explanatory text outlining statutory modification")
    litigator_warning: str = Field(description="Actionable strategic alert or objection for advocate")


class StatuteConcordancePair(BaseModel):
    """Bi-directional mapping between old colonial code and new criminal enactment."""
    id: str = Field(description="Unique concordance identifier")
    old_code: Literal["CrPC", "IPC", "IEA"] = Field(description="Legacy statute name")
    old_section: str = Field(description="Legacy section number, e.g., '438', '41A'")
    old_title: str = Field(description="Legacy section title")
    new_code: Literal["BNSS", "BNS", "BSA"] = Field(description="Enacted 2023 statute name")
    new_section: str = Field(description="New section number, e.g., '482', '35(3)'")
    new_title: str = Field(description="New section title")
    category: Literal["PROCEDURAL", "SUBSTANTIVE", "EVIDENTIARY"] = Field(description="Subject matter category")
    concept_doctrine: str = Field(description="Governing legal doctrine or constitutional protection")
    doctrine_summary: str = Field(description="Summary of the doctrine")
    landmark_precedents: list[PrecedentSummary] = Field(default_factory=list, description="Associated landmark precedents")
    statutory_deltas: list[StatutoryDelta] = Field(default_factory=list, description="Differences between old and new provisions")
    similarity_score: float | None = Field(default=None, description="InLegalBERT semantic match score if queried conceptually")


class PrecedentTranspositionItem(BaseModel):
    """Court-ready transposed argument linking old Supreme Court precedent to new statutory section."""
    precedent_title: str = Field(description="Landmark precedent name, e.g., 'Gurbaksh Singh Sibbia v. State of Punjab'")
    citation: str = Field(description="Official law report citation")
    historic_section_cited: str = Field(description="Old code section, e.g., 'Section 438 CrPC'")
    transposed_section: str = Field(description="New code section, e.g., 'Section 482 BNSS'")
    governing_doctrine: str = Field(description="Doctrinal principle, e.g., 'Pre-arrest Personal Liberty'")
    court_pleading_paragraph: str = Field(
        description="Formal court-ready submission arguing why historic ratio binds the bench under the new enactment"
    )
    statutory_continuity_basis: str = Field(
        description="Statutory continuity anchor, e.g., 'Section 8 General Clauses Act, 1897 & Pari Materia Doctrine'"
    )
    persuasion_ratio: str = Field(description="Crisp ratio distillation for oral argument before the judge")


class EraTransitionCaseAnalysis(BaseModel):
    """Complete era transition report for an active court case."""
    target_cnr: str = Field(description="Case CNR number")
    active_era: Literal["NEW_BNS_ERA", "LEGACY_IPC_ERA", "HYBRID_TRANSITION_ERA"] = Field(
        description="Applicable statutory era based on FIR/offence registration date"
    )
    era_explanation: str = Field(description="Detailed legal explanation of era categorization and date thresholds")
    concordance_mappings: list[StatuteConcordancePair] = Field(
        default_factory=list, description="Applicable old ↔ new statute concordance pairs"
    )
    statutory_deltas: list[StatutoryDelta] = Field(
        default_factory=list, description="Statutory variations and new procedural requirements"
    )
    transposed_precedents: list[PrecedentTranspositionItem] = Field(
        default_factory=list, description="Transposed arguments ready for court drafting"
    )
    procedural_risks: list[str] = Field(
        default_factory=list, description="Procedural risk warnings and objections for litigators"
    )
    model_attribution: str = Field(
        default="InLegalBERT Mode 1 + Gemini 3.6 Flash", description="AI pipeline attribution"
    )
    generated_at: str = Field(description="ISO timestamp when analysis was synthesized")


class ConcordanceLookupResponse(BaseModel):
    """Response schema for section or doctrine concordance search."""
    query: str = Field(description="Searched section number, statute name, or legal doctrine")
    match_count: int = Field(description="Number of matching concordance pairs")
    pairs: list[StatuteConcordancePair] = Field(default_factory=list, description="Matching concordance pairs")


class EraTransitionInstant(BaseModel):
    """Zero-LLM instant concordance snapshot – served from static Python dictionary (0 tokens, <10ms)."""
    target_cnr: str = Field(description="Case CNR number")
    active_era: Literal["NEW_BNS_ERA", "LEGACY_IPC_ERA", "HYBRID_TRANSITION_ERA"] = Field(
        description="Applicable statutory era resolved from case filing date and cited statutes"
    )
    era_explanation: str = Field(description="Plain-language explanation of era categorization")
    concordance_mappings: list[StatuteConcordancePair] = Field(
        default_factory=list, description="Applicable old ↔ new statute concordance pairs for this case"
    )
    statutory_deltas: list[StatutoryDelta] = Field(
        default_factory=list, description="Statutory variations between old and new provisions"
    )
    procedural_risks: list[str] = Field(
        default_factory=list, description="Procedural litigator risk alerts derived from concordance data"
    )
    source: str = Field(default="STATIC_CONCORDANCE_DICT", description="Data origin – confirms no LLM was called")
