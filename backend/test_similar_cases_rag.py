"""Test script for Hybrid RAG Similar Cases Retrieval."""

import asyncio
import json
from app.database.session import async_session_factory
from app.services.similar_cases_service import SimilarCasesService


async def test_similar_cases():
    print("\n==========================================")
    print("Testing Hybrid RAG SimilarCasesService...")
    print("==========================================")
    
    # Test with a real or sample Kanoon TID / CNR
    test_tid = "193792759"
    async with async_session_factory() as db:
        service = SimilarCasesService(db)
        resp = await service.get_similar_cases(test_tid)

        print("\n[SUCCESS] SimilarCasesResponse received:")
        print(f"Target CNR: {resp.target_cnr}")
        print(f"Target Title: {resp.target_title}")
        print(f"Total Found: {resp.summary.total_found}")
        print(f"Binding Precedents: {resp.summary.binding_count}")
        print(f"Avg Similarity Score: {resp.summary.avg_similarity_score}%")
        print(f"Execution Time: {resp.summary.execution_time_ms}ms")
        print("\nTop Similar Cases:")
        for idx, c in enumerate(resp.cases):
            print(f"\n#{idx+1} [{c.court_tier.upper()}] {c.case_title}")
            print(f"   Score: {c.similarity_score}% | Semantic: {c.semantic_score} | Type: {c.precedent_type} | Stance: {c.strategic_alignment}")
            print(f"   Court: {c.court_name} | Date: {c.decision_date} | TID: {c.tid}")
            print(f"   Nexus: {c.legal_nexus}")
            if c.key_ratio:
                print(f"   Ratio: {c.key_ratio}")
            if c.shared_statutes:
                print(f"   Shared Statutes: {', '.join(c.shared_statutes)}")

        assert len(resp.cases) > 0, "No similar cases returned"
        assert resp.cases[0].similarity_score > 0, "Invalid similarity score"
        print("\nAll assertions passed!")


if __name__ == "__main__":
    asyncio.run(test_similar_cases())
