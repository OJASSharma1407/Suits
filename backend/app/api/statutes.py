"""Statutes router - Criminal Law Era Transition Engine (IPC/CrPC/IEA ↔ BNS/BNSS/BSA)."""

import re
from fastapi import APIRouter, Query, Response
import structlog

from app.dependencies.auth import CurrentUser, OptionalUser, DbSession
from app.schemas.common import APIResponse
from app.schemas.era_transition import (
    ConcordanceLookupResponse,
    EraTransitionCaseAnalysis,
    TransitionQuestionRequest,
    TransitionQuestionResponse,
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
def lookup_era_concordance(
    query: str = Query("", description="Section number, statute name, or legal doctrine"),
    limit: int = Query(24, ge=1, le=100),
    category: str | None = Query(None, description="Optional category filter (PROCEDURAL, SUBSTANTIVE, EVIDENTIARY)"),
    user: OptionalUser = None,
    db: DbSession = None,
):
    """Search criminal statutes concordance by section, statute, or InLegalBERT semantic doctrine."""
    # If the user explicitly typed a statute in their query, prioritize that over any tab filter
    q_lower = query.lower()
    if re.search(r"\b(crpc|code of criminal procedure|criminal procedure|bnss|bharatiya nagarik|nagarik suraksha)\b", q_lower):
        category = "PROCEDURAL"
    elif re.search(r"\b(ipc|indian penal|penal code|bns|bharatiya nyaya|nyaya sanhita)\b", q_lower):
        category = "SUBSTANTIVE"
    elif re.search(r"\b(iea|evidence act|indian evidence|bsa|bharatiya sakshya|sakshya adhiniyam)\b", q_lower):
        category = "EVIDENTIARY"

    service = EraTransitionService(db)
    pairs = service.lookup_concordance(query=query, limit=limit, category=category)
    response_data = ConcordanceLookupResponse(
        query=query,
        match_count=len(pairs),
        pairs=pairs,
    )
    return APIResponse(data=response_data)


@router.post("/era-transition/ask", response_model=APIResponse[TransitionQuestionResponse])
async def ask_era_transition_question(
    payload: TransitionQuestionRequest,
    user: OptionalUser = None,
    db: DbSession = None,
):
    """Answer legal transition questions and synthesize court-ready submissions."""
    service = EraTransitionService(db)
    result = await service.answer_transition_question(
        question=payload.question,
        category=payload.category,
        active_era=payload.active_era,
    )
    return APIResponse(data=result)



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
