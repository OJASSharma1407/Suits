"""Verification script for Kanoon-only Search, Case Details, Order Markdown, AI Summary, and Chatbot pipeline."""

import asyncio
import os
import sys

from app.database.session import async_session_factory
from app.services.search_service import SearchService
from app.services.case_service import CaseService
from app.services.order_service import OrderService
from app.services.ai_service import AIService
from app.schemas.search import SearchRequest


async def run_tests():
    print("=== [TEST 1] Testing Indian Kanoon Search ===")
    async with async_session_factory() as db:
        search_svc = SearchService(db)
        search_resp = await search_svc.search(SearchRequest(query="Vivek Narayan Sharma", page=1, page_size=5))
        print(f"Search Results Count: {len(search_resp.results)}")
        assert len(search_resp.results) > 0, "No search results returned from Kanoon"
        first_result = search_resp.results[0]
        print(f"First Result CNR/TID: {first_result.cnr}")
        print(f"First Result Title: {first_result.case_title}")
        print(f"First Result Court: {first_result.court_name}")
        assert first_result.cnr, "First result missing CNR/TID"

        target_tid = first_result.cnr
        print(f"\n=== [TEST 2] Testing Case Details for TID: {target_tid} ===")
        case_svc = CaseService(db)
        case_details = await case_svc.get_case_details(target_tid)
        print(f"Case Title: {case_details.case_title}")
        print(f"Court Name: {case_details.court.court_name}")
        print(f"Orders Count: {len(case_details.orders or [])}")
        assert case_details.orders and len(case_details.orders) > 0, "No orders created for Kanoon case"
        order_filename = case_details.orders[0].filename
        print(f"First Order Filename/TID: {order_filename}")

        print(f"\n=== [TEST 3] Testing Order Markdown Retrieval for TID: {target_tid} ===")
        order_svc = OrderService(db)
        md_resp = await order_svc.get_markdown(target_tid, order_filename)
        print(f"Markdown Length: {len(md_resp.markdown)} chars")
        print(f"Markdown Preview:\n{md_resp.markdown[:250]}...\n")
        assert len(md_resp.markdown) > 100, "Markdown content too short"
        assert not md_resp.markdown.startswith("*"), "Markdown returned error message"

        print(f"\n=== [TEST 4] Testing Live AI Summary Generation for TID: {target_tid} ===")
        ai_resp = await order_svc.get_ai_analysis(target_tid, order_filename)
        print(f"AI Outcome: {str(ai_resp.outcome).encode('ascii', errors='replace').decode('ascii')}")
        print(f"AI Court: {ai_resp.court_name}")
        print(f"AI Judges: {ai_resp.judge_names}")
        print(f"AI Extraction Confidence: {ai_resp.extraction_confidence}")
        print(f"AI Executive Summary:\n{str(ai_resp.executive_summary[:300]).encode('ascii', errors='replace').decode('ascii')}...\n")
        assert ai_resp.extraction_confidence and ai_resp.extraction_confidence > 0, "AI Summary extraction confidence is 0"
        assert ai_resp.executive_summary and "could not be analyzed" not in ai_resp.executive_summary, "AI Summary failed"

        print(f"\n=== [TEST 5] Testing Alphanumeric Search Query Resolution ===")
        # Test resolving a query or CNR string through get_ai_analysis
        ai_resp_cnr = await order_svc.get_ai_analysis("Vivek Narayan Sharma", "order-1.pdf")
        outcome_safe = str(ai_resp_cnr.outcome).encode('ascii', errors='replace').decode('ascii')
        print(f"Resolved AI Summary Outcome: {outcome_safe}")
        assert ai_resp_cnr.extraction_confidence and ai_resp_cnr.extraction_confidence > 0, "Alphanumeric AI summary failed"

    print("\n==========================================")
    print("ALL TESTS PASSED SUCCESSFULLY!")
    print("==========================================")


if __name__ == "__main__":
    asyncio.run(run_tests())
