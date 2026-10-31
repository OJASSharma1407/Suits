import asyncio
import uuid
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.security import create_access_token

async def main():
    test_cnr = "SCIN010177522021"
    print(f"Testing API endpoint GET /api/cases/{test_cnr}/headnote...")

    user_uuid = str(uuid.UUID("dc0ead20a27d451ba20dc4c8011dd567"))
    token = create_access_token({"sub": user_uuid})
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        headers = {"Authorization": f"Bearer {token}"}
        res = await ac.get(f"/api/cases/{test_cnr}/headnote", headers=headers)
        print("Status code:", res.status_code)
        if res.status_code == 200:
            payload = res.json()
            data = payload.get("data", {})
            print("=== API SUCCESS 200 OK ===")
            print("CNR:", data.get("target_cnr"))
            print("Order Title:", data.get("order_title"))
            headnote = data.get("headnote", {})
            print("Catchwords:", headnote.get("catchwords"))
            print("Held points count:", len(headnote.get("held_points", [])))
            for idx, h in enumerate(headnote.get("held_points", []), 1):
                print(f"  {idx}. {h[:120]}...")
            print("Citator count:", len(headnote.get("precedent_citator_table", [])))
            print("Operative Disposition:", headnote.get("operative_disposition"))
        else:
            print("Response text:", res.text)

if __name__ == "__main__":
    asyncio.run(main())
