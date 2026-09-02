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
    DocumentResearchUpdateRequest, DocumentChatRequest,
)
from app.schemas.order import OrderAIResponse
from app.schemas.common import APIResponse
from app.services.document_processor import DocumentProcessor, ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES

logger = structlog.get_logger()

router = APIRouter(prefix="/documents", tags=["Documents"])


async def _run_processing(document_id: uuid.UUID) -> None:
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

    background_tasks.add_task(_run_processing, document_id)

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


@router.get("/{document_id}/ai", response_model=APIResponse[OrderAIResponse])
async def get_document_ai(document_id: uuid.UUID, user: CurrentUser, db: DbSession):
    """Get structured legal AI analysis for an uploaded document."""
    repo = DocumentRepository(db)
    doc = await repo.get_by_id(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    if doc.user_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    raw = doc.ai_analysis
    has_valid_summary = isinstance(raw, dict) and bool(
        (raw.get("executiveSummary") or raw.get("executive_summary"))
        and "uploaded for legal analysis" not in str(raw.get("executiveSummary") or "")
        and "uploaded for legal review" not in str(raw.get("executiveSummary") or "")
    )
    if not has_valid_summary:
        if doc.extracted_text:
            processor = DocumentProcessor(db)
            raw = await processor.generate_structured_ai_analysis(doc.extracted_text, doc.original_filename, doc.cnr)
            doc.ai_analysis = raw
            await db.flush()
        else:
            raw = {
                "caseNumber": doc.cnr or doc.original_filename,
                "courtName": "User Document Record",
                "executiveSummary": doc.summary or f"Document {doc.original_filename} uploaded for legal review.",
                "plainLanguageSummary": doc.summary or "Summary pending extraction.",
                "extractionConfidence": 0.5,
                "filename": doc.original_filename,
                "cnr": doc.cnr or "",
            }

    from app.services.order_service import OrderService
    ai_resp = OrderService._transform_ai_response(doc.cnr or "", doc.original_filename, raw)
    return APIResponse(data=ai_resp)


@router.put("/{document_id}/research", response_model=APIResponse[DocumentDetailResponse])
async def update_document_research(
    document_id: uuid.UUID,
    request: DocumentResearchUpdateRequest,
    user: CurrentUser,
    db: DbSession,
):
    """Update research notes, highlights, and tags on an uploaded document."""
    repo = DocumentRepository(db)
    doc = await repo.get_by_id(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    if doc.user_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    if request.notes is not None:
        doc.notes = request.notes
    if request.highlights is not None:
        doc.highlights = request.highlights
    if request.tags_list is not None:
        doc.tags_list = request.tags_list

    await db.flush()
    return APIResponse(data=DocumentDetailResponse.model_validate(doc), message="Research saved.")


@router.post("/{document_id}/chat")
async def chat_with_document(
    document_id: uuid.UUID,
    request: DocumentChatRequest,
    user: CurrentUser,
    db: DbSession,
):
    """Stream chat responses about an uploaded document using direct context injection."""
    from fastapi.responses import StreamingResponse
    import json
    from app.clients.gemini_client import gemini_client
    from app.clients.openrouter_client import openrouter_client

    repo = DocumentRepository(db)
    doc = await repo.get_by_id(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    if doc.user_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    doc_context = (
        f"--- USER UPLOADED LEGAL DOCUMENT: {doc.original_filename} ---\n"
        f"File Type: {doc.tag.value if hasattr(doc.tag, 'value') else doc.tag}\n"
        f"Case CNR: {doc.cnr or 'Not linked'}\n"
        f"Document Summary: {doc.summary or 'N/A'}\n\n"
        f"FULL EXTRACTED DOCUMENT TEXT:\n"
        f"{doc.extracted_text or 'No text content could be extracted.'}\n"
        f"--- END DOCUMENT ---"
    )

    system_prompt = (
        "You are SUITS AI, an elite legal assistant analyzing an uploaded legal document for an advocate.\n"
        "You have direct access to the full text of the uploaded document in the context.\n"
        "Cite specific clauses, paragraphs, dates, and party details accurately from the text.\n"
        "If asked for legal opinions, explain the legal implications under applicable Indian law."
    )

    async def event_generator():
        formatted_history = []
        if request.history:
            for m in request.history[-6:]:
                role = "user" if m.get("role") == "user" else "assistant"
                formatted_history.append({"role": role, "content": m.get("message", "")})

        try:
            ai_text = None
            try:
                ai_text = await gemini_client.generate_with_context(
                    system_prompt=system_prompt,
                    conversation_history=formatted_history,
                    user_message=request.message,
                    case_context=doc_context,
                )
            except Exception as gem_exc:
                logger.warning("gemini_doc_chat_fallback", error=str(gem_exc))

            if not ai_text:
                try:
                    ai_text = await openrouter_client.generate_with_context(
                        system_prompt=system_prompt,
                        conversation_history=formatted_history,
                        user_message=request.message,
                        case_context=doc_context,
                    )
                except Exception as or_exc:
                    logger.error("openrouter_doc_chat_failed", error=str(or_exc))

            if not ai_text:
                ai_text = "I could not analyze the uploaded document with the AI service at this time. Please check your API keys."

            # Stream tokens
            chunk_size = 20
            for i in range(0, len(ai_text), chunk_size):
                chunk = ai_text[i:i+chunk_size]
                payload = json.dumps({"token": chunk})
                yield f"data: {payload}\n\n"
                await asyncio.sleep(0.015)

            yield f"data: {json.dumps({'done': True, 'sources': [f'Uploaded Document: {doc.original_filename}']})}\n\n"
        except Exception as exc:
            err_payload = json.dumps({"error": str(exc), "done": True})
            yield f"data: {err_payload}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/{document_id}/download")
@router.get("/{document_id}/arraybuffer")
async def download_document(document_id: uuid.UUID, user: CurrentUser, db: DbSession):
    """Stream the original uploaded file inline (for PDF.js and preview)."""
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
        headers={"Content-Disposition": f'inline; filename="{doc.original_filename}"'},
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
