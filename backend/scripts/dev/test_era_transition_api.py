"""End-to-End Verification Test for Criminal Law Era Transition Engine."""

import asyncio
import time
from app.database.session import async_session_factory
from app.services.era_transition_service import EraTransitionService


async def test_era_transition():
    print("\n========================================================")
    print("  SUITS: CRIMINAL LAW ERA TRANSITION ENGINE TEST")
    print("========================================================\n")

    async with async_session_factory() as session:
        service = EraTransitionService(session)

        # 1. Test Concordance Lookup
        print("[1/3] Testing Concordance Lookup for 'Section 438 CrPC'...")
        lookup_res = service.lookup_concordance("438")
        assert len(lookup_res) > 0, "No concordance pairs returned for 438"
        pair = lookup_res[0]
        print(f"  -> Found match: {pair.old_code} S. {pair.old_section} -> {pair.new_code} S. {pair.new_section}")
        print(f"  -> Doctrine: {pair.concept_doctrine}")
        assert pair.old_section == "438" and pair.new_section == "482"
        print("  -> Concordance Lookup: PASS\n")

        # 2. Test Case Era Analysis on Supreme Court Case
        target_cnr = "SCIN010177522021"
        print(f"[2/3] Analyzing Case Era Transition for CNR: {target_cnr}...")
        t0 = time.time()
        analysis = await service.analyze_case_transition(target_cnr, force_refresh=True)
        duration = time.time() - t0

        assert analysis is not None, "Era transition analysis returned None"
        print(f"  -> Analysis generated in {duration:.2f}s")
        print(f"  -> Active Era: {analysis.active_era}")
        print(f"  -> Era Explanation: {analysis.era_explanation[:100]}...")
        print(f"  -> Concordance Mappings Count: {len(analysis.concordance_mappings)}")
        print(f"  -> Transposed Precedents Count: {len(analysis.transposed_precedents)}")
        print(f"  -> Procedural Risks Count: {len(analysis.procedural_risks)}")

        assert len(analysis.concordance_mappings) > 0, "Concordance mappings empty"
        assert len(analysis.transposed_precedents) > 0, "Transposed precedents empty"

        sample_transposition = analysis.transposed_precedents[0]
        print("\n  Sample Transposed Submission:")
        print(f"    Precedent: {sample_transposition.precedent_title} [{sample_transposition.citation}]")
        print(f"    Transition: {sample_transposition.historic_section_cited} -> {sample_transposition.transposed_section}")
        print(f"    Statutory Continuity: {sample_transposition.statutory_continuity_basis}")
        print(f"    Oral Proposition: {sample_transposition.persuasion_ratio}")
        print(f"    Pleading Submission Preview:\n      {sample_transposition.court_pleading_paragraph[:240]}...\n")

        # 3. Test Cache Hit Speed
        print(f"[3/3] Testing Cached Retrieval for CNR: {target_cnr}...")
        t1 = time.time()
        cached_analysis = await service.analyze_case_transition(target_cnr, force_refresh=False)
        cached_duration = time.time() - t1
        print(f"  -> Cached read took {cached_duration*1000:.1f}ms")
        assert cached_analysis is not None
        assert cached_analysis.target_cnr == target_cnr
        print("  -> Cache Verification: PASS\n")

    print("========================================================")
    print("  ALL CRIMINAL ERA TRANSITION ENGINE TESTS PASSED! ")
    print("========================================================\n")


if __name__ == "__main__":
    asyncio.run(test_era_transition())
