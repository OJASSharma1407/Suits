"""Test Criminal Statutes Concordance Lookup & InLegalBERT Doctrine Search."""

import asyncio
import sys
from app.services.era_transition_service import EraTransitionService
from app.database.session import async_session_factory


async def main():
    async with async_session_factory() as session:
        service = EraTransitionService(session)

        print("\n--- Test 1: Section 438 CrPC lookup ---")
        results = service.lookup_concordance("438", limit=3)
        assert len(results) > 0, "Failed to find 438 CrPC"
        match = results[0]
        print(f"Query '438' matched: {match.old_code} {match.old_section} -> {match.new_code} {match.new_section} ({match.concept_doctrine})")
        assert match.old_section == "438" and match.new_section == "482" and match.new_code == "BNSS"

        print("\n--- Test 2: Section 420 IPC lookup ---")
        results = service.lookup_concordance("420", limit=3)
        assert len(results) > 0, "Failed to find 420 IPC"
        match = results[0]
        print(f"Query '420' matched: {match.old_code} {match.old_section} -> {match.new_code} {match.new_section} ({match.concept_doctrine})")
        assert match.old_section == "420" and "318" in match.new_section

        print("\n--- Test 3: Section 65B IEA lookup ---")
        results = service.lookup_concordance("65B", limit=3)
        assert len(results) > 0, "Failed to find 65B IEA"
        match = results[0]
        print(f"Query '65B' matched: {match.old_code} {match.old_section} -> {match.new_code} {match.new_section} ({match.concept_doctrine})")
        assert match.old_section == "65B" and match.new_section == "63"

        print("\n--- Test 4: InLegalBERT Semantic Doctrine Matching: 'custodial torture' ---")
        results = service.lookup_concordance("custodial torture and police brutality", limit=3)
        assert len(results) > 0, "Failed semantic match for custodial torture"
        match = results[0]
        print(f"Doctrine query matched: {match.old_code} {match.old_section} -> {match.new_code} {match.new_section} ({match.concept_doctrine}, score={match.similarity_score})")
        assert "176" in match.old_section or "D.K. Basu" in [p.title for p in match.landmark_precedents] or "196" in match.new_section

        print("\n--- Test 5: InLegalBERT Semantic Doctrine Matching: 'mandatory notice before arrest' ---")
        results = service.lookup_concordance("mandatory notice before arrest under 7 years", limit=3)
        match = results[0]
        print(f"Doctrine query matched: {match.old_code} {match.old_section} -> {match.new_code} {match.new_section} ({match.concept_doctrine})")
        assert "41A" in match.old_section or "35" in match.new_section

        print("\n--- Test 6: InLegalBERT Semantic Doctrine Matching: 'circumstantial evidence panchsheel' ---")
        results = service.lookup_concordance("circumstantial evidence panchsheel golden principles", limit=3)
        match = results[0]
        print(f"Doctrine query matched: {match.old_code} {match.old_section} -> {match.new_code} {match.new_section} ({match.concept_doctrine})")
        assert "circumstantial" in match.concept_doctrine.lower()

        print("\nAll Concordance & InLegalBERT Doctrine Search Tests PASSED successfully!")


if __name__ == "__main__":
    asyncio.run(main())
