"""History router - Recent Cases, Recent Searches, Recent Conversations."""

from fastapi import APIRouter

from app.dependencies.auth import CurrentUser, DbSession
from app.schemas.common import APIResponse
from app.schemas.history import RecordCaseViewRequest, CaseViewResponse
from app.services.history_service import HistoryService

router = APIRouter(prefix="/history", tags=["History"])


# ── Case View History (Opened Cases) ──────────────────────────
@router.get("/cases", response_model=APIResponse[list[dict]])
async def get_case_history(user: CurrentUser, db: DbSession):
    service = HistoryService(db)
    cases = await service.get_recent_cases(user.id)
    return APIResponse(data=cases)


@router.post("/cases", response_model=APIResponse)
async def record_case_view(request: RecordCaseViewRequest, user: CurrentUser, db: DbSession):
    service = HistoryService(db)
    await service.add_case_view(user.id, request.cnr, request.title)
    return APIResponse(message="Case view recorded.")


@router.delete("/cases", response_model=APIResponse)
async def clear_case_history(user: CurrentUser, db: DbSession):
    service = HistoryService(db)
    await service.clear_case_history(user.id)
    return APIResponse(message="Case history cleared.")


@router.delete("/cases/{cnr}", response_model=APIResponse)
async def delete_case_view(cnr: str, user: CurrentUser, db: DbSession):
    service = HistoryService(db)
    await service.delete_case_view(user.id, cnr)
    return APIResponse(message="Case view removed from history.")


# ── Search & Conversation History ─────────────────────────────
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
