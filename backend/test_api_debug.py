import httpx
import asyncio

async def test():
    async with httpx.AsyncClient(base_url="http://127.0.0.1:8000/api", timeout=30.0) as client:
        email = "testrunner@suits.law"
        pwd = "TestPassword123!"
        login_res = await client.post("/auth/login", json={"email": email, "password": pwd})
        token = login_res.json()["data"]["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        for cnr in ["1201493", "96541170", "SCIN010177522021", "UPLP010003342024"]:
            print(f"\n--- Testing case {cnr} ---")
            c_res = await client.get(f"/cases/{cnr}", headers=headers)
            if c_res.status_code == 200:
                c_data = c_res.json().get("data", {})
                print(f"Case {cnr}: title='{c_data.get('case_title')}', status={c_data.get('case_status')}, timeline_count={len(c_data.get('timeline', []))}")
                for t in c_data.get("timeline", []):
                    print(f"   -> date={t.get('date')}, type={t.get('event_type')}, title={t.get('title')}")
            else:
                print(f"Case {cnr}: error status={c_res.status_code} text={c_res.text[:150]}")

if __name__ == "__main__":
    asyncio.run(test())
