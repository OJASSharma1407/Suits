"""One-shot DB reset script — drops all SQLite tables and recreates them with corrected UUID types.

Run from the backend directory:
    python reset_db.py

Safe to delete this file afterwards.
"""

import asyncio
from pathlib import Path


async def reset():
    from app.database.session import engine
    from app.database.base import Base
    import app.models  # noqa: F401 — registers all models

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    await engine.dispose()
    print("✅ Database reset complete. All tables recreated with correct schema.")


if __name__ == "__main__":
    asyncio.run(reset())
