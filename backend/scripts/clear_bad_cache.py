"""Purge stale 'unavailable' AI analysis cache entries so they get retried.

Run from the backend directory:
    python clear_bad_cache.py
"""

import asyncio


async def clear():
    from app.database.session import engine
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
    from sqlalchemy import delete, text

    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as session:
        # Delete AI analysis entries where extraction failed (confidence 0 and generic message)
        result = await session.execute(
            text("""
                DELETE FROM cached_ai_analysis
                WHERE ai_json LIKE '%"extractionConfidence": 0.0%'
                AND (
                    ai_json LIKE '%could not be analyzed%'
                    OR ai_json LIKE '%unavailable%'
                )
            """)
        )
        deleted_ai = result.rowcount

        # Delete cached order markdown entries that are just error messages
        result2 = await session.execute(
            text("""
                DELETE FROM cached_orders
                WHERE markdown LIKE '*This court order%'
                OR markdown LIKE '%could not be retrieved%'
            """)
        )
        deleted_md = result2.rowcount

        await session.commit()

    await engine.dispose()
    print(f"✅ Cleared {deleted_ai} stale AI analysis entries and {deleted_md} stale markdown entries.")
    print("   These will be re-fetched on next request.")


if __name__ == "__main__":
    asyncio.run(clear())
