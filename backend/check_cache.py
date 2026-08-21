import asyncio
import json
from app.database.session import async_session_factory
from sqlalchemy import text

async def main():
    async with async_session_factory() as db:
        res = await db.execute(text("SELECT cnr, case_title, response_json FROM cached_cases"))
        rows = res.fetchall()
        print(f"Total cached cases: {len(rows)}")
        for r in rows:
            data = json.loads(r[2])
            print(f"CNR: {r[0]} | Title: {r[1]}")
            print(f"  hearings in raw: {len(data.get('hearingHistory', []))}")
            print(f"  interimOrders in raw: {len(data.get('interimOrders', []))}")
            print(f"  judgments in raw: {len(data.get('judgments', []))}")

if __name__ == "__main__":
    asyncio.run(main())
