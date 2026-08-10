"""Orders router - Order AI, Markdown, and PDF Download."""

from fastapi import APIRouter
from fastapi.responses import Response

from app.dependencies.auth import CurrentUser, DbSession
from app.schemas.order import OrderMarkdownResponse, OrderAIResponse
from app.schemas.common import APIResponse
from app.services.order_service import OrderService

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.get("/{cnr}/markdown/{filename}", response_model=APIResponse[OrderMarkdownResponse])
async def get_order_markdown(cnr: str, filename: str, user: CurrentUser, db: DbSession):
    service = OrderService(db)
    result = await service.get_markdown(cnr, filename)
    return APIResponse(data=result)


@router.get("/{cnr}/ai/{filename}", response_model=APIResponse[OrderAIResponse])
async def get_order_ai(cnr: str, filename: str, user: CurrentUser, db: DbSession):
    service = OrderService(db)
    result = await service.get_ai_analysis(cnr, filename)
    return APIResponse(data=result)


@router.get("/{cnr}/download/{filename}")
async def download_order_pdf(cnr: str, filename: str, user: CurrentUser, db: DbSession):
    """Download the original court order PDF.

    This endpoint streams the PDF directly. It is the highest-cost endpoint
    and should only be called when the user explicitly requests a download.
    """
    service = OrderService(db)
    pdf_bytes = await service.download_pdf(cnr, filename)

    # Check magic bytes to determine if it's actually a PDF or an HTML page
    is_pdf = pdf_bytes.startswith(b'%PDF-')
    ext = '.pdf' if is_pdf else '.html'
    media_type = 'application/pdf' if is_pdf else 'text/html; charset=utf-8'

    safe_filename = f"{cnr}_{filename}"
    if not safe_filename.lower().endswith(ext):
        # Remove any existing .pdf or .html extension just in case, though it shouldn't have one
        import re
        safe_filename = re.sub(r'\.(pdf|html|txt)$', '', safe_filename, flags=re.IGNORECASE) + ext

    return Response(
        content=pdf_bytes,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{safe_filename}"'},
    )
