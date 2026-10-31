import asyncio
from app.database.session import async_session_factory
from sqlalchemy import text

async def main():
    async with async_session_factory() as db:
        res = await db.execute(text("DELETE FROM cached_cases"))
        await db.commit()
        print(f"Purged {res.rowcount} old cached cases from database.")

if __name__ == "__main__":
    asyncio.run(main())
