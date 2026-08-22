"""OpenRouter AI Client — configurable model with reasoning.

Handles prompt submission, response parsing, and token tracking for OpenRouter API.
The model and max token limits are set via OPENROUTER_MODEL and OPENROUTER_MAX_TOKENS in .env.
"""

from __future__ import annotations

import json
from typing import Any

import structlog
from openai import AsyncOpenAI

from app.core.config import settings

logger = structlog.get_logger()

MODEL = settings.openrouter_model
BASE_URL = "https://openrouter.ai/api/v1"

# Optional OpenRouter leaderboard headers
_OR_EXTRA_HEADERS = {
    "HTTP-Referer": "https://suits.app",
    "X-Title": "SUITS AI",
}


class OpenRouterClient:
    """Async client for OpenRouter's openai/gpt-oss-120b model."""

    def __init__(self) -> None:
        self._configured = False
        self.client: AsyncOpenAI | None = None

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _ensure_configured(self) -> bool:
        if self._configured:
            return True
        key = settings.openrouter_api_key
        if not key or key.strip() == "":
            logger.warning(
                "openrouter_api_key_missing",
                hint="Set OPENROUTER_API_KEY in .env — get one at openrouter.ai",
            )
            return False
        try:
            self.client = AsyncOpenAI(
                api_key=key,
                base_url=BASE_URL,
                default_headers=_OR_EXTRA_HEADERS,
            )
            self._configured = True
            return True
        except Exception as exc:
            logger.error("openrouter_config_error", error=str(exc))
            return False

    def _get_fallback_analysis(self, error_msg: str | None = None) -> str:
        return (
            "### AI Case Analysis Template\n\n"
            "#### 1. Executive Summary\n"
            "This matter is currently listed before the court. Based on official "
            "records, the petition raises significant questions requiring bench "
            "adjudication.\n\n"
            "#### 2. Procedural & Case History\n"
            "- **Registration & Filings**: Pleadings and relevant affidavits have "
            "been submitted.\n"
            "- **Listing History**: Hearings have taken place to examine interim "
            "relief and preliminary objections.\n\n"
            "#### 3. Primary Legal Issues & Statutory Framework\n"
            "- **Constitutional Provisions**: Issues concerning fundamental rights "
            "and writ jurisdiction may apply.\n"
            "- **Statutory Enactments**: Code of Civil Procedure and relevant acts "
            "as cited in pleadings.\n\n"
            "#### 4. Bench Directions & Orders\n"
            "- **Interim Orders**: Any interim protection or stay directives remain "
            "operative as per the last record.\n"
            "- **Judgments & Listings**: Final disposal depends on the conclusion "
            "of oral arguments.\n\n"
            "#### 5. Strategic Recommendations & Action Plan\n"
            "- Review upcoming hearing dates and verify order compliance.\n"
            "- Ensure all relevant interlocutory applications are indexed.\n\n"
            "*Note: This is a placeholder analysis. To enable live AI insights, "
            "please configure the OpenRouter API key in your workspace.*"
        )

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.3,
        max_output_tokens: int = 4096,
    ) -> str:
        """Generate a free-form text response with reasoning enabled."""
        if not self._ensure_configured():
            logger.warning("openrouter_unconfigured_using_fallback")
            return self._get_fallback_analysis()

        try:
            response = await self.client.chat.completions.create(  # type: ignore[union-attr]
                model=MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=temperature,
                max_tokens=max_output_tokens,
                extra_body={"reasoning": {"enabled": True}},
            )
            if response and response.choices and response.choices[0].message.content:
                logger.info("openrouter_generate_success", model=MODEL)
                return response.choices[0].message.content
        except Exception as exc:
            logger.error("openrouter_generate_failed", model=MODEL, error=str(exc))

        return self._get_fallback_analysis()

    async def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.2,
        max_output_tokens: int | None = None,
    ) -> dict[str, Any]:
        """Generate a structured JSON response with reasoning enabled."""
        if max_output_tokens is None:
            max_output_tokens = settings.openrouter_max_tokens
        if not self._ensure_configured():
            logger.warning("openrouter_unconfigured_json_fallback")
            return {}

        try:
            response = await self.client.chat.completions.create(  # type: ignore[union-attr]
                model=MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": system_prompt + "\nReturn ONLY valid JSON.",
                    },
                    {"role": "user", "content": user_prompt},
                ],
                temperature=temperature,
                max_tokens=max_output_tokens,
                response_format={"type": "json_object"},
                extra_body={"reasoning": {"enabled": True}},
            )
            if response and response.choices and response.choices[0].message.content:
                logger.info("openrouter_json_success", model=MODEL)
                return json.loads(response.choices[0].message.content)
        except Exception as exc:
            logger.error("openrouter_json_failed", model=MODEL, error=str(exc))

        return {}

    async def generate_with_context(
        self,
        system_prompt: str,
        conversation_history: list[dict[str, str]],
        user_message: str,
        case_context: str,
        order_context: str | None = None,
        temperature: float = 0.3,
    ) -> str:
        """Generate a response that preserves conversation history and reasoning.

        Reasoning details from previous turns are included in the message list
        so the model can continue its chain-of-thought across turns.
        """
        if not self._ensure_configured():
            logger.warning("openrouter_unconfigured_context_fallback")
            return self._get_fallback_analysis()

        # Build the system-level context block
        context_parts = [f"## Case Information\n{case_context}"]
        if order_context:
            context_parts.append(f"## Relevant Order\n{order_context}")
        context_parts.append(
            "## Response Instructions\n"
            "- Provide a comprehensive, detailed, and thorough legal analysis "
            "(do NOT provide brief or 1-sentence answers)\n"
            "- Structure your response with clear Markdown headings (##, ###), "
            "bullet lists, and bold text\n"
            "- Cover: 1. Executive Summary, 2. Procedural & Case History, "
            "3. Legal Arguments & Laws Cited, 4. Bench Directions & Orders, "
            "5. Next Steps\n"
            "- Cite specific dates, judges, acts, and party names from the case context\n"
            "- Keep the tone professional, objective, and authoritative"
        )
        context_block = "\n\n".join(context_parts)

        # Reconstruct the message list, preserving any reasoning_details that
        # were stored alongside prior assistant messages.
        messages: list[dict[str, Any]] = [
            {"role": "system", "content": system_prompt},
            {"role": "system", "content": context_block},
        ]

        for entry in conversation_history[-10:]:
            role = entry.get("role", "user")
            msg: dict[str, Any] = {
                "role": "user" if role == "user" else "assistant",
                "content": entry.get("message", ""),
            }
            # Preserve reasoning_details so the model can continue its thinking
            if role != "user" and entry.get("reasoning_details"):
                msg["reasoning_details"] = entry["reasoning_details"]
            messages.append(msg)

        messages.append({"role": "user", "content": user_message})

        try:
            response = await self.client.chat.completions.create(  # type: ignore[union-attr]
                model=MODEL,
                messages=messages,
                temperature=temperature,
                max_tokens=settings.openrouter_max_tokens,
                extra_body={"reasoning": {"enabled": True}},
            )
            if response and response.choices and response.choices[0].message.content:
                logger.info("openrouter_context_success", model=MODEL)
                return response.choices[0].message.content
        except Exception as exc:
            logger.error("openrouter_context_failed", model=MODEL, error=str(exc))

        return self._get_fallback_analysis()

    async def generate_suggested_questions(
        self,
        case_context: str,
        last_ai_response: str,
        n: int = 4,
    ) -> list[str]:
        """Generate short follow-up questions the user might want to ask next."""
        default_questions = [
            "What happened next in this case?",
            "What laws were cited?",
            "Summarize the court's reasoning.",
            "Who are the parties involved?",
        ]

        if not self._ensure_configured():
            return default_questions

        prompt = (
            f"Based on the case details below and the assistant's last response, "
            f"generate exactly {n} short, specific follow-up questions a user might "
            f"ask next.\n"
            f"Output ONLY a JSON array of strings with no extra text.\n\n"
            f"## Case Context\n{case_context}\n\n"
            f"## Last AI Response\n{last_ai_response}"
        )

        try:
            response = await self.client.chat.completions.create(  # type: ignore[union-attr]
                model=MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful assistant. Output JSON only.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.6,
                max_tokens=512,
                response_format={"type": "json_object"},
                extra_body={"reasoning": {"enabled": True}},
            )
            if response and response.choices and response.choices[0].message.content:
                content = json.loads(response.choices[0].message.content)
                questions: list[str] = []
                if isinstance(content, dict):
                    for val in content.values():
                        if isinstance(val, list):
                            questions = val
                            break
                elif isinstance(content, list):
                    questions = content
                if questions:
                    logger.info("openrouter_suggest_success", model=MODEL)
                    return [str(q) for q in questions[:n]]
        except Exception as exc:
            logger.warning("openrouter_suggest_failed", model=MODEL, error=str(exc))

        return default_questions

    async def extract_markdown_from_pdf(self, pdf_bytes: bytes) -> str:
        """PDF extraction stub — OpenRouter's text models don't support raw PDF bytes."""
        if not pdf_bytes:
            return "*No PDF content was available for this order.*"
        logger.warning("openrouter_pdf_extraction_unsupported")
        return (
            "*AI PDF extraction is not currently supported for this model. "
            "Please use the Kanoon document viewer to read the original judgment.*"
        )

    async def generate_with_context_stream(
        self,
        system_prompt: str,
        conversation_history: list[dict[str, str]],
        user_message: str,
        case_context: str,
        order_context: str | None = None,
        temperature: float = 0.3,
    ):
        """Streaming version of generate_with_context().

        Yields raw text tokens as they arrive from the model so callers can
        push them to a Server-Sent Events response immediately.  Yields an
        empty string as the final sentinel to signal completion.
        """
        if not self._ensure_configured():
            yield self._get_fallback_analysis()
            return

        # Build context block (identical logic to generate_with_context)
        context_parts = [f"## Case Information\n{case_context}"]
        if order_context:
            context_parts.append(f"## Relevant Order\n{order_context}")
        context_parts.append(
            "## Response Instructions\n"
            "- Provide a comprehensive, detailed, and thorough legal analysis "
            "(do NOT provide brief or 1-sentence answers)\n"
            "- Structure your response with clear Markdown headings (##, ###), "
            "bullet lists, and bold text\n"
            "- Cover: 1. Executive Summary, 2. Procedural & Case History, "
            "3. Legal Arguments & Laws Cited, 4. Bench Directions & Orders, "
            "5. Next Steps\n"
            "- Cite specific dates, judges, acts, and party names from the case context\n"
            "- Keep the tone professional, objective, and authoritative"
        )
        context_block = "\n\n".join(context_parts)

        messages: list[dict[str, Any]] = [
            {"role": "system", "content": system_prompt},
            {"role": "system", "content": context_block},
        ]
        for entry in conversation_history[-10:]:
            role = entry.get("role", "user")
            msg: dict[str, Any] = {
                "role": "user" if role == "user" else "assistant",
                "content": entry.get("message", ""),
            }
            if role != "user" and entry.get("reasoning_details"):
                msg["reasoning_details"] = entry["reasoning_details"]
            messages.append(msg)
        messages.append({"role": "user", "content": user_message})

        try:
            stream = await self.client.chat.completions.create(  # type: ignore[union-attr]
                model=MODEL,
                messages=messages,
                temperature=temperature,
                max_tokens=settings.openrouter_max_tokens,
                stream=True,
                extra_body={"reasoning": {"enabled": True}},
            )
            async for chunk in stream:
                delta = chunk.choices[0].delta if chunk.choices else None
                if delta and delta.content:
                    yield delta.content
            logger.info("openrouter_stream_complete", model=MODEL)
        except Exception as exc:
            logger.error("openrouter_stream_failed", model=MODEL, error=str(exc))
            yield self._get_fallback_analysis()


# Singleton
openrouter_client = OpenRouterClient()
