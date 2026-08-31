import asyncio
import json
from app.database.session import AsyncSessionLocal
from app.services.citation_service import CitationService

async def test_citation_service():
    print("Testing CitationService...")
    async with AsyncSessionLocal() as db:
        service = CitationService(db)
        # Test with a real or sample TID / CNR
        res = await service.get_citation_graph("193792759")
        print("Success! Graph response generated:")
        print(f"Target CNR: {res.target_cnr}")
        print(f"Case Title: {res.case_title}")
        print(f"Total Nodes: {res.summary.total_nodes}")
        print(f"Total Precedents: {res.summary.total_precedents}")
        print(f"Total Subsequent: {res.summary.total_subsequent}")
        print(f"Total Statutes: {res.summary.total_statutes}")
        print(f"Total Edges: {res.summary.total_edges}")
        print("First 3 Nodes:")
        for n in res.nodes[:3]:
            print(f"  - [{n.node_type.upper()}] {n.title} (Authority: {n.authority_score}, Court: {n.court})")

if __name__ == "__main__":
    asyncio.run(test_citation_service())
