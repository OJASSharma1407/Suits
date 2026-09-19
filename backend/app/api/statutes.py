"""Statutes router - Criminal Law Era Transition Engine (IPC/CrPC/IEA ↔ BNS/BNSS/BSA)."""

import re
from fastapi import APIRouter, Query, Response
import structlog

from app.dependencies.auth import CurrentUser, DbSession
from app.schemas.common import APIResponse
from app.schemas.era_transition import (
    ConcordanceLookupResponse,
    EraTransitionCaseAnalysis,
)
from app.services.era_transition_service import EraTransitionService
from app.core.exceptions import InvalidCNRError

logger = structlog.get_logger()

router = APIRouter(prefix="/statutes", tags=["Statutes & Era Transition"])

CNR_PATTERN = re.compile(r"^[A-Z]{4}\d{12}$")


def _validate_cnr(cnr: str) -> str:
    cnr = cnr.upper().strip()
    if not (CNR_PATTERN.match(cnr) or cnr.isdigit()):
        raise InvalidCNRError(cnr)
    return cnr


@router.get("/era-transition/lookup", response_model=APIResponse[ConcordanceLookupResponse])
async def lookup_era_concordance(
    query: str = Query(..., min_length=1, description="Section number, statute name, or legal doctrine"),
    limit: int = Query(12, ge=1, le=50),
    user: CurrentUser = None,
    db: DbSession = None,
):
    """Search criminal statutes concordance by section, statute, or InLegalBERT semantic doctrine."""
    service = EraTransitionService(db)
    pairs = service.lookup_concordance(query=query, limit=limit)
    response_data = ConcordanceLookupResponse(
        query=query,
        match_count=len(pairs),
        pairs=pairs,
    )
    return APIResponse(data=response_data)


@router.get("/cases/{cnr}/era-transition", response_model=APIResponse[EraTransitionCaseAnalysis])
async def get_case_era_transition(
    cnr: str,
    user: CurrentUser,
    db: DbSession,
):
    """Generate or retrieve cached criminal era transition matrix and transposed pleading arguments."""
    cnr = _validate_cnr(cnr)
    service = EraTransitionService(db)
    analysis = await service.analyze_case_transition(cnr)
    if analysis is None:
        return Response(status_code=204)
    return APIResponse(data=analysis)


@router.post("/cases/{cnr}/era-transition/refresh", response_model=APIResponse[EraTransitionCaseAnalysis])
async def refresh_case_era_transition(
    cnr: str,
    user: CurrentUser,
    db: DbSession,
):
    """Force re-generation of criminal era transition analysis and court pleading arguments."""
    cnr = _validate_cnr(cnr)
    service = EraTransitionService(db)
    analysis = await service.analyze_case_transition(cnr, force_refresh=True)
    if analysis is None:
        return Response(status_code=204)
    return APIResponse(data=analysis, message="Era transition analysis refreshed.")
