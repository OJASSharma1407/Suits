"""Documents router - user document upload, management, and semantic search endpoints."""

import uuid
import asyncio
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
import structlog

from app.dependencies.auth import CurrentUser, DbSession
from app.models.user_document import UserDocument, DocumentStatus, DocumentTag
from app.repositories.document_repository import DocumentRepository
from app.schemas.document import (
    DocumentUploadResponse, DocumentListItem, DocumentDetailResponse,
    DocumentStatsResponse, SemanticSearchRequest, SemanticSearchResult,
)
from app.schemas.common import APIResponse
from app.services.document_processor import DocumentProcessor, ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES

logger = structlog.get_logger()

router = APIRouter(prefix="/documents", tags=["Documents"])


async def _run_processing(document_id: uuid.UUID, database_url: str) -> None:
    """Run document processing in a background task with its own DB session."""
    from app.database.session import async_session_factory
    async with async_session_factory() as session:
        try:
            processor = DocumentProcessor(session)
            await processor.process_document(document_id)
            await session.commit()
        except Exception as exc:
            await session.rollback()
            logger.error("background_processing_failed", document_id=str(document_id), error=str(exc))


@router.post("/upload", response_model=APIResponse[DocumentUploadResponse])
async def upload_document(
    background_tasks: BackgroundTasks,
    user: CurrentUser,
    db: DbSession,
    file: UploadFile = File(...),
    cnr: Optional[str] = Form(default=None),
    tag: DocumentTag = Form(default=DocumentTag.OTHER),
):
    """Upload a legal document. Processing (OCR + embedding) happens asynchronously in background."""
    content_type = file.content_type or "application/octet-stream"

    # Read file into memory for validation
    file_data = await file.read()
    file_size = len(file_data)

    # Validate
    processor = DocumentProcessor(db)
    try:
        processor.validate_file(file.filename or "upload", content_type, file_size)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    # Save to disk
    file_path = processor.save_file(user.id, file.filename or "upload", file_data)

    # Create database record (status=PENDING)
    doc = UserDocument(
        user_id=user.id,
        cnr=cnr or None,
        filename=file_path.name,
        original_filename=file.filename or "upload",
        file_path=str(file_path),
        file_size=file_size,
        mime_type=content_type,
        tag=tag,
        status=DocumentStatus.PENDING,
    )
    repo = DocumentRepository(db)
    doc = await repo.create(doc)
    document_id = doc.id

    from app.core.config import settings
    background_tasks.add_task(_run_processing, document_id, settings.database_url)

    logger.info("document_uploaded", document_id=str(document_id), filename=file.filename)
    return APIResponse(
        data=DocumentUploadResponse.model_validate(doc),
        message="Document uploaded. Processing started in background.",
    )


@router.get("", response_model=APIResponse[list[DocumentListItem]])
async def list_documents(
    user: CurrentUser,
    db: DbSession,
    cnr: Optional[str] = None,
    tag: Optional[DocumentTag] = None,
    status: Optional[DocumentStatus] = None,
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
):
    """List all documents belonging to the current user with optional filters."""
    repo = DocumentRepository(db)
    docs = await repo.get_user_documents(
        user_id=user.id,
        cnr=cnr,
        tag=tag,
        status=status,
        search=search,
        limit=limit,
        offset=offset,
    )
    return APIResponse(data=[DocumentListItem.model_validate(d) for d in docs])


@router.get("/stats", response_model=APIResponse[DocumentStatsResponse])
async def get_document_stats(user: CurrentUser, db: DbSession):
    """Return aggregate stats: document count, indexed count, and total storage used."""
    repo = DocumentRepository(db)
    all_docs = await repo.get_user_documents(user_id=user.id, limit=10000)
    indexed = sum(1 for d in all_docs if d.status == DocumentStatus.INDEXED)
    total_storage = await repo.get_total_storage(user.id)
    return APIResponse(data=DocumentStatsResponse(
        total_documents=len(all_docs),
        indexed_documents=indexed,
        total_storage_bytes=total_storage,
    ))


@router.get("/{document_id}", response_model=APIResponse[DocumentDetailResponse])
async def get_document(document_id: uuid.UUID, user: CurrentUser, db: DbSession):
    """Get full document details including extracted text."""
    repo = DocumentRepository(db)
    doc = await repo.get_by_id(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    if doc.user_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied.")
    return APIResponse(data=DocumentDetailResponse.model_validate(doc))


@router.get("/{document_id}/download")
async def download_document(document_id: uuid.UUID, user: CurrentUser, db: DbSession):
    """Download the original uploaded file."""
    repo = DocumentRepository(db)
    doc = await repo.get_by_id(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    if doc.user_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied.")
    file_path = Path(doc.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk.")
    return FileResponse(
        path=str(file_path),
        filename=doc.original_filename,
        media_type=doc.mime_type,
    )


@router.delete("/{document_id}", response_model=APIResponse)
async def delete_document(document_id: uuid.UUID, user: CurrentUser, db: DbSession):
    """Delete a document and all its chunks. Also removes the file from disk."""
    repo = DocumentRepository(db)
    doc = await repo.get_by_id(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    if doc.user_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    # Remove file from disk
    try:
        file_path = Path(doc.file_path)
        if file_path.exists():
            file_path.unlink()
    except Exception as exc:
        logger.warning("file_delete_failed", path=doc.file_path, error=str(exc))

    await repo.delete_document(document_id)
    return APIResponse(message="Document deleted successfully.")


@router.post("/{document_id}/reprocess", response_model=APIResponse[DocumentUploadResponse])
async def reprocess_document(
    document_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    user: CurrentUser,
    db: DbSession,
):
    """Re-trigger OCR and embedding pipeline for a FAILED document."""
    repo = DocumentRepository(db)
    doc = await repo.get_by_id(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    if doc.user_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied.")
    if doc.status == DocumentStatus.PROCESSING:
        raise HTTPException(status_code=409, detail="Document is already being processed.")

    doc.status = DocumentStatus.PENDING
    doc.error_message = None
    await db.flush()

    from app.core.config import settings
    background_tasks.add_task(_run_processing, document_id, settings.database_url)
    return APIResponse(
        data=DocumentUploadResponse.model_validate(doc),
        message="Reprocessing started.",
    )


@router.post("/search", response_model=APIResponse[list[SemanticSearchResult]])
async def semantic_search(
    request: SemanticSearchRequest,
    user: CurrentUser,
    db: DbSession,
):
    """Perform semantic search across the user's indexed documents."""
    repo = DocumentRepository(db)
    results = await repo.semantic_search(
        user_id=user.id,
        query_text=request.query,
        cnr=request.cnr,
        top_k=request.top_k,
    )
    items = [
        SemanticSearchResult(
            score=score,
            chunk_text=chunk.chunk_text,
            document_id=doc.id,
            original_filename=doc.original_filename,
            tag=doc.tag,
            cnr=doc.cnr,
        )
        for score, chunk, doc in results
    ]
    return APIResponse(data=items)
