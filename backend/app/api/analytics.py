"""Analytics router - Dashboard statistics based on user data."""

from fastapi import APIRouter
from sqlalchemy import select, func

from app.dependencies.auth import CurrentUser, DbSession
from app.schemas.common import APIResponse
from app.models.bookmark import Bookmark
from app.models.conversation import Conversation
from app.models.search_history import SearchHistory

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard", response_model=APIResponse)
async def get_dashboard_stats(user: CurrentUser, db: DbSession):
    """User workspace statistics."""
    bookmark_count = (await db.execute(
        select(func.count(Bookmark.id)).where(Bookmark.user_id == user.id)
    )).scalar() or 0

    conversation_count = (await db.execute(
        select(func.count(Conversation.id)).where(Conversation.user_id == user.id)
    )).scalar() or 0

    search_count = (await db.execute(
        select(func.count(SearchHistory.id)).where(SearchHistory.user_id == user.id)
    )).scalar() or 0

    return APIResponse(data={
        "bookmarks": bookmark_count,
        "conversations": conversation_count,
        "searches": search_count,
    })
