"""Orders router - Order AI, Markdown, and PDF Download."""

from fastapi import APIRouter
from fastapi.responses import Response

from app.dependencies.auth import CurrentUser, DbSession
from app.schemas.order import OrderMarkdownResponse, OrderAIResponse
from app.schemas.common import APIResponse
from app.services.order_service import OrderService

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.get("/{cnr}/markdown/{filename:path}", response_model=APIResponse[OrderMarkdownResponse])
async def get_order_markdown(cnr: str, filename: str, user: CurrentUser, db: DbSession):
    service = OrderService(db)
    result = await service.get_markdown(cnr, filename)
    return APIResponse(data=result)


@router.get("/{cnr}/ai/{filename:path}", response_model=APIResponse[OrderAIResponse])
async def get_order_ai(cnr: str, filename: str, user: CurrentUser, db: DbSession):
    service = OrderService(db)
    result = await service.get_ai_analysis(cnr, filename)
    return APIResponse(data=result)


@router.get("/{cnr}/download/{filename:path}")
async def download_order_pdf(cnr: str, filename: str, user: CurrentUser, db: DbSession):
    """Download the original court order PDF."""
    from fastapi import HTTPException
    service = OrderService(db)
    pdf_bytes = await service.download_pdf(cnr, filename)

    if not pdf_bytes or not pdf_bytes.startswith(b'%PDF-'):
        raise HTTPException(
            status_code=404,
            detail="Original scanned court PDF is not available for this record."
        )

    safe_filename = f"{cnr}_{filename.replace('/', '_').replace(':', '_')}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{safe_filename}"'},
    )
