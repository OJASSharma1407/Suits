"""History service - recent cases, searches, and conversations."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.search_history import SearchHistory
from app.models.case_view_history import CaseViewHistory
from app.models.conversation import Conversation

MAX_HISTORY = 100


class HistoryService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ── Case View History ──────────────────────────────────────────
    async def add_case_view(self, user_id: uuid.UUID, cnr: str, title: str = "Untitled Case") -> None:
        """Record or update a viewed case, keeping newest on top and capping at MAX_HISTORY."""
        clean_cnr = str(cnr).strip()
        clean_title = str(title).strip() if title and str(title).strip() else "Untitled Case"
        now = datetime.now(timezone.utc)

        # Check if this case was already viewed by this user
        result = await self.db.execute(
            select(CaseViewHistory).where(
                CaseViewHistory.user_id == user_id,
                CaseViewHistory.cnr == clean_cnr,
            )
        )
        existing = result.scalar_one_or_none()

        if existing:
            # Update timestamp and title to bump to the top
            existing.viewed_at = now
            if clean_title and clean_title != "Untitled Case":
                existing.title = clean_title
            await self.db.flush()
        else:
            # Insert new entry
            entry = CaseViewHistory(
                user_id=user_id,
                cnr=clean_cnr,
                title=clean_title,
                viewed_at=now,
            )
            self.db.add(entry)
            await self.db.flush()

            # Trim older entries if exceeding MAX_HISTORY
            count_res = await self.db.execute(
                select(func.count(CaseViewHistory.id)).where(CaseViewHistory.user_id == user_id)
            )
            count = count_res.scalar() or 0
            if count > MAX_HISTORY:
                oldest_res = await self.db.execute(
                    select(CaseViewHistory.id)
                    .where(CaseViewHistory.user_id == user_id)
                    .order_by(CaseViewHistory.viewed_at.asc())
                    .limit(count - MAX_HISTORY)
                )
                ids_to_delete = [row[0] for row in oldest_res.all()]
                if ids_to_delete:
                    await self.db.execute(
                        delete(CaseViewHistory).where(CaseViewHistory.id.in_(ids_to_delete))
                    )

    async def get_recent_cases(self, user_id: uuid.UUID, limit: int = 50) -> list[dict]:
        """Fetch cases recently opened by the user."""
        result = await self.db.execute(
            select(CaseViewHistory)
            .where(CaseViewHistory.user_id == user_id)
            .order_by(CaseViewHistory.viewed_at.desc())
            .limit(limit)
        )
        entries = result.scalars().all()
        return [
            {
                "id": str(e.id),
                "cnr": e.cnr,
                "title": e.title,
                "viewed_at": e.viewed_at.isoformat(),
            }
            for e in entries
        ]

    async def clear_case_history(self, user_id: uuid.UUID) -> None:
        """Clear all opened case history for the user."""
        await self.db.execute(
            delete(CaseViewHistory).where(CaseViewHistory.user_id == user_id)
        )

    async def delete_case_view(self, user_id: uuid.UUID, cnr: str) -> None:
        """Delete a single case view history entry."""
        await self.db.execute(
            delete(CaseViewHistory).where(
                CaseViewHistory.user_id == user_id,
                CaseViewHistory.cnr == cnr,
            )
        )

    # ── Search History ─────────────────────────────────────────────
    async def add_search(self, user_id: uuid.UUID, query: str, search_type: str = "general") -> None:
        """Record a search, maintaining the 100-entry limit per user."""
        entry = SearchHistory(user_id=user_id, search_query=query, search_type=search_type)
        self.db.add(entry)
        await self.db.flush()

        # Trim to last 100
        count_result = await self.db.execute(
            select(func.count(SearchHistory.id)).where(SearchHistory.user_id == user_id)
        )
        count = count_result.scalar() or 0

        if count > MAX_HISTORY:
            oldest = await self.db.execute(
                select(SearchHistory.id)
                .where(SearchHistory.user_id == user_id)
                .order_by(SearchHistory.created_at.asc())
                .limit(count - MAX_HISTORY)
            )
            ids_to_delete = [row[0] for row in oldest.all()]
            if ids_to_delete:
                await self.db.execute(
                    delete(SearchHistory).where(SearchHistory.id.in_(ids_to_delete))
                )

    async def get_recent_searches(self, user_id: uuid.UUID, limit: int = 20) -> list[dict]:
        result = await self.db.execute(
            select(SearchHistory)
            .where(SearchHistory.user_id == user_id)
            .order_by(SearchHistory.created_at.desc())
            .limit(limit)
        )
        entries = result.scalars().all()
        return [
            {
                "id": str(e.id),
                "query": e.search_query,
                "type": e.search_type,
                "created_at": e.created_at.isoformat(),
            }
            for e in entries
        ]

    async def get_recent_conversations(self, user_id: uuid.UUID, limit: int = 10) -> list[dict]:
        result = await self.db.execute(
            select(Conversation)
            .where(Conversation.user_id == user_id)
            .order_by(Conversation.updated_at.desc())
            .limit(limit)
        )
        convos = result.scalars().all()
        return [
            {
                "id": str(c.id),
                "cnr": c.cnr,
                "title": c.title,
                "updated_at": c.updated_at.isoformat(),
            }
            for c in convos
        ]

    async def clear_search_history(self, user_id: uuid.UUID) -> None:
        await self.db.execute(
            delete(SearchHistory).where(SearchHistory.user_id == user_id)
        )
