"""History router - Recent Searches, Recent Cases."""

from fastapi import APIRouter

from app.dependencies.auth import CurrentUser, DbSession
from app.schemas.common import APIResponse
from app.services.history_service import HistoryService

router = APIRouter(prefix="/history", tags=["History"])


@router.get("/searches", response_model=APIResponse)
async def get_search_history(user: CurrentUser, db: DbSession):
    service = HistoryService(db)
    searches = await service.get_recent_searches(user.id)
    return APIResponse(data=searches)


@router.get("/conversations", response_model=APIResponse)
async def get_recent_conversations(user: CurrentUser, db: DbSession):
    service = HistoryService(db)
    conversations = await service.get_recent_conversations(user.id)
    return APIResponse(data=conversations)


@router.delete("/searches", response_model=APIResponse)
async def clear_search_history(user: CurrentUser, db: DbSession):
    service = HistoryService(db)
    await service.clear_search_history(user.id)
    return APIResponse(message="Search history cleared.")
