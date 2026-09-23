import asyncio
import sys
from pathlib import Path
import httpx

sys.path.insert(0, str(Path(__file__).parent.parent))
from app.main import app

async def main():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        test_queries = [
            "ipc section 57",
            "section 57",
            "438",
            "302",
            "bns 6",
            "crpc 57",
            "anticipatory bail",
            "dying declaration",
            "randomxyz999",
            ""
        ]
        for q in test_queries:
            r = await client.get("/api/statutes/era-transition/lookup", params={"query": q})
            print(f"=== Query: '{q}' -> Status: {r.status_code}")
            data = r.json().get("data", {})
            pairs = data.get("pairs", [])
            print(f"    Matches: {len(pairs)}")
            for p in pairs[:2]:
                print(f"    [{p['old_code']} {p['old_section']} -> {p['new_code']} {p['new_section']}]: {p['concept_doctrine']}")

asyncio.run(main())
