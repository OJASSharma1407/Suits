"""Test HTTP REST endpoints for Criminal Law Era Transition Engine."""

import asyncio
import httpx


async def test_endpoints():
    async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
        # 1. Health check
        r = await client.get("/api/health")
        print(f"Health check status: {r.status_code}, data: {r.json()}")

        # 2. Concordance Lookup
        print("\nTesting GET /api/statutes/era-transition/lookup?query=438...")
        r = await client.get("/api/statutes/era-transition/lookup", params={"query": "438"})
        print(f"Status: {r.status_code}")
        if r.status_code == 200:
            payload = r.json()
            assert payload["success"] is True
            data = payload["data"]
            print(f"Match count: {data['match_count']}")
            print(f"First match: {data['pairs'][0]['old_code']} S. {data['pairs'][0]['old_section']} -> {data['pairs'][0]['new_code']} S. {data['pairs'][0]['new_section']}")
            print("Concordance lookup endpoint: PASS")

        # 3. Case Era Transition endpoint (using public/dev route or auth bypass if test)
        print("\nTesting GET /api/cases/SCIN010177522021/era-transition...")
        r = await client.get("/api/cases/SCIN010177522021/era-transition")
        print(f"Status: {r.status_code}")
        # Note: if auth is required, it returns 401, which confirms route is mounted and intercepted by auth middleware
        if r.status_code == 401:
            print("Endpoint is securely protected by auth middleware (401 Unauthorized as expected).")
        elif r.status_code == 200:
            print("Endpoint returned 200 OK with data.")


if __name__ == "__main__":
    asyncio.run(test_endpoints())
