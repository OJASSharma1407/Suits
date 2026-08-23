"""AI service - manages AI chat, prompt building, and conversation memory using Indian Kanoon records."""

import json
import uuid
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.clients.gemini_client import gemini_client
from app.clients.openrouter_client import openrouter_client
from app.models.message import Message, MessageRole
from app.repositories.conversation_repository import ConversationRepository
from app.repositories.cache_repository import CacheRepository
from app.schemas.chat import ChatResponse
from app.services.cache_service import cache_service
from app.prompts.system import MASTER_SYSTEM_PROMPT
from app.prompts.templates import build_case_context

logger = structlog.get_logger()


class AIService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
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
        target_doc = order_filename or cnr
        if target_doc:
            cached_ai = await self.cache_repo.get_cached_ai(cnr, target_doc)
            if cached_ai and cached_ai.ai_json:
                try:
                    ai_data = json.loads(cached_ai.ai_json)
                    if ai_data.get("extractionConfidence", 0.0) > 0.0:
                        order_context = json.dumps(ai_data, indent=2, default=str)
                except Exception:
                    pass
            if not order_context:
                cached_md = await self.cache_repo.get_cached_order(cnr, target_doc)
                if cached_md and cached_md.markdown and not cached_md.markdown.startswith("*"):
                    order_context = cached_md.markdown

            # Proactively fetch markdown from Indian Kanoon if we don't have any order context yet
            if not order_context:
                from app.services.order_service import OrderService
                order_service = OrderService(self.db)
                md_response = await order_service.get_markdown(cnr, target_doc)
                if md_response and md_response.markdown and not md_response.markdown.startswith("*"):
                    order_context = md_response.markdown

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

        # RAG Precedent Search via Indian Kanoon API
        sources = [f"Indian Kanoon Record: {cnr}"]
        try:
            from app.clients.kanoon_client import kanoon_client
            kanoon_results = await kanoon_client.search_docs(query=user_message.strip(), pagenum=1)
            docs = kanoon_results.get("docs", []) if isinstance(kanoon_results, dict) else []
            if docs:
                precedent_items = []
                for d in docs[:3]:
                    t_id = d.get("tid")
                    t_title = d.get("title", "")
                    import re
                    t_title = re.sub(r'<[^>]+>', '', str(t_title))
                    t_court = d.get("docsource", "Indian Kanoon")
                    precedent_items.append(f"- **{t_title}** ({t_court}) [Kanoon TID: {t_id}]")
                    sources.append(f"Indian Kanoon: {t_title} (ID: {t_id})")
                if precedent_items:
                    case_context = (case_context or "") + "\n\n### Relevant Indian Kanoon Legal Precedents & Citations:\n" + "\n".join(precedent_items)
        except Exception:
            pass

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
            sources=sources,
            conversation_id=conversation_id,
        )

    async def chat_stream(
        self,
        conversation_id: uuid.UUID,
        user_message: str,
        order_filename: str | None = None,
    ) -> AsyncGenerator[str, None]:
        """Stream AI response tokens as Server-Sent Events."""
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

            # RAG Precedent Search via Indian Kanoon API
            try:
                from app.clients.kanoon_client import kanoon_client
                kanoon_results = await kanoon_client.search_docs(query=user_message.strip(), pagenum=1)
                docs = kanoon_results.get("docs", []) if isinstance(kanoon_results, dict) else []
                if docs:
                    precedent_items = []
                    for d in docs[:3]:
                        t_id = d.get("tid")
                        t_title = d.get("title", "")
                        import re
                        t_title = re.sub(r'<[^>]+>', '', str(t_title))
                        t_court = d.get("docsource", "Indian Kanoon")
                        precedent_items.append(f"- **{t_title}** ({t_court}) [Kanoon TID: {t_id}]")
                    if precedent_items:
                        case_context = (case_context or "") + "\n\n### Relevant Indian Kanoon Legal Precedents & Citations:\n" + "\n".join(precedent_items)
            except Exception:
                pass

            # Stream tokens and accumulate the full response (Gemini with OpenRouter fallback)
            full_response: list[str] = []
            try:
                async for token in gemini_client.generate_with_context_stream(
                    system_prompt=MASTER_SYSTEM_PROMPT,
                    conversation_history=history,
                    user_message=user_message,
                    case_context=case_context or "No case context available.",
                    order_context=order_context,
                ):
                    full_response.append(token)
                    safe = token.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n")
                    yield f'data: {{"token": "{safe}"}}\n\n'
            except Exception as stream_err:
                logger.warning("gemini_stream_failed_using_openrouter", error=str(stream_err))
                async for token in openrouter_client.generate_with_context_stream(
                    system_prompt=MASTER_SYSTEM_PROMPT,
                    conversation_history=history,
                    user_message=user_message,
                    case_context=case_context or "No case context available.",
                    order_context=order_context,
                ):
                    full_response.append(token)
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

            # Generate suggested questions
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
