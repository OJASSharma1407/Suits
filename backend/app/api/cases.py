"""Cases router - Case Details, Timeline, Court Structure, Enums."""

import re
from fastapi import APIRouter

from app.dependencies.auth import CurrentUser, DbSession
from app.schemas.case import CaseDetailsResponse, RefreshResponse
from app.schemas.citation import CitationGraphResponse
from app.schemas.common import APIResponse
from app.services.case_service import CaseService
from app.services.citation_service import CitationService
from app.services.ecourts_service import ecourts_service
from app.core.exceptions import InvalidCNRError

router = APIRouter(prefix="/cases", tags=["Cases"])

CNR_PATTERN = re.compile(r"^[A-Z]{4}\d{12}$")


def _validate_cnr(cnr: str) -> str:
    cnr = cnr.upper().strip()
    # Accept either eCourts 16-char CNR or Kanoon numeric tid
    if not (CNR_PATTERN.match(cnr) or cnr.isdigit()):
        raise InvalidCNRError(cnr)
    return cnr


# --- Reference routes MUST be declared before the dynamic /{cnr} route ---

@router.get("/reference/court-structure", response_model=APIResponse)
async def get_court_structure(user: CurrentUser):
    data = await ecourts_service.get_court_structure()
    return APIResponse(data=data)


@router.get("/reference/enums", response_model=APIResponse)
async def get_enums(user: CurrentUser):
    data = await ecourts_service.get_enums()
    return APIResponse(data=data)


@router.get("/reference/available-dates", response_model=APIResponse)
async def get_available_dates(court_code: str, user: CurrentUser):
    data = await ecourts_service.get_available_dates(court_code)
    return APIResponse(data=data)


@router.get("/reference/cause-list", response_model=APIResponse)
async def get_cause_list(court_code: str, date: str, user: CurrentUser):
    data = await ecourts_service.get_cause_list(court_code, date)
    return APIResponse(data=data)


# --- Dynamic CNR routes ---

@router.get("/{cnr}", response_model=APIResponse[CaseDetailsResponse])
async def get_case_details(cnr: str, user: CurrentUser, db: DbSession):
    cnr = _validate_cnr(cnr)
    service = CaseService(db)
    case = await service.get_case_details(cnr, user_id=user.id)
    return APIResponse(data=case)


@router.get("/{cnr}/citation-graph", response_model=APIResponse[CitationGraphResponse])
async def get_citation_graph(cnr: str, user: CurrentUser, db: DbSession):
    """Retrieve 2D citation network topology and precedent scoring for a case."""
    cnr = _validate_cnr(cnr)
    service = CitationService(db)
    graph_data = await service.get_citation_graph(cnr)
    return APIResponse(data=graph_data)


@router.post("/{cnr}/refresh", response_model=APIResponse[RefreshResponse])
async def refresh_case(cnr: str, user: CurrentUser, db: DbSession):
    cnr = _validate_cnr(cnr)
    service = CaseService(db)
    result = await service.refresh_case(cnr)
    return APIResponse(data=result, message="Refresh request submitted.")

