"""Bookmarks router - Save, Delete, List bookmarks."""

from fastapi import APIRouter

from app.dependencies.auth import CurrentUser, DbSession
from app.schemas.bookmark import CreateBookmarkRequest, BookmarkResponse
from app.schemas.common import APIResponse
from app.services.bookmark_service import BookmarkService

router = APIRouter(prefix="/bookmarks", tags=["Bookmarks"])


@router.get("", response_model=APIResponse[list[BookmarkResponse]])
async def list_bookmarks(user: CurrentUser, db: DbSession):
    service = BookmarkService(db)
    bookmarks = await service.list_bookmarks(user.id)
    return APIResponse(data=bookmarks)


@router.post("", response_model=APIResponse[BookmarkResponse])
async def add_bookmark(request: CreateBookmarkRequest, user: CurrentUser, db: DbSession):
    service = BookmarkService(db)
    bookmark = await service.add_bookmark(user.id, request.cnr, request.title)
    return APIResponse(data=bookmark, message="Case bookmarked.")


@router.delete("/{cnr}", response_model=APIResponse)
async def remove_bookmark(cnr: str, user: CurrentUser, db: DbSession):
    service = BookmarkService(db)
    await service.remove_bookmark(user.id, cnr)
    return APIResponse(message="Bookmark removed.")


@router.get("/{cnr}/check", response_model=APIResponse[bool])
async def check_bookmark(cnr: str, user: CurrentUser, db: DbSession):
    service = BookmarkService(db)
    is_bookmarked = await service.is_bookmarked(user.id, cnr)
    return APIResponse(data=is_bookmarked)
