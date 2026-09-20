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


def _generate_suggested_questions(
    case_context: str,
    order_context: str | None,
    ai_response: str,
    n: int = 4,
) -> list[str]:
    """Generate follow-up question chips locally — zero API calls.

    Inspects available case fields, order context, and the last AI response
    for legal keywords, then selects the most relevant questions from a
    curated pool.
    """
    ctx = f"{case_context or ''} {order_context or ''} {ai_response or ''}".lower()
    pool: list[str] = []

    # --- Criminal law signals ---
    if any(kw in ctx for kw in ("bail", "fir", "arrest", "remand", "custody")):
        pool.extend([
            "What are the grounds for granting or denying bail in this case?",
            "Are there any conditions imposed on the bail order?",
            "What is the FIR status and investigation timeline?",
        ])
    if any(kw in ctx for kw in ("ipc", "bns", "crpc", "bnss", "section 302", "section 420", "cheating", "murder", "theft")):
        pool.append("Which criminal statutes and sections are invoked, and what are the penalties?")

    # --- Constitutional / Writ signals ---
    if any(kw in ctx for kw in ("writ", "article 226", "article 32", "fundamental right", "constitutional")):
        pool.extend([
            "What fundamental rights are alleged to be violated?",
            "What is the scope of judicial review applicable here?",
        ])

    # --- Civil / Contract signals ---
    if any(kw in ctx for kw in ("contract", "agreement", "arbitration", "specific performance", "damages")):
        pool.extend([
            "What are the key contractual obligations in dispute?",
            "Is the arbitration clause enforceable under Section 11?",
        ])

    # --- Precedent / Citation signals ---
    if any(kw in ctx for kw in ("precedent", "cited", "ratio decidendi", "relied upon", "distinguished")):
        pool.append("What precedents did the court rely upon, and are they binding?")

    # --- Statutes / Acts signals ---
    if any(kw in ctx for kw in ("act", "section", "statute", "ordinance", "regulation", "rule")):
        pool.append("List all statutes and specific sections applied by the court.")

    # --- Outcome / Directions signals ---
    if any(kw in ctx for kw in ("dismissed", "allowed", "disposed", "granted", "directed", "ordered", "relief")):
        pool.extend([
            "What specific directions or relief were ordered by the Court?",
            "What is the practical impact of this order on the parties?",
        ])

    # --- Hearing / Timeline signals ---
    if any(kw in ctx for kw in ("next hearing", "adjourned", "listed", "hearing date")):
        pool.append("What is the next hearing date and what is expected to happen?")

    # --- Evidence signals ---
    if any(kw in ctx for kw in ("evidence", "witness", "exhibit", "document", "affidavit")):
        pool.append("What key evidence or documents has the court considered?")

    # --- Always-relevant fallbacks ---
    fallbacks = [
        "What is the ratio decidendi established in this case?",
        "Explain the court's substantive reasoning on the merits.",
        "What are the key legal issues before the court?",
        "Summarize the arguments made by both parties.",
    ]

    # De-duplicate while preserving order, then fill with fallbacks
    seen: set[str] = set()
    result: list[str] = []
    for q in pool + fallbacks:
        if q not in seen:
            seen.add(q)
            result.append(q)
        if len(result) >= n:
            break

    return result[:n]




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

        # For general (non-case) conversations, skip case/order context loading
        if not cnr or cnr.upper() == "GENERAL":
            return cnr, None, history, ""

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

        # Determine if this is a general legal inquiry (no case context)
        is_general = not cnr or cnr.upper() == "GENERAL"

        # RAG Precedent Search via Indian Kanoon API
        sources = [] if is_general else [f"Indian Kanoon Record: {cnr}"]
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

        # Generate response via OpenRouter Nemotron 3 Ultra (with Gemini fallback)
        try:
            ai_response = await openrouter_client.generate_with_context(
                system_prompt=MASTER_SYSTEM_PROMPT,
                conversation_history=history,
                user_message=user_message,
                case_context=case_context if case_context else ("This is a general legal inquiry. No specific case is loaded. Answer using your general legal knowledge about Indian law." if is_general else "No case context available."),
                order_context=order_context,
            )
            if not ai_response or not ai_response.strip():
                raise RuntimeError("Empty response from OpenRouter")
        except Exception as or_err:
            logger.warning("openrouter_generate_failed_using_gemini", error=str(or_err))
            ai_response = await gemini_client.generate_with_context(
                system_prompt=MASTER_SYSTEM_PROMPT,
                conversation_history=history,
                user_message=user_message,
                case_context=case_context if case_context else ("This is a general legal inquiry. No specific case is loaded. Answer using your general legal knowledge about Indian law." if is_general else "No case context available."),
                order_context=order_context,
            )

        assistant_msg = Message(
            conversation_id=conversation_id,
            role=MessageRole.ASSISTANT,
            message=ai_response,
        )
        await self.conversation_repo.add_message(assistant_msg)

        suggested = _generate_suggested_questions(
            case_context=case_context,
            order_context=order_context,
            ai_response=ai_response,
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
            # Verify conversation still exists before inserting to avoid FK failure
            verify = await self.conversation_repo.get_by_id(conversation_id)
            if not verify:
                from app.core.exceptions import NotFoundError
                raise NotFoundError("Conversation")
            user_msg = Message(
                conversation_id=conversation_id,
                role=MessageRole.USER,
                message=user_message,
            )
            await self.conversation_repo.add_message(user_msg)

            # Determine if this is a general legal inquiry
            is_general = not cnr or cnr.upper() == "GENERAL"
            effective_context = case_context if case_context else ("This is a general legal inquiry. No specific case is loaded. Answer using your general legal knowledge about Indian law." if is_general else "No case context available.")

            # Stream tokens via OpenRouter (gpt-oss-120b) with Gemini fallback
            full_response: list[str] = []
            try:
                async for token in openrouter_client.generate_with_context_stream(
                    system_prompt=MASTER_SYSTEM_PROMPT,
                    conversation_history=history,
                    user_message=user_message,
                    case_context=effective_context,
                    order_context=order_context,
                ):
                    if token:
                        full_response.append(token)
                        chunk_json = json.dumps({"token": token})
                        yield f"data: {chunk_json}\n\n"
                if not full_response:
                    raise RuntimeError("OpenRouter produced empty stream")
            except Exception as stream_err:
                logger.warning("openrouter_stream_failed_using_gemini", error=str(stream_err))
                async for token in gemini_client.generate_with_context_stream(
                    system_prompt=MASTER_SYSTEM_PROMPT,
                    conversation_history=history,
                    user_message=user_message,
                    case_context=effective_context,
                    order_context=order_context,
                ):
                    if token:
                        full_response.append(token)
                        chunk_json = json.dumps({"token": token})
                        yield f"data: {chunk_json}\n\n"

            # Save completed assistant message
            ai_response = "".join(full_response)
            assistant_msg = Message(
                conversation_id=conversation_id,
                role=MessageRole.ASSISTANT,
                message=ai_response,
            )
            await self.conversation_repo.add_message(assistant_msg)

            # Fast contextual suggested questions (zero API calls)
            suggested = _generate_suggested_questions(
                case_context=effective_context,
                order_context=order_context,
                ai_response=ai_response,
            )

            done_payload = json.dumps({"done": True, "suggested_questions": suggested})
            yield f"data: {done_payload}\n\n"

        except Exception as exc:
            error_payload = json.dumps({"error": str(exc)})
            yield f"data: {error_payload}\n\n"
