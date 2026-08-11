"""AI service - manages AI chat, prompt building, and conversation memory.

Implements the documented AI workflow:
User Question → Conversation Context → Case Metadata →
Order Markdown → Order AI → Prompt Builder → OpenRouter → Validated Response
"""

import json
import uuid
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from app.clients.openrouter_client import openrouter_client
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

    async def _load_context(
        self,
        conversation_id: uuid.UUID,
        order_filename: str | None = None,
    ) -> tuple[str, str | None, list[dict], str]:
        """Shared helper — loads conversation history, case context and order context."""
        conversation = await self.conversation_repo.get_by_id(conversation_id)
        if not conversation:
            from app.core.exceptions import NotFoundError
            raise NotFoundError("Conversation")

        cnr = conversation.cnr

        messages = await self.conversation_repo.get_messages(conversation_id, limit=20)
        history = [{"role": m.role.value, "message": m.message} for m in messages]

        case_context = ""
        cached_case = await cache_service.get(f"case:{cnr}")
        if cached_case:
            case_context = build_case_context(cached_case)
        else:
            cached_pg = await self.cache_repo.get_cached_case(cnr)
            if cached_pg:
                case_data = json.loads(cached_pg.response_json)
                case_context = build_case_context(case_data)

        order_context = None
        if order_filename:
            cached_ai = await self.cache_repo.get_cached_ai(cnr, order_filename)
            if cached_ai:
                ai_data = json.loads(cached_ai.ai_json)
                order_context = json.dumps(ai_data, indent=2, default=str)
            if not order_context:
                cached_md = await self.cache_repo.get_cached_order(cnr, order_filename)
                if cached_md and cached_md.markdown:
                    order_context = cached_md.markdown

        return cnr, order_context, history, case_context

    async def chat(
        self,
        conversation_id: uuid.UUID,
        user_message: str,
        order_filename: str | None = None,
    ) -> ChatResponse:
        """Process a user chat message and return a complete AI response (non-streaming)."""
        cnr, order_context, history, case_context = await self._load_context(
            conversation_id, order_filename
        )

        user_msg = Message(
            conversation_id=conversation_id,
            role=MessageRole.USER,
            message=user_message,
        )
        await self.conversation_repo.add_message(user_msg)

        ai_response = await openrouter_client.generate_with_context(
            system_prompt=MASTER_SYSTEM_PROMPT,
            conversation_history=history,
            user_message=user_message,
            case_context=case_context or "No case context available.",
            order_context=order_context,
        )

        assistant_msg = Message(
            conversation_id=conversation_id,
            role=MessageRole.ASSISTANT,
            message=ai_response,
        )
        await self.conversation_repo.add_message(assistant_msg)

        suggested = await openrouter_client.generate_suggested_questions(
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

    async def chat_stream(
        self,
        conversation_id: uuid.UUID,
        user_message: str,
        order_filename: str | None = None,
    ) -> AsyncGenerator[str, None]:
        """Stream AI response tokens as Server-Sent Events.

        Yields SSE-formatted strings:
          - ``data: {"token": "<text>"}\\n\\n``  for each token chunk
          - ``data: {"done": true, "suggested_questions": [...]}\\n\\n``  at the end
          - ``data: {"error": "<msg>"}\\n\\n``  on failure
        """
        try:
            cnr, order_context, history, case_context = await self._load_context(
                conversation_id, order_filename
            )

            # Persist user message immediately so it appears in history
            user_msg = Message(
                conversation_id=conversation_id,
                role=MessageRole.USER,
                message=user_message,
            )
            await self.conversation_repo.add_message(user_msg)

            # Stream tokens and accumulate the full response
            full_response: list[str] = []
            async for token in openrouter_client.generate_with_context_stream(
                system_prompt=MASTER_SYSTEM_PROMPT,
                conversation_history=history,
                user_message=user_message,
                case_context=case_context or "No case context available.",
                order_context=order_context,
            ):
                full_response.append(token)
                # Escape newlines inside the JSON string value
                safe = token.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n")
                yield f'data: {{"token": "{safe}"}}\n\n'

            # Save completed assistant message
            ai_response = "".join(full_response)
            assistant_msg = Message(
                conversation_id=conversation_id,
                role=MessageRole.ASSISTANT,
                message=ai_response,
            )
            await self.conversation_repo.add_message(assistant_msg)

            # Generate suggested questions (non-streaming, small call)
            suggested = await openrouter_client.generate_suggested_questions(
                case_context=case_context or "",
                last_ai_response=ai_response,
                n=4,
            )

            done_payload = json.dumps({"done": True, "suggested_questions": suggested})
            yield f"data: {done_payload}\n\n"

        except Exception as exc:
            error_payload = json.dumps({"error": str(exc)})
            yield f"data: {error_payload}\n\n"
