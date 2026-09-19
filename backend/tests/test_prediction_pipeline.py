"""Test Suite for Judicial Outcome & Precedent Comparison Engine."""

from app.core.config import settings
from app.schemas.prediction import (
    OUTCOME_TAXONOMY,
    CaseComparisonItem,
    CasePredictionResponse,
    OutcomeDistribution,
    OutcomeWeight,
    PredictionExplanation,
    ThresholdCheck,
)
from app.services.prediction_service import PredictionService


def test_key_isolation():
    """Verify that prediction client settings do not overwrite or touch existing keys."""
    assert hasattr(settings, "prediction_gemini_api_key")
    assert hasattr(settings, "gemini_api_key")
    assert hasattr(settings, "openrouter_api_key")
    # Assert independent fields
    assert settings.prediction_gemini_model != settings.gemini_model


def test_matter_type_and_era_resolution():
    """Verify era-aware statute mapping and matter type identification."""
    # Test pre-2024 bail
    m_type, era = PredictionService.resolve_matter_type_and_era(
        category="Criminal",
        acts=["Section 439 CrPC"],
        filing_date="2023-05-12",
        title="Bail Application No. 123",
    )
    assert m_type == "BAIL"
    assert era == "pre_2024"

    # Test post-July 2024 bail under BNSS
    m_type, era = PredictionService.resolve_matter_type_and_era(
        category="Criminal",
        acts=["Section 483 BNSS"],
        filing_date="2024-08-15",
        title="Bail Application No. 456",
    )
    assert m_type == "BAIL"
    assert era == "post_2024"

    # Test writ petition
    m_type, _ = PredictionService.resolve_matter_type_and_era(
        category="Civil",
        acts=["Article 226 of Constitution"],
        filing_date="2024-02-01",
        title="W.P.(C) 789/2024",
    )
    assert m_type == "WRIT"

    # Test NI Act 138
    m_type, _ = PredictionService.resolve_matter_type_and_era(
        category="Criminal",
        acts=["Section 138 Negotiable Instruments Act"],
        filing_date="2024-03-01",
        title="Cheque Bounce Complaint",
    )
    assert m_type == "NI_138"


def test_case_state_hash_invalidation():
    """Verify that updating orders or hearing dates changes the state hash."""
    case_v1 = {
        "decision_date": "2024-01-01",
        "next_hearing_date": "2024-02-01",
        "orders": [{"id": 1}],
        "timeline": [{"id": 1}, {"id": 2}],
    }
    hash_v1 = PredictionService.compute_case_state_hash(case_v1)

    case_v2 = {
        "decision_date": "2024-01-01",
        "next_hearing_date": "2024-03-01",  # date changed
        "orders": [{"id": 1}],
        "timeline": [{"id": 1}, {"id": 2}],
    }
    hash_v2 = PredictionService.compute_case_state_hash(case_v2)

    case_v3 = {
        "decision_date": "2024-01-01",
        "next_hearing_date": "2024-02-01",
        "orders": [{"id": 1}, {"id": 2}],  # new order landed
        "timeline": [{"id": 1}, {"id": 2}],
    }
    hash_v3 = PredictionService.compute_case_state_hash(case_v3)

    assert hash_v1 != hash_v2
    assert hash_v1 != hash_v3
    assert len(hash_v1) == 16


def test_outcome_distribution_schema():
    """Verify that outcome weights adhere to valid matter type taxonomy."""
    weights = [
        OutcomeWeight(label="Granted with conditions", weight=0.65, rationale="Parity with co-accused"),
        OutcomeWeight(label="Rejected", weight=0.25, rationale="Gravity of alleged offense"),
        OutcomeWeight(label="Withdrawn", weight=0.10, rationale="Counsel option to approach trial court"),
    ]
    dist = OutcomeDistribution(
        matter_type="BAIL",
        outcomes=weights,
    )
    assert sum(w.weight for w in dist.outcomes) == 1.0
    for w in dist.outcomes:
        assert w.label in OUTCOME_TAXONOMY["BAIL"]
