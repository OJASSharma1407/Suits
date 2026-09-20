"""Gemini AI Client.

Handles prompt submission, response parsing, and token tracking with automatic model fallback.
Uses Google GenAI SDK (google-genai >= 2.0) with async support via client.aio.models.

NOTE: This client does NOT fall back to OpenRouter. If all Gemini models fail, it
returns an empty/placeholder response and logs the error.
"""

import asyncio
import json
import re
import time
from typing import Any

import structlog
from google import genai
from google.genai import types

from app.core.config import settings

logger = structlog.get_logger()


class GeminiClient:
    """Client for Google Gemini AI API (google-genai >= 2.0)."""

    def __init__(self) -> None:
        self._configured = False
        self.client: genai.Client | None = None
        self._credits_depleted_until: float = 0.0

    def _is_credits_depleted(self) -> bool:
        return time.monotonic() < self._credits_depleted_until

    def _mark_credits_depleted(self) -> None:
        self._credits_depleted_until = time.monotonic() + 600.0  # 10 minutes cooldown
        logger.warning(
            "gemini_prepayment_depleted",
            hint="Google Gemini prepayment credits are depleted. Will retry in 10 minutes.",
        )

    def _ensure_configured(self) -> bool:
        if not self._configured:
            key = settings.gemini_api_key
            if not key or key.strip() == "":
                logger.warning("gemini_api_key_missing", hint="Set GEMINI_API_KEY in .env")
                return False
            try:
                self.client = genai.Client(api_key=key)
                self._configured = True
                return True
            except Exception as exc:
                logger.error("gemini_config_error", error=str(exc))
                return False
        return self._configured

    def _get_fallback_analysis(self, error_msg: str | None = None) -> str:
        return (
            "### AI Case Analysis Unavailable\n\n"
            "The Gemini AI service is currently unavailable. "
            "Please try again later or check your GEMINI_API_KEY / GROQ_API_KEY configuration.\n\n"
            f"*Error: {error_msg}*" if error_msg else
            "The AI service is currently unavailable. Please try again later."
        )

    def _model_candidates(self) -> list[str]:
        """Return ordered list of verified healthy models to try."""
        primary = settings.gemini_model or "gemini-3.6-flash"
        candidates = [primary, "gemini-3.6-flash", "gemini-3-flash-preview"]
        seen: set[str] = set()
        return [m for m in candidates if not (m in seen or seen.add(m))]

    async def _groq_fallback_generate(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.3,
        max_output_tokens: int = 4096,
    ) -> str:
        """Fallback to Groq Cloud (openai/gpt-oss-120b) when Gemini is unavailable."""
        logger.info("gemini_triggering_groq_fallback_generate")
        try:
            from app.clients.groq_client import groq_client
            result = await groq_client.generate(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=temperature,
                max_output_tokens=max_output_tokens,
            )
            if result and result.strip():
                logger.info("groq_fallback_generate_success", chars=len(result))
                return result
        except Exception as exc:
            logger.error("gemini_groq_fallback_generate_failed", error=str(exc))
        return self._get_fallback_analysis()

    async def _groq_fallback_json(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.2,
    ) -> dict[str, Any] | list[Any]:
        """Fallback to Groq Cloud (openai/gpt-oss-120b) for structured JSON when Gemini fails."""
        logger.info("gemini_triggering_groq_fallback_json")
        try:
            from app.clients.groq_client import groq_client
            result = await groq_client.generate_json(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=temperature,
            )
            if result is not None:
                logger.info("groq_fallback_json_success")
                return result
        except Exception as exc:
            logger.error("gemini_groq_fallback_json_failed", error=str(exc))
        return {}

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.3,
        max_output_tokens: int = 4096,
    ) -> str:
        """Send a prompt to Gemini and return the text response.

        Falls back to Groq Cloud if Gemini credits are depleted or models fail.
        Does NOT fall back to OpenRouter.
        """
        if not self._ensure_configured():
            logger.warning("gemini_generate_skipped_not_configured_trying_groq")
            return await self._groq_fallback_generate(system_prompt, user_prompt, temperature, max_output_tokens)

        if self._is_credits_depleted():
            logger.warning("gemini_generate_skipped_credits_depleted_trying_groq")
            return await self._groq_fallback_generate(system_prompt, user_prompt, temperature, max_output_tokens)

        last_error = ""
        should_break_candidates = False
        for model_name in self._model_candidates():
            if should_break_candidates:
                break
            for attempt in range(2):
                try:
                    coro = self.client.aio.models.generate_content(  # type: ignore[union-attr]
                        model=model_name,
                        contents=user_prompt,
                        config=types.GenerateContentConfig(
                            system_instruction=system_prompt,
                            temperature=temperature,
                            max_output_tokens=max_output_tokens,
                        ),
                    )
                    response = await asyncio.wait_for(coro, timeout=25.0)
                    if response and response.text:
                        logger.info("gemini_success", model=model_name, attempt=attempt)
                        return response.text
                except Exception as exc:
                    last_error = str(exc)
                    logger.warning("gemini_model_try_failed", model=model_name, attempt=attempt, error=last_error)
                    if "402" in last_error or "prepayment credits are depleted" in last_error.lower():
                        self._mark_credits_depleted()
                        should_break_candidates = True
                        break
                    if ("503" in last_error or "UNAVAILABLE" in last_error or isinstance(exc, asyncio.TimeoutError)) and attempt == 0:
                        await asyncio.sleep(1.0)
                        continue
                    break

        logger.error("gemini_all_models_failed_trying_groq", error=last_error)
        return await self._groq_fallback_generate(system_prompt, user_prompt, temperature, max_output_tokens)

    async def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.2,
        max_output_tokens: int = 8192,
    ) -> dict[str, Any] | list[Any]:
        """Send a prompt to Gemini and return a parsed JSON dict.

        Uses response_mime_type='application/json' to guarantee valid JSON output.
        Falls back to Groq Cloud if Gemini credits are depleted or models fail.
        Does NOT fall back to OpenRouter.
        """
        if not self._ensure_configured():
            logger.warning("gemini_generate_json_skipped_not_configured_trying_groq")
            return await self._groq_fallback_json(system_prompt, user_prompt, temperature)

        if self._is_credits_depleted():
            logger.warning("gemini_generate_json_skipped_credits_depleted_trying_groq")
            return await self._groq_fallback_json(system_prompt, user_prompt, temperature)

        last_error = ""
        should_break_candidates = False
        for model_name in self._model_candidates():
            if should_break_candidates:
                break
            for attempt in range(2):
                try:
                    coro = self.client.aio.models.generate_content(  # type: ignore[union-attr]
                        model=model_name,
                        contents=user_prompt,
                        config=types.GenerateContentConfig(
                            system_instruction=system_prompt,
                            temperature=temperature,
                            max_output_tokens=max_output_tokens,
                            response_mime_type="application/json",
                        ),
                    )
                    response = await asyncio.wait_for(coro, timeout=25.0)
                    if response and response.text:
                        logger.info("gemini_json_success", model=model_name, attempt=attempt)
                        raw = response.text.strip()
                        if raw.startswith("```"):
                            raw = re.sub(r"^```(?:json)?\s*", "", raw)
                            raw = re.sub(r"\s*```$", "", raw)
                        return json.loads(raw)
                except Exception as exc:
                    last_error = str(exc)
                    logger.warning("gemini_json_model_failed", model=model_name, attempt=attempt, error=last_error)
                    if "402" in last_error or "prepayment credits are depleted" in last_error.lower():
                        self._mark_credits_depleted()
                        should_break_candidates = True
                        break
                    if ("503" in last_error or "UNAVAILABLE" in last_error or isinstance(exc, asyncio.TimeoutError)) and attempt == 0:
                        await asyncio.sleep(1.0)
                        continue
                    break

        logger.error("gemini_json_all_models_failed_trying_groq", error=last_error)
        return await self._groq_fallback_json(system_prompt, user_prompt, temperature)

    async def extract_markdown_from_pdf(self, pdf_bytes: bytes) -> str:
        """Extract and format court order text from PDF bytes using Gemini's vision capability.

        Returns an error string if Gemini is unavailable — does NOT fall back to OpenRouter.
        """
        if not self._ensure_configured():
            logger.warning("gemini_api_key_unconfigured_pdf_fallback")
            return "*AI PDF extraction is unavailable: Gemini API key is not configured.*"

        if not pdf_bytes:
            return "*No PDF content was available for this order.*"

        prompt_text = (
            "You are a legal document transcription expert. "
            "The attached document is an official Indian court order in PDF format.\n\n"
            "Your task:\n"
            "1. Transcribe the FULL and COMPLETE text of the order faithfully.\n"
            "2. Format the output as clean, well-structured Markdown.\n"
            "3. Use `#` headings for the court name, `##` for the case title, "
            "`###` for sections like CORAM, ORDER, etc.\n"
            "4. Preserve all party names, dates, judge names, and legal citations exactly as written.\n"
            "5. Use `**bold**` for party names and judge names.\n"
            "6. Use numbered lists for court directions/orders.\n"
            "7. Do NOT summarize — transcribe the complete text.\n"
            "8. If the document is not a court order, state that clearly."
        )

        pdf_part = types.Part.from_bytes(data=pdf_bytes, mime_type="application/pdf")

        last_error = ""
        for model_name in self._model_candidates():
            try:
                response = await self.client.aio.models.generate_content(  # type: ignore[union-attr]
                    model=model_name,
                    contents=[prompt_text, pdf_part],
                    config=types.GenerateContentConfig(
                        temperature=0.1,
                        max_output_tokens=8192,
                    ),
                )
                if response and response.text:
                    logger.info(
                        "gemini_pdf_extraction_success",
                        model=model_name,
                        size_bytes=len(pdf_bytes),
                    )
                    return response.text
            except Exception as exc:
                last_error = str(exc)
                logger.warning("gemini_pdf_model_failed", model=model_name, error=last_error)
                continue

        logger.error("gemini_pdf_all_models_failed", error=last_error)
        return "*PDF extraction failed. The court order could not be processed at this time.*"

    async def generate_suggested_questions(
        self,
        case_context: str,
        last_ai_response: str,
        n: int = 4,
    ) -> list[str]:
        """Generate contextual follow-up questions based on case context and last AI reply.

        Returns default template questions if Gemini fails — does NOT call OpenRouter.
        """
        default_questions = [
            "What happened next in this case?",
            "What laws were cited?",
            "Summarize the court's reasoning.",
            "Who are the parties involved?",
        ]

        if not self._ensure_configured() or self._is_credits_depleted():
            try:
                from app.clients.groq_client import groq_client
                groq_resp = await groq_client.generate_json(
                    system_prompt="You are a legal assistant. Output valid JSON.",
                    user_prompt=prompt,
                    temperature=0.6,
                    max_output_tokens=512,
                )
                if isinstance(groq_resp, list) and groq_resp:
                    return [str(q) for q in groq_resp[:n]]
                if isinstance(groq_resp, dict) and "questions" in groq_resp and isinstance(groq_resp["questions"], list):
                    return [str(q) for q in groq_resp["questions"][:n]]
            except Exception:
                pass
            return default_questions

        prompt = (
            f"Based on the case details below and the assistant's last response, "
            f"generate exactly {n} short, specific follow-up questions a user might ask next.\n"
            f"Output ONLY a JSON array of strings with no extra text.\n\n"
            f"## Case Context\n{case_context}\n\n"
            f"## Last AI Response\n{last_ai_response}"
        )

        for model_name in self._model_candidates():
            try:
                response = await self.client.aio.models.generate_content(  # type: ignore[union-attr]
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.6,
                        max_output_tokens=512,
                        response_mime_type="application/json",
                    ),
                )
                if response and response.text:
                    questions = json.loads(response.text)
                    if isinstance(questions, list):
                        return [str(q) for q in questions[:n]]
            except Exception as exc:
                last_error = str(exc)
                logger.warning("gemini_suggest_failed", model=model_name, error=last_error)
                if "402" in last_error or "prepayment credits are depleted" in last_error.lower():
                    self._mark_credits_depleted()
                    break
                continue

        try:
            from app.clients.groq_client import groq_client
            groq_resp = await groq_client.generate_json(
                system_prompt="You are a legal assistant. Output valid JSON.",
                user_prompt=prompt,
                temperature=0.6,
                max_output_tokens=512,
            )
            if isinstance(groq_resp, list) and groq_resp:
                return [str(q) for q in groq_resp[:n]]
            if isinstance(groq_resp, dict) and "questions" in groq_resp and isinstance(groq_resp["questions"], list):
                return [str(q) for q in groq_resp["questions"][:n]]
        except Exception:
            pass

        return default_questions

    async def generate_with_context(
        self,
        system_prompt: str,
        conversation_history: list[dict[str, str]],
        user_message: str,
        case_context: str,
        order_context: str | None = None,
        temperature: float = 0.3,
    ) -> str:
        """Generate a response with full conversation context.

        Falls back to Groq Cloud if Gemini is unavailable.
        """
        context_parts = [f"## Case Information\n{case_context}"]

        if order_context:
            context_parts.append(f"## Relevant Order\n{order_context}")

        if conversation_history:
            history_text = "\n".join(
                f"{'User' if m['role'] == 'user' else 'Assistant'}: {m['message']}"
                for m in conversation_history[-10:]
            )
            context_parts.append(f"## Conversation History\n{history_text}")

        context_parts.append(f"## Current Question\n{user_message}")
        context_parts.append(
            "## Response Instructions\n"
            "- Provide a comprehensive, detailed, and thorough legal analysis "
            "(do NOT provide brief or 1-sentence answers)\n"
            "- Structure your response with clear Markdown headings (##, ###), bullet lists, "
            "and bold text\n"
            "- Cover: 1. Executive Summary, 2. Procedural & Case History, "
            "3. Legal Arguments & Laws Cited, 4. Bench Directions & Orders, 5. Next Steps\n"
            "- Cite specific dates, judges, acts, and party names from the case context\n"
            "- Keep the tone professional, objective, and authoritative"
        )

        full_prompt = "\n\n".join(context_parts)
        return await self.generate(system_prompt, full_prompt, temperature=temperature)

    async def generate_with_context_stream(
        self,
        system_prompt: str,
        conversation_history: list[dict[str, str]],
        user_message: str,
        case_context: str,
        order_context: str | None = None,
        temperature: float = 0.3,
    ):
        """Generate a response with full conversation context (Streaming).

        Streams Gemini output or falls back to Groq Cloud (openai/gpt-oss-120b).
        """
        context_parts = [f"## Case Information\n{case_context}"]
        if order_context:
            context_parts.append(f"## Relevant Order\n{order_context}")

        if conversation_history:
            history_text = "\n".join(
                f"{'User' if m['role'] == 'user' else 'Assistant'}: {m['message']}"
                for m in conversation_history[-10:]
            )
            context_parts.append(f"## Conversation History\n{history_text}")

        context_parts.append(f"## Current Question\n{user_message}")
        context_parts.append(
            "## Response Instructions\n"
            "- Provide a comprehensive, detailed, and thorough legal analysis\n"
            "- Structure your response with clear Markdown headings (##, ###), bullet lists\n"
            "- Cover: 1. Executive Summary, 2. Procedural & Case History, 3. Legal Arguments, 4. Bench Directions\n"
            "- Cite specific dates, judges, acts, and party names\n"
            "- Keep the tone professional, objective, and authoritative"
        )

        full_prompt = "\n\n".join(context_parts)

        if self._ensure_configured() and not self._is_credits_depleted():
            for model_name in self._model_candidates():
                try:
                    combined_prompt = f"SYSTEM INSTRUCTIONS:\n{system_prompt}\n\nUSER REQUEST:\n{full_prompt}"

                    response_stream = await self.client.aio.models.generate_content_stream(  # type: ignore
                        model=model_name,
                        contents=combined_prompt,
                        config=types.GenerateContentConfig(
                            temperature=temperature,
                            max_output_tokens=4096,
                        ),
                    )
                    async for chunk in response_stream:
                        if chunk.text:
                            yield chunk.text
                    return
                except Exception as exc:
                    last_error = str(exc)
                    logger.warning("gemini_stream_model_failed", model=model_name, error=last_error)
                    if "402" in last_error or "prepayment credits are depleted" in last_error.lower():
                        self._mark_credits_depleted()
                        break
                    continue

        # Stream via Groq as fallback
        logger.warning("gemini_stream_all_models_failed_trying_groq")
        from app.clients.groq_client import groq_client
        groq_text = await groq_client.generate(
            system_prompt=system_prompt,
            user_prompt=full_prompt,
            temperature=temperature,
        )
        if groq_text:
            chunk_size = 40
            for i in range(0, len(groq_text), chunk_size):
                yield groq_text[i:i + chunk_size]
                await asyncio.sleep(0.01)
        else:
            yield "The AI service is currently unavailable. Please try again later."


# Singleton instance
gemini_client = GeminiClient()
