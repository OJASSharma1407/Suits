"""Bookmark schemas - DTOs for bookmark operations."""

import uuid
from datetime import datetime
from pydantic import BaseModel, Field, field_validator


class CreateBookmarkRequest(BaseModel):
    cnr: str = Field(min_length=1, max_length=64)
    title: str = Field(default="Untitled Case", max_length=500)

    @field_validator("cnr", mode="before")
    @classmethod
    def clean_cnr(cls, v: any) -> str:
        if v is None or not str(v).strip():
            raise ValueError("CNR cannot be empty")
        return str(v).strip()

    @field_validator("title", mode="before")
    @classmethod
    def clean_title(cls, v: any) -> str:
        if v is None or not str(v).strip():
            return "Untitled Case"
        return str(v).strip()



class BookmarkResponse(BaseModel):
    id: uuid.UUID
    cnr: str
    title: str
    bookmarked_at: datetime

    model_config = {"from_attributes": True}
