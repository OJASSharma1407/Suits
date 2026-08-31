"""Cache repository - database operations for cached eCourts data and local case search."""

import json
from datetime import datetime, timezone

from sqlalchemy import select, delete, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cached_case import CachedCase
from app.models.cached_order import CachedOrder
from app.models.cached_ai_analysis import CachedAIAnalysis


def _ensure_utc(dt: datetime) -> datetime:
    """Ensure a datetime object is timezone-aware in UTC for safe comparison."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


class CacheRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # --- Cached Cases & Local Search ---

    async def get_cached_case(self, cnr: str, check_expiry: bool = False) -> CachedCase | None:
        result = await self.db.execute(select(CachedCase).where(CachedCase.cnr == cnr))
        case = result.scalar_one_or_none()
        if case and check_expiry and case.expires_at:
            now = datetime.now(timezone.utc)
            expires_at = _ensure_utc(case.expires_at)
            if expires_at < now:
                return None  # Expired
        return case

    async def search_local_cases(
        self,
        query: str | None = None,
        court_code: str | None = None,
        case_status: str | None = None,
        case_type: str | None = None,
        filing_year: int | None = None,
    ) -> list[CachedCase]:
        """Search cases already saved in the local database."""
        stmt = select(CachedCase)
        conditions = []

        if query and query.strip():
            q = f"%{query.strip()}%"
            conditions.append(or_(
                CachedCase.cnr.ilike(q),
                CachedCase.case_title.ilike(q),
                CachedCase.response_json.ilike(q),
            ))

        if court_code and court_code.strip():
            conditions.append(CachedCase.court_code.ilike(f"%{court_code.strip()}%"))

        if case_status and case_status.strip():
            conditions.append(CachedCase.case_status.ilike(f"%{case_status.strip()}%"))

        if case_type and case_type.strip():
            conditions.append(CachedCase.case_type.ilike(f"%{case_type.strip()}%"))

        if filing_year:
            conditions.append(CachedCase.filing_year == str(filing_year))

        if conditions:
            stmt = stmt.where(*conditions)

        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def save_cached_case(self, cached_case: CachedCase) -> CachedCase:
        existing = await self.db.execute(
            select(CachedCase).where(CachedCase.cnr == cached_case.cnr)
        )
        old = existing.scalar_one_or_none()
        if old:
            old.response_json = cached_case.response_json
            old.case_title = cached_case.case_title
            old.case_status = cached_case.case_status
            old.case_type = cached_case.case_type
            old.court_code = cached_case.court_code
            old.filing_year = cached_case.filing_year
            old.fetched_at = cached_case.fetched_at
            old.expires_at = cached_case.expires_at
            await self.db.flush()
            return old
        self.db.add(cached_case)
        await self.db.flush()
        return cached_case

    async def invalidate_case(self, cnr: str) -> None:
        await self.db.execute(delete(CachedCase).where(CachedCase.cnr == cnr))

    # --- Cached Orders (Markdown) ---

    async def get_cached_order(self, cnr: str, filename: str) -> CachedOrder | None:
        result = await self.db.execute(
            select(CachedOrder).where(
                CachedOrder.cnr == cnr, CachedOrder.filename == filename
            )
        )
        return result.scalar_one_or_none()

    async def save_cached_order(self, cached_order: CachedOrder) -> CachedOrder:
        existing = await self.get_cached_order(cached_order.cnr, cached_order.filename)
        if existing:
            existing.markdown = cached_order.markdown
            existing.fetched_at = cached_order.fetched_at
            await self.db.flush()
            return existing
        self.db.add(cached_order)
        await self.db.flush()
        return cached_order

    # --- Cached AI Analysis ---

    async def get_cached_ai(self, cnr: str, filename: str) -> CachedAIAnalysis | None:
        result = await self.db.execute(
            select(CachedAIAnalysis).where(
                CachedAIAnalysis.cnr == cnr, CachedAIAnalysis.filename == filename
            )
        )
        return result.scalar_one_or_none()

    async def save_cached_ai(self, cached_ai: CachedAIAnalysis) -> CachedAIAnalysis:
        existing = await self.get_cached_ai(cached_ai.cnr, cached_ai.filename)
        if existing:
            existing.ai_json = cached_ai.ai_json
            existing.fetched_at = cached_ai.fetched_at
            await self.db.flush()
            return existing
        self.db.add(cached_ai)
        await self.db.flush()
        return cached_ai
