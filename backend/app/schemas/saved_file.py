"""SavedFile schemas - DTOs for Files & Legal Research Vault operations."""

import uuid
from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field


class HighlightItem(BaseModel):
    id: str
    pageNum: int
    color: str = "gold"  # gold, green, purple, blue
    text: str
    rects: list[dict[str, Any]] = []
    comment: str | None = None
    createdAt: str | None = None


class SaveFileRequest(BaseModel):
    cnr: str = Field(min_length=1, max_length=64)
    filename: str = Field(min_length=1, max_length=255)
    case_title: str = "Court Order"
    court_name: str = "Court Record"
    order_date: str = "Record Copy"
    notes: str = ""
    highlights: list[dict[str, Any]] = []
    tags: list[str] = []


class UpdateFileRequest(BaseModel):
    notes: str | None = None
    highlights: list[dict[str, Any]] | None = None
    tags: list[str] | None = None
    case_title: str | None = None
    court_name: str | None = None
    order_date: str | None = None


class SavedFileResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    cnr: str
    filename: str
    case_title: str
    court_name: str
    order_date: str
    notes: str | None = ""
    highlights: list[dict[str, Any]] | None = []
    tags: list[str] | None = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SavedFileListResponse(BaseModel):
    items: list[SavedFileResponse]
    total: int
