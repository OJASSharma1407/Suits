"""Cases router - Case Details, Timeline, Court Structure, Enums."""

import re
from fastapi import APIRouter

from app.dependencies.auth import CurrentUser, DbSession
from app.schemas.case import CaseDetailsResponse, RefreshResponse
from app.schemas.citation import CitationGraphResponse
from app.schemas.similar_case import SimilarCasesResponse
from app.schemas.common import APIResponse
from app.services.case_service import CaseService
from app.services.citation_service import CitationService
from app.services.similar_cases_service import SimilarCasesService
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


@router.get("/{cnr}/similar-cases", response_model=APIResponse[SimilarCasesResponse])
@router.get("/{cnr}/similar", response_model=APIResponse[SimilarCasesResponse])
async def get_similar_cases(cnr: str, user: CurrentUser, db: DbSession, synthesize: bool = False):
    """Retrieve legally analogous cases and precedents using Hybrid RAG."""
    cnr = _validate_cnr(cnr)
    service = SimilarCasesService(db)
    similar_data = await service.get_similar_cases(cnr, synthesize_llm=synthesize)
    return APIResponse(data=similar_data)


@router.post("/{cnr}/refresh", response_model=APIResponse[RefreshResponse])
async def refresh_case(cnr: str, user: CurrentUser, db: DbSession):
    cnr = _validate_cnr(cnr)
    service = CaseService(db)
    result = await service.refresh_case(cnr)
    return APIResponse(data=result, message="Refresh request submitted.")


@router.get("/{cnr}/prediction")
async def get_case_prediction(cnr: str, user: CurrentUser, db: DbSession):
    """Retrieve judicial outcome prediction and precedent comparison."""
    from fastapi.responses import Response
    from app.services.prediction_service import PredictionService

    cnr = _validate_cnr(cnr)
    service = PredictionService(db)
    pred = await service.get_case_prediction(cnr)
    if pred is None:
        return Response(status_code=204)
    return APIResponse(data=pred.model_dump())


@router.post("/{cnr}/prediction/refresh")
async def refresh_case_prediction(cnr: str, user: CurrentUser, db: DbSession):
    """Force re-run of prediction analysis."""
    from fastapi.responses import Response
    from app.services.prediction_service import PredictionService

    cnr = _validate_cnr(cnr)
    service = PredictionService(db)
    pred = await service.get_case_prediction(cnr, force_refresh=True)
    if pred is None:
        return Response(status_code=204)
    return APIResponse(data=pred.model_dump(), message="Prediction refreshed.")


@router.get("/{cnr}/headnote")
async def get_case_headnote(
    cnr: str,
    user: CurrentUser,
    db: DbSession,
    filename: str | None = None,
):
    """Retrieve publisher-grade headnote and ratio extraction (SCC / AIR standard)."""
    from fastapi.responses import Response
    from app.services.headnote_service import HeadnoteService

    cnr = _validate_cnr(cnr)
    service = HeadnoteService(db)
    headnote_resp = await service.get_or_generate_headnote(cnr, filename=filename)
    if headnote_resp is None:
        return Response(status_code=204)
    return APIResponse(data=headnote_resp.model_dump())


@router.post("/{cnr}/headnote/refresh")
async def refresh_case_headnote(
    cnr: str,
    user: CurrentUser,
    db: DbSession,
    filename: str | None = None,
):
    """Force re-generation of publisher-grade headnote."""
    from fastapi.responses import Response
    from app.services.headnote_service import HeadnoteService

    cnr = _validate_cnr(cnr)
    service = HeadnoteService(db)
    headnote_resp = await service.get_or_generate_headnote(cnr, filename=filename, force_refresh=True)
    if headnote_resp is None:
        return Response(status_code=204)
    return APIResponse(data=headnote_resp.model_dump(), message="Headnote refreshed.")


@router.get("/{cnr}/era-transition/instant")
async def get_case_era_transition_instant(
    cnr: str,
    user: CurrentUser,
    db: DbSession,
):
    """Zero-LLM concordance snapshot: IPC/CrPC/IEA ↔ BNS/BNSS/BSA section mapping.

    Resolves applicable statutory era and extracts all relevant IPC↔BNS concordance
    pairs for the case entirely from the static Python dictionary — no LLM call, no
    token consumption, returns in <10ms.  Call this on case load.  Only call the full
    /era-transition endpoint when the user explicitly requests 'Draft Transition Arguments'.
    """
    from fastapi.responses import Response
    from app.services.era_transition_service import EraTransitionService

    cnr = _validate_cnr(cnr)
    service = EraTransitionService(db)
    instant = await service.get_instant_concordance(cnr)
    if instant is None:
        return Response(status_code=204)
    return APIResponse(data=instant.model_dump())


@router.get("/{cnr}/era-transition")
async def get_case_era_transition_cases(
    cnr: str,
    user: CurrentUser,
    db: DbSession,
):
    """Retrieve or generate criminal era transition matrix and court-ready transposed pleading paragraphs."""
    from fastapi.responses import Response
    from app.services.era_transition_service import EraTransitionService

    cnr = _validate_cnr(cnr)
    service = EraTransitionService(db)
    analysis = await service.analyze_case_transition(cnr)
    if analysis is None:
        return Response(status_code=204)
    return APIResponse(data=analysis.model_dump())


@router.post("/{cnr}/era-transition/refresh")
async def refresh_case_era_transition_cases(
    cnr: str,
    user: CurrentUser,
    db: DbSession,
):
    """Force re-generation of criminal era transition analysis."""
    from fastapi.responses import Response
    from app.services.era_transition_service import EraTransitionService

    cnr = _validate_cnr(cnr)
    service = EraTransitionService(db)
    analysis = await service.analyze_case_transition(cnr, force_refresh=True)
    if analysis is None:
        return Response(status_code=204)
    return APIResponse(data=analysis.model_dump(), message="Era transition analysis refreshed.")



