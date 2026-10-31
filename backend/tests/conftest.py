"""Pytest configuration and test database initialization fixtures."""

import pytest
import pytest_asyncio
from app.database.session import init_db, engine
from app.database.base import Base
import app.models  # noqa: F401


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_test_db():
    """Ensure all database tables and schema migrations are created before tests execute."""
    await init_db()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
