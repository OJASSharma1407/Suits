"""AI service - manages AI chat, prompt building, and conversation memory.

Implements the documented AI workflow:
User Question → Conversation Context → Case Metadata →
Order Markdown → Order AI → Prompt Builder → Gemini → Validated Response
"""

import json
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.clients.gemini_client import gemini_client
from app.models.message import Message, MessageRole
from app.repositories.conversation_repository import ConversationRepository
from app.repositories.cache_repository import CacheRepository
from app.schemas.chat import ChatResponse
from app.services.cache_service import cache_service
from app.prompts.system import MASTER_SYSTEM_PROMPT
from app.prompts.templates import build_case_context


class AIService:
    def __init__(self, db: AsyncSession) -> None:
        self.conversation_repo = ConversationRepository(db)
        self.cache_repo = CacheRepository(db)

    async def chat(
        self,
        conversation_id: uuid.UUID,
        user_message: str,
        order_filename: str | None = None,
    ) -> ChatResponse:
        """Process a user chat message and return an AI response."""
        # Load conversation
        conversation = await self.conversation_repo.get_by_id(conversation_id)
        if not conversation:
            from app.core.exceptions import NotFoundError
            raise NotFoundError("Conversation")

        cnr = conversation.cnr

        # Load conversation history
        messages = await self.conversation_repo.get_messages(conversation_id, limit=20)
        history = [{"role": m.role.value, "message": m.message} for m in messages]

        # Load case context from cache
        case_context = ""
        cached_case = await cache_service.get(f"case:{cnr}")
        if cached_case:
            case_context = build_case_context(cached_case)
        else:
            cached_pg = await self.cache_repo.get_cached_case(cnr)
            if cached_pg:
                case_data = json.loads(cached_pg.response_json)
                case_context = build_case_context(case_data)

        # Load order context if specified
        order_context = None
        if order_filename:
            # Try Order AI first, then Markdown
            cached_ai = await self.cache_repo.get_cached_ai(cnr, order_filename)
            if cached_ai:
                ai_data = json.loads(cached_ai.ai_json)
                order_context = json.dumps(ai_data, indent=2, default=str)

            if not order_context:
                cached_md = await self.cache_repo.get_cached_order(cnr, order_filename)
                if cached_md and cached_md.markdown:
                    order_context = cached_md.markdown

        # Save user message
        user_msg = Message(
            conversation_id=conversation_id,
            role=MessageRole.USER,
            message=user_message,
        )
        await self.conversation_repo.add_message(user_msg)

        # Call Gemini
        ai_response = await gemini_client.generate_with_context(
            system_prompt=MASTER_SYSTEM_PROMPT,
            conversation_history=history,
            user_message=user_message,
            case_context=case_context or "No case context available.",
            order_context=order_context,
        )

        # Save assistant message
        assistant_msg = Message(
            conversation_id=conversation_id,
            role=MessageRole.ASSISTANT,
            message=ai_response,
        )
        await self.conversation_repo.add_message(assistant_msg)

        # Generate suggested follow-up questions dynamically via Gemini
        suggested = await gemini_client.generate_suggested_questions(
            case_context=case_context or "",
            last_ai_response=ai_response,
            n=4,
        )

        return ChatResponse(
            answer=ai_response,
            suggested_questions=suggested,
            sources=[f"Indian Kanoon Document: {cnr}"],
            conversation_id=conversation_id,
        )
