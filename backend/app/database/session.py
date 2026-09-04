"""SUITS Backend - Database session management."""

from collections.abc import AsyncGenerator
from sqlalchemy import event

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.core.config import settings

_is_sqlite = settings.database_url.startswith("sqlite")

if _is_sqlite:
    # StaticPool: all async sessions share ONE underlying connection.
    # This avoids the "database is locked" error that NullPool causes when
    # two concurrent requests each open a fresh write transaction against
    # the same SQLite file.
    #
    # We also enable:
    #   - WAL journal mode  → allows one writer + many readers concurrently
    #   - busy_timeout 5 000 ms → retry for up to 5 s before raising an error
    #   - foreign_keys ON  → enforce referential integrity
    engine = create_async_engine(
        settings.database_url,
        echo=settings.environment == "development",
        connect_args={
            "check_same_thread": False,
            "timeout": 30,          # aiosqlite/sqlite3 busy wait (seconds)
        },
        poolclass=StaticPool,
    )

    @event.listens_for(engine.sync_engine, "connect")
    def _set_sqlite_pragmas(dbapi_conn, _connection_record):
        """Run once per physical connection to configure SQLite optimally."""
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA busy_timeout=30000")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

else:
    from sqlalchemy.pool import NullPool
    engine = create_async_engine(
        settings.database_url,
        echo=settings.environment == "development",
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
    )

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def init_db() -> None:
    """Initialize database tables and run lightweight SQLite column migrations."""
    from app.database.base import Base
    import app.models  # noqa: F401
    from sqlalchemy import text

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
        if _is_sqlite:
            try:
                res = await conn.execute(text("PRAGMA table_info(users)"))
                existing_cols = [row[1] for row in res.fetchall()]
                if existing_cols:
                    if "is_verified" not in existing_cols:
                        await conn.execute(text("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT 1 NOT NULL"))
                    if "auth_provider" not in existing_cols:
                        await conn.execute(text("ALTER TABLE users ADD COLUMN auth_provider VARCHAR(50) DEFAULT 'local' NOT NULL"))
                    if "google_id" not in existing_cols:
                        await conn.execute(text("ALTER TABLE users ADD COLUMN google_id VARCHAR(255)"))
                    if "avatar_url" not in existing_cols:
                        await conn.execute(text("ALTER TABLE users ADD COLUMN avatar_url VARCHAR(512)"))
            except Exception:
                pass

            try:
                res_doc = await conn.execute(text("PRAGMA table_info(user_documents)"))
                doc_cols = [row[1] for row in res_doc.fetchall()]
                if doc_cols:
                    if "ai_analysis" not in doc_cols:
                        await conn.execute(text("ALTER TABLE user_documents ADD COLUMN ai_analysis JSON"))
                    if "notes" not in doc_cols:
                        await conn.execute(text("ALTER TABLE user_documents ADD COLUMN notes TEXT DEFAULT ''"))
                    if "highlights" not in doc_cols:
                        await conn.execute(text("ALTER TABLE user_documents ADD COLUMN highlights JSON DEFAULT '[]'"))
                    if "tags_list" not in doc_cols:
                        await conn.execute(text("ALTER TABLE user_documents ADD COLUMN tags_list JSON DEFAULT '[]'"))
                    if "page_count" not in doc_cols:
                        await conn.execute(text("ALTER TABLE user_documents ADD COLUMN page_count INTEGER DEFAULT 0 NOT NULL"))
            except Exception:
                pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that provides an async database session."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            # Always rollback — including when the transaction is already in a
            # PendingRollbackError state due to a previous flush failure (e.g.
            # FK constraint on messages.conversation_id).
            try:
                await session.rollback()
            except Exception:
                pass
            raise
        finally:
            await session.close()

