"""API router for Adversarial Defense Engine (Counter-Pleading & Written Statement Generator)."""

import uuid
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
import structlog

from app.dependencies.auth import CurrentUser, DbSession
from app.repositories.document_repository import DocumentRepository
from app.schemas.common import APIResponse
from app.schemas.counter_pleading import (
    AnalyzePlaintRequest,
    AnalyzePlaintResponse,
    GenerateWrittenStatementRequest,
    WrittenStatementResponse,
)
from app.services.counter_pleading_service import counter_pleading_service
from app.services.document_processor import DocumentProcessor

logger = structlog.get_logger()

router = APIRouter(prefix="/defense", tags=["Adversarial Defense"])


@router.post("/analyze-plaint", response_model=APIResponse[AnalyzePlaintResponse])
async def analyze_plaint(
    req: AnalyzePlaintRequest,
    user: CurrentUser,
    db: DbSession,
):
    """Analyze an opposing Plaint or Writ Petition to extract structure, paragraphs, and statutory bars."""
    raw_text = req.raw_text or ""

    # If document_id provided, fetch and extract from the stored file
    if req.document_id and not raw_text.strip():
        try:
            doc_uuid = uuid.UUID(req.document_id)
            repo = DocumentRepository(db)
            doc = await repo.get_by_id(doc_uuid)
            if not doc or doc.user_id != user.id:
                raise HTTPException(status_code=404, detail="Document not found in user vault.")

            file_path = Path(doc.file_path)
            if not file_path.exists():
                raise HTTPException(status_code=404, detail="Stored document file not found on disk.")

            processor = DocumentProcessor(db)
            file_bytes = file_path.read_bytes()
            extracted_text, _ = await processor.extract_text(file_bytes, doc.mime_type, doc.original_filename)
            raw_text = extracted_text
        except HTTPException:
            raise
        except ValueError as val_err:
            raise HTTPException(status_code=400, detail=f"Invalid document UUID: {val_err}")
        except Exception as exc:
            logger.error("analyze_plaint_file_read_error", error=str(exc))
            raise HTTPException(status_code=500, detail=f"Failed to read and extract document: {str(exc)}")

    if not raw_text.strip():
        raise HTTPException(status_code=400, detail="Please provide either a valid document_id or raw_text of the plaint.")

    try:
        response = counter_pleading_service.analyze_plaint(
            raw_text=raw_text, plaint_title=req.plaint_title
        )
        return APIResponse(
            data=response,
            message="Plaint structure and statutory bars successfully analyzed.",
        )
    except Exception as exc:
        logger.error("analyze_plaint_failed", error=str(exc))
        raise HTTPException(status_code=500, detail=f"Failed to analyze plaint: {str(exc)}")


@router.post("/generate-written-statement", response_model=APIResponse[WrittenStatementResponse])
async def generate_written_statement(
    req: GenerateWrittenStatementRequest,
    user: CurrentUser,
):
    """Synthesize a complete court-ready Written Statement under Order VIII CPC."""
    if not req.paragraphs:
        raise HTTPException(status_code=400, detail="At least one paragraph must be provided to generate a Written Statement.")

    try:
        response = await counter_pleading_service.generate_written_statement(req)
        return APIResponse(
            data=response,
            message="Court-ready Written Statement synthesized successfully.",
        )
    except Exception as exc:
        logger.error("generate_written_statement_failed", error=str(exc))
        raise HTTPException(status_code=500, detail=f"Failed to generate Written Statement: {str(exc)}")
