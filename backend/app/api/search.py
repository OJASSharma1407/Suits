"""Search router - Case Search and Search Capabilities."""

from fastapi import APIRouter, Query

from app.dependencies.auth import CurrentUser, DbSession
from app.schemas.search import SearchRequest, SearchResponse, SearchCapabilitiesResponse
from app.schemas.common import APIResponse
from app.services.search_service import SearchService
from app.services.history_service import HistoryService

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("", response_model=APIResponse[SearchResponse])
async def search_cases(
    user: CurrentUser,
    db: DbSession,
    query: str | None = None,
    court_code: str | None = None,
    state_code: str | None = None,
    case_type: str | None = None,
    case_status: str | None = None,
    filing_year: int | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    sort_by: str | None = None,
):
    request = SearchRequest(
        query=query, court_code=court_code, state_code=state_code,
        case_type=case_type, case_status=case_status, filing_year=filing_year,
        page=page, page_size=page_size, sort_by=sort_by,
    )

    service = SearchService(db)
    results = await service.search(request)

    # Record search history
    if query:
        history = HistoryService(db)
        await history.add_search(user.id, query, search_type="general")

    return APIResponse(data=results)


@router.get("/capabilities", response_model=APIResponse[SearchCapabilitiesResponse])
async def get_search_capabilities(db: DbSession):
    service = SearchService(db)
    caps = await service.get_capabilities()
    return APIResponse(data=caps)
