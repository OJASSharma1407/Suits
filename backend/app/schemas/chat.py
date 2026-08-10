"""Chat schemas - DTOs for conversations and messages."""

import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class CreateConversationRequest(BaseModel):
    cnr: str = Field(min_length=1, max_length=50)
    title: str = "New Conversation"


class ConversationResponse(BaseModel):
    id: uuid.UUID
    cnr: str
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0

    model_config = {"from_attributes": True}


class ChatMessageRequest(BaseModel):
    message: str = Field(min_length=1, max_length=5000)
    order_filename: str | None = None  # Optional: context of a specific order


class MessageResponse(BaseModel):
    id: uuid.UUID
    role: str
    message: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatResponse(BaseModel):
    """Response from the AI chat endpoint."""
    answer: str
    suggested_questions: list[str] = []
    sources: list[str] = []
    conversation_id: uuid.UUID
