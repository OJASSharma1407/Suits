"""Bookmark service - CRUD operations for saved cases."""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import DuplicateError, NotFoundError
from app.models.bookmark import Bookmark
from app.repositories.bookmark_repository import BookmarkRepository
from app.schemas.bookmark import BookmarkResponse


class BookmarkService:
    def __init__(self, db: AsyncSession) -> None:
        self.repo = BookmarkRepository(db)

    async def list_bookmarks(self, user_id: uuid.UUID) -> list[BookmarkResponse]:
        bookmarks = await self.repo.get_user_bookmarks(user_id)
        return [BookmarkResponse.model_validate(b) for b in bookmarks]

    async def add_bookmark(self, user_id: uuid.UUID, cnr: str, title: str) -> BookmarkResponse:
        if await self.repo.exists(user_id, cnr):
            raise DuplicateError("Case already bookmarked.")
        bookmark = Bookmark(user_id=user_id, cnr=cnr, title=title)
        created = await self.repo.create(bookmark)
        return BookmarkResponse.model_validate(created)

    async def remove_bookmark(self, user_id: uuid.UUID, cnr: str) -> None:
        deleted = await self.repo.delete(user_id, cnr)
        if not deleted:
            raise NotFoundError("Bookmark")

    async def is_bookmarked(self, user_id: uuid.UUID, cnr: str) -> bool:
        return await self.repo.exists(user_id, cnr)
