"""Chat router - Conversations, Messages, AI Chat."""

import uuid
from fastapi import APIRouter

from app.dependencies.auth import CurrentUser, DbSession
from app.schemas.chat import (
    CreateConversationRequest, ConversationResponse, ChatMessageRequest,
    MessageResponse, ChatResponse,
)
from app.schemas.common import APIResponse
from app.models.conversation import Conversation
from app.repositories.conversation_repository import ConversationRepository
from app.services.ai_service import AIService
from app.core.exceptions import NotFoundError, ForbiddenError

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/conversations", response_model=APIResponse[ConversationResponse])
async def create_conversation(request: CreateConversationRequest, user: CurrentUser, db: DbSession):
    repo = ConversationRepository(db)
    conversation = Conversation(user_id=user.id, cnr=request.cnr, title=request.title)
    created = await repo.create(conversation)
    return APIResponse(data=ConversationResponse.model_validate(created), message="Conversation created.")


@router.get("/conversations", response_model=APIResponse[list[ConversationResponse]])
async def list_conversations(user: CurrentUser, db: DbSession):
    repo = ConversationRepository(db)
    conversations = await repo.get_user_conversations(user.id)
    return APIResponse(data=[ConversationResponse.model_validate(c) for c in conversations])


@router.get("/conversations/{conversation_id}", response_model=APIResponse[ConversationResponse])
async def get_conversation(conversation_id: uuid.UUID, user: CurrentUser, db: DbSession):
    repo = ConversationRepository(db)
    conversation = await repo.get_by_id(conversation_id)
    if not conversation:
        raise NotFoundError("Conversation")
    if conversation.user_id != user.id:
        raise ForbiddenError()
    return APIResponse(data=ConversationResponse.model_validate(conversation))


@router.delete("/conversations/{conversation_id}", response_model=APIResponse)
async def delete_conversation(conversation_id: uuid.UUID, user: CurrentUser, db: DbSession):
    repo = ConversationRepository(db)
    conversation = await repo.get_by_id(conversation_id)
    if not conversation:
        raise NotFoundError("Conversation")
    if conversation.user_id != user.id:
        raise ForbiddenError()
    await repo.delete_conversation(conversation_id)
    return APIResponse(message="Conversation deleted.")


@router.get("/conversations/{conversation_id}/messages", response_model=APIResponse[list[MessageResponse]])
async def get_messages(conversation_id: uuid.UUID, user: CurrentUser, db: DbSession):
    repo = ConversationRepository(db)
    conversation = await repo.get_by_id(conversation_id)
    if not conversation:
        raise NotFoundError("Conversation")
    if conversation.user_id != user.id:
        raise ForbiddenError()
    messages = await repo.get_messages(conversation_id)
    return APIResponse(data=[MessageResponse.model_validate(m) for m in messages])


@router.post("/conversations/{conversation_id}/messages", response_model=APIResponse[ChatResponse])
async def send_message(
    conversation_id: uuid.UUID,
    request: ChatMessageRequest,
    user: CurrentUser,
    db: DbSession,
):
    repo = ConversationRepository(db)
    conversation = await repo.get_by_id(conversation_id)
    if not conversation:
        raise NotFoundError("Conversation")
    if conversation.user_id != user.id:
        raise ForbiddenError()

    ai_service = AIService(db)
    response = await ai_service.chat(conversation_id, request.message, request.order_filename)
    return APIResponse(data=response)
