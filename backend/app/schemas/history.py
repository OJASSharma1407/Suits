"""History schemas - DTOs for case view and search history operations."""

import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class RecordCaseViewRequest(BaseModel):
    cnr: str = Field(min_length=1, max_length=64)
    title: str = "Untitled Case"


class CaseViewResponse(BaseModel):
    id: uuid.UUID
    cnr: str
    title: str
    viewed_at: datetime

    model_config = {"from_attributes": True}
