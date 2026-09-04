"""Analytics router - Dashboard statistics based on user data."""

from fastapi import APIRouter
from app.dependencies.auth import CurrentUser, OptionalUser, DbSession
from app.schemas.common import APIResponse

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard", response_model=APIResponse)
async def get_dashboard_stats(user: CurrentUser, db: DbSession):
    """User workspace statistics and deep practice telemetry."""
    from app.services.analytics_service import analytics_service

    insights = await analytics_service.get_dashboard_analytics(user.id, db)
    return APIResponse(data=insights.model_dump())


@router.get("/judge/{judge_name}", response_model=APIResponse)
async def get_judge_analytics(
    judge_name: str,
    user: OptionalUser = None,
    court: str | None = None,
):
    """Retrieve comprehensive Judicial Analytics Dossier for a judge."""
    from app.services.judge_analytics_service import judge_analytics_service

    dossier = await judge_analytics_service.get_judge_dossier(
        raw_name=judge_name,
        court_hint=court,
    )
    return APIResponse(data=dossier.model_dump())

