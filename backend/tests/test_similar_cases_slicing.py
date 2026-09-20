"""Unit tests for Similar Cases top 5 candidate slicing."""

import pytest
from app.database.session import async_session_factory
from app.services.similar_cases_service import SimilarCasesService


@pytest.mark.asyncio
async def test_synthesize_legal_nexus_caps_at_top_5():
    """Verify that _synthesize_legal_nexus strictly caps candidates to top 5."""
    async with async_session_factory() as db:
        service = SimilarCasesService(db)

        # Mock 10 candidates
        candidates = [
            {
                "tid": f"tid_{i}",
                "title": f"Precedent Case {i}",
                "court_name": "Supreme Court of India",
                "court_tier": "sc",
                "year": "2022",
                "hybrid_score": 90 - i,
                "semantic_score": 0.85,
                "precedent_type": "Binding Precedent",
            }
            for i in range(10)
        ]

        # Call with fallback Gemini (or mock)
        results = await service._synthesize_legal_nexus(
            case_title="Test Active Case",
            court_name="Delhi High Court",
            category="Arbitration",
            acts=["Arbitration and Conciliation Act, 1996"],
            candidates=candidates,
        )

        assert len(results) <= 5, f"Expected at most 5 synthesized cases, got {len(results)}"
        print(f"test_synthesize_legal_nexus_caps_at_top_5 PASSED: returned {len(results)} cases.")


if __name__ == "__main__":
    import asyncio
    asyncio.run(test_synthesize_legal_nexus_caps_at_top_5())
