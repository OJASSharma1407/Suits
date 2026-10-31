import asyncio
import os
import sys

from app.core.config import settings
from app.clients.kanoon_client import kanoon_client

async def test_search():
    print(f"Token loaded in settings: {settings.kanoon_api_token}")
    print(f"Token in client: {kanoon_client.api_token}")
    try:
        res = await kanoon_client.search_docs("Vivek Narayan Sharma", pagenum=1)
        print("Search Success:", res.get("found", "No 'found' key"), "results")
        if "docs" in res and res["docs"]:
            print("First doc:", res["docs"][0]["title"])
    except Exception as e:
        print("Search Error:", type(e), str(e))

if __name__ == "__main__":
    asyncio.run(test_search())
