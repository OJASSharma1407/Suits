import asyncio
from app.clients.ecourts_client import ecourts_client

async def test_api():
    try:
        # Search for Harish Salve
        res = await ecourts_client.search_cases({"query": "Harish Salve", "pageSize": 1})
        cases = res.get("data", res.get("results", res.get("cases", [])))
        if not cases:
            print("No cases found in search.")
            return

        first_case = cases[0]
        cnr = first_case.get("cnr", first_case.get("caseNumberRecord", first_case.get("id")))
        print(f"Found CNR: {cnr}")

        # Get details
        details = await ecourts_client.get_case_details(cnr)
        
        # Dump to file
        import json
        with open("ecourts_test_dump.json", "w") as f:
            json.dump(details, f, indent=2)
        print("Dumped case details to ecourts_test_dump.json")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_api())
