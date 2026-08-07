"""Bookmark repository - database operations for bookmarks."""

import uuid

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.bookmark import Bookmark


class BookmarkRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_user_bookmarks(
        self, user_id: uuid.UUID, limit: int = 100, offset: int = 0
    ) -> list[Bookmark]:
        result = await self.db.execute(
            select(Bookmark)
            .where(Bookmark.user_id == user_id)
            .order_by(Bookmark.bookmarked_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all())

    async def get_by_cnr(self, user_id: uuid.UUID, cnr: str) -> Bookmark | None:
        result = await self.db.execute(
            select(Bookmark).where(Bookmark.user_id == user_id, Bookmark.cnr == cnr)
        )
        return result.scalar_one_or_none()

    async def create(self, bookmark: Bookmark) -> Bookmark:
        self.db.add(bookmark)
        await self.db.flush()
        return bookmark

    async def delete(self, user_id: uuid.UUID, cnr: str) -> bool:
        result = await self.db.execute(
            delete(Bookmark).where(Bookmark.user_id == user_id, Bookmark.cnr == cnr)
        )
        return result.rowcount > 0

    async def exists(self, user_id: uuid.UUID, cnr: str) -> bool:
        result = await self.db.execute(
            select(Bookmark.id).where(Bookmark.user_id == user_id, Bookmark.cnr == cnr)
        )
        return result.scalar_one_or_none() is not None
