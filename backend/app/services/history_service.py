"""History service - recent searches, cases, and conversations."""

import uuid

from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.search_history import SearchHistory
from app.models.conversation import Conversation

MAX_SEARCH_HISTORY = 100


class HistoryService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

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

        if count > MAX_SEARCH_HISTORY:
            oldest = await self.db.execute(
                select(SearchHistory.id)
                .where(SearchHistory.user_id == user_id)
                .order_by(SearchHistory.created_at.asc())
                .limit(count - MAX_SEARCH_HISTORY)
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
