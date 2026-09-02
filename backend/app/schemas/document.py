"""Document schemas - DTOs for user document upload, listing, and response."""

import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

from app.models.user_document import DocumentStatus, DocumentTag


class DocumentUploadResponse(BaseModel):
    """Returned immediately after a file is accepted for processing."""
    id: uuid.UUID
    original_filename: str
    file_size: int
    mime_type: str
    tag: DocumentTag
    cnr: Optional[str] = None
    status: DocumentStatus
    created_at: datetime

    model_config = {"from_attributes": True}


class DocumentListItem(BaseModel):
    """Compact document representation for list views."""
    id: uuid.UUID
    original_filename: str
    file_size: int
    mime_type: str
    tag: DocumentTag
    cnr: Optional[str] = None
    status: DocumentStatus
    summary: Optional[str] = None
    ai_analysis: Optional[dict] = None
    notes: Optional[str] = None
    highlights: Optional[list] = None
    tags_list: Optional[list] = None
    chunk_count: int
    page_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DocumentDetailResponse(BaseModel):
    """Full document detail including extracted text and structured AI analysis."""
    id: uuid.UUID
    original_filename: str
    file_size: int
    mime_type: str
    tag: DocumentTag
    cnr: Optional[str] = None
    status: DocumentStatus
    error_message: Optional[str] = None
    summary: Optional[str] = None
    extracted_text: Optional[str] = None
    ai_analysis: Optional[dict] = None
    notes: Optional[str] = None
    highlights: Optional[list] = None
    tags_list: Optional[list] = None
    chunk_count: int
    page_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DocumentResearchUpdateRequest(BaseModel):
    """Update research notes, highlights, and tags for a user document."""
    notes: Optional[str] = None
    highlights: Optional[list] = None
    tags_list: Optional[list] = None


class DocumentChatRequest(BaseModel):
    """Chat message query regarding a specific user document."""
    message: str
    history: Optional[list[dict]] = None


class DocumentStatsResponse(BaseModel):
    """Aggregate stats for a user's document library."""
    total_documents: int
    indexed_documents: int
    total_storage_bytes: int


class SemanticSearchRequest(BaseModel):
    query: str
    cnr: Optional[str] = None
    top_k: int = 5


class SemanticSearchResult(BaseModel):
    score: float
    chunk_text: str
    document_id: uuid.UUID
    original_filename: str
    tag: DocumentTag
    cnr: Optional[str] = None
