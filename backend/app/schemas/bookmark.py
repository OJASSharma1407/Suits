"""Bookmark schemas - DTOs for bookmark operations."""

import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class CreateBookmarkRequest(BaseModel):
    cnr: str = Field(min_length=16, max_length=16)
    title: str = "Untitled Case"


class BookmarkResponse(BaseModel):
    id: uuid.UUID
    cnr: str
    title: str
    bookmarked_at: datetime

    model_config = {"from_attributes": True}
