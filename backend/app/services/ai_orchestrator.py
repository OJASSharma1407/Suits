"""AI Orchestrator — Dynamic Routing between Cloud AI and Local Ollama (Qwen 7B).

Centralizes execution across all AI features in SUITS:
1. Online / Cloud Mode (Default): Uses OpenRouter / Gemini free-tier model rotation.
2. Offline / Local Mode: Uses Local Ollama with Qwen 7B (0 tokens, complete offline privacy).
3. Graceful Limit Detection: Intercepts rate limits (HTTP 429) or quota depletion and raises
   `OnlineAILimitReachedError` to trigger the frontend switch-to-Ollama modal.
"""

from __future__ import annotations

import asyncio
from typing import Any, AsyncGenerator

import structlog

from app.clients.gemini_client import gemini_client
from app.clients.ollama_client import ollama_client
from app.clients.openrouter_client import openrouter_client
from app.clients.prediction_gemini_client import prediction_gemini_client
from app.core.exceptions import OnlineAILimitReachedError
from app.middleware.ai_provider import is_local_ai_active

logger = structlog.get_logger()


class AIOrchestrator:
    """Dispatches AI inference requests based on the active provider context."""

    @staticmethod
    def is_local() -> bool:
        """Check if Local Ollama mode is requested for the current request context."""
        return is_local_ai_active()

    async def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.1,
        max_tokens: int | None = None,
        force_provider: str | None = None,
    ) -> dict[str, Any]:
        """Generate structured JSON using either Ollama (local) or OpenRouter/Gemini (cloud)."""
        use_local = (force_provider == "ollama") or (force_provider is None and self.is_local())

        if use_local:
            logger.info("ai_orchestrator_routing_to_local_ollama", task="generate_json")
            return await ollama_client.generate_json(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=temperature,
                max_tokens=max_tokens or 2048,
            )

        if force_provider == "gemini":
            return await self.generate_json_gemini_first(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=temperature,
                max_tokens=max_tokens,
            )

        # Cloud AI execution path
        logger.info("ai_orchestrator_routing_to_cloud", task="generate_json")
        try:
            # 1. Try OpenRouter free tier
            raw = await openrouter_client.generate_json(system_prompt, user_prompt)
            if raw and isinstance(raw, dict):
                return raw
        except Exception as or_err:
            err_str = str(or_err).lower()
            logger.warning("orchestrator_openrouter_failed_trying_gemini", error=str(or_err))
            if "429" in err_str or "quota" in err_str or "rate limit" in err_str or "credits" in err_str:
                # If OpenRouter is rate-limited, try Gemini next
                pass

        try:
            # 2. Try Gemini / Prediction Gemini
            gemini_raw, _ = await prediction_gemini_client.generate_prediction_json(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
            )
            if gemini_raw and isinstance(gemini_raw, dict):
                return gemini_raw
        except Exception as g_err:
            g_err_str = str(g_err).lower()
            logger.error("orchestrator_cloud_ai_failed", error=str(g_err))
            if "429" in g_err_str or "quota" in g_err_str or "rate limit" in g_err_str or "resource_exhausted" in g_err_str:
                raise OnlineAILimitReachedError() from g_err

        # If both cloud providers returned empty/failed, raise limit or general error
        raise OnlineAILimitReachedError("Online AI services unavailable or quota exhausted.")

    async def generate_json_gemini_first(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.1,
        max_tokens: int | None = None,
        force_provider: str | None = None,
    ) -> dict[str, Any]:
        """Generate structured JSON routing Gemini (gemini-3.5-flash) -> Groq fallback.

        Bypasses OpenRouter entirely.
        Preserves local Ollama routing when local AI mode is active.
        """
        use_local = (force_provider == "ollama") or (force_provider is None and self.is_local())

        if use_local:
            logger.info("ai_orchestrator_routing_to_local_ollama", task="generate_json_gemini_first")
            return await ollama_client.generate_json(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=temperature,
                max_tokens=max_tokens or 2048,
            )

        # Cloud AI execution path: Gemini (gemini-3.5-flash) primary -> Groq fallback
        logger.info("ai_orchestrator_routing_to_gemini_primary", task="generate_json_gemini_first")
        try:
            # 1. Try Gemini (gemini-3.5-flash) via prediction_gemini_client
            # Note: prediction_gemini_client internally handles Gemini -> Groq fallback as well
            gemini_raw, _ = await prediction_gemini_client.generate_prediction_json(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
            )
            if gemini_raw and isinstance(gemini_raw, dict):
                return gemini_raw
        except Exception as g_err:
            g_err_str = str(g_err).lower()
            logger.warning("orchestrator_gemini_first_failed_trying_groq", error=str(g_err))

        # 2. Direct Groq fallback if prediction_gemini_client did not return valid dict
        try:
            from app.clients.groq_client import groq_client
            groq_raw = await groq_client.generate_json(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=temperature,
                max_output_tokens=max_tokens or 8192,
            )
            if groq_raw and isinstance(groq_raw, dict):
                logger.info("orchestrator_groq_fallback_success", task="generate_json_gemini_first")
                return groq_raw
        except Exception as gr_err:
            gr_err_str = str(gr_err).lower()
            logger.error("orchestrator_groq_fallback_failed", error=str(gr_err))
            if "429" in gr_err_str or "quota" in gr_err_str or "rate limit" in gr_err_str:
                raise OnlineAILimitReachedError() from gr_err

        raise OnlineAILimitReachedError("Online AI services (Gemini & Groq) unavailable or quota exhausted.")

    async def generate_text(
        self,
        prompt: str,
        system_prompt: str = "",
        temperature: float | None = None,
        force_provider: str | None = None,
    ) -> str:
        """Generate unstructured text response using either Ollama or Cloud AI."""
        use_local = (force_provider == "ollama") or (force_provider is None and self.is_local())

        if use_local:
            logger.info("ai_orchestrator_routing_to_local_ollama", task="generate_text")
            return await ollama_client.generate(
                prompt=prompt,
                system_prompt=system_prompt,
                temperature=temperature,
            )

        if force_provider == "gemini":
            return await self.generate_text_gemini_first(
                prompt=prompt,
                system_prompt=system_prompt,
                temperature=temperature,
            )

        # Cloud AI execution path
        try:
            result = await openrouter_client.generate(prompt=prompt, system_prompt=system_prompt)
            if result and result.strip():
                return result
        except Exception as or_err:
            logger.warning("orchestrator_openrouter_text_failed_trying_gemini", error=str(or_err))

        try:
            result = await gemini_client.generate(system_prompt=system_prompt, user_prompt=prompt)
            if result and result.strip():
                return result
        except Exception as g_err:
            g_err_str = str(g_err).lower()
            if "429" in g_err_str or "quota" in g_err_str or "rate limit" in g_err_str:
                raise OnlineAILimitReachedError() from g_err
            raise

        raise OnlineAILimitReachedError("Online AI services unavailable or quota exhausted.")

    async def generate_text_gemini_first(
        self,
        prompt: str,
        system_prompt: str = "",
        temperature: float | None = None,
        force_provider: str | None = None,
    ) -> str:
        """Generate text routing Gemini (gemini-3.5-flash) -> Groq fallback.

        Bypasses OpenRouter entirely.
        Preserves local Ollama routing when local AI mode is active.
        """
        use_local = (force_provider == "ollama") or (force_provider is None and self.is_local())

        if use_local:
            logger.info("ai_orchestrator_routing_to_local_ollama", task="generate_text_gemini_first")
            return await ollama_client.generate(
                prompt=prompt,
                system_prompt=system_prompt,
                temperature=temperature,
            )

        # Cloud AI execution path: Gemini (gemini-3.5-flash) primary -> Groq fallback
        logger.info("ai_orchestrator_routing_to_gemini_text_primary", task="generate_text_gemini_first")
        try:
            # gemini_client.generate internally attempts Gemini and falls back to _groq_fallback_generate
            result = await gemini_client.generate(
                system_prompt=system_prompt,
                user_prompt=prompt,
                temperature=temperature if temperature is not None else 0.3,
            )
            if result and result.strip() and not result.startswith("### AI Case Analysis Unavailable"):
                return result
        except Exception as g_err:
            g_err_str = str(g_err).lower()
            logger.warning("orchestrator_gemini_text_failed_trying_groq", error=str(g_err))

        # Direct Groq fallback if gemini_client didn't succeed
        try:
            from app.clients.groq_client import groq_client
            groq_text = await groq_client.generate(
                system_prompt=system_prompt,
                user_prompt=prompt,
                temperature=temperature if temperature is not None else 0.3,
            )
            if groq_text and groq_text.strip():
                logger.info("orchestrator_groq_text_fallback_success")
                return groq_text
        except Exception as gr_err:
            gr_err_str = str(gr_err).lower()
            logger.error("orchestrator_groq_text_fallback_failed", error=str(gr_err))
            if "429" in gr_err_str or "quota" in gr_err_str or "rate limit" in gr_err_str:
                raise OnlineAILimitReachedError() from gr_err

        raise OnlineAILimitReachedError("Online AI services (Gemini & Groq) unavailable or quota exhausted.")

    async def generate_with_context(
        self,
        system_prompt: str,
        conversation_history: list[dict[str, str]],
        user_message: str,
        case_context: str = "",
        order_context: str = "",
    ) -> str:
        """Multi-turn context chat generation."""
        if self.is_local():
            logger.info("ai_orchestrator_chat_routing_to_local_ollama")
            return await ollama_client.generate_with_context(
                system_prompt=system_prompt,
                conversation_history=conversation_history,
                user_message=user_message,
                case_context=case_context,
                order_context=order_context,
            )

        # Cloud path: OpenRouter with Gemini fallback
        try:
            ai_response = await openrouter_client.generate_with_context(
                system_prompt=system_prompt,
                conversation_history=conversation_history,
                user_message=user_message,
                case_context=case_context,
                order_context=order_context,
            )
            if ai_response and ai_response.strip():
                return ai_response
        except Exception as or_err:
            logger.warning("openrouter_chat_failed_trying_gemini", error=str(or_err))

        try:
            return await gemini_client.generate_with_context(
                system_prompt=system_prompt,
                conversation_history=conversation_history,
                user_message=user_message,
                case_context=case_context,
                order_context=order_context,
            )
        except Exception as g_err:
            g_err_str = str(g_err).lower()
            if "429" in g_err_str or "quota" in g_err_str or "rate limit" in g_err_str:
                raise OnlineAILimitReachedError() from g_err
            raise

    async def generate_with_context_stream(
        self,
        system_prompt: str,
        conversation_history: list[dict[str, str]],
        user_message: str,
        case_context: str = "",
        order_context: str = "",
    ) -> AsyncGenerator[str, None]:
        """Streaming multi-turn context chat generation."""
        if self.is_local():
            logger.info("ai_orchestrator_chat_stream_routing_to_local_ollama")
            async for token in ollama_client.generate_with_context_stream(
                system_prompt=system_prompt,
                conversation_history=conversation_history,
                user_message=user_message,
                case_context=case_context,
                order_context=order_context,
            ):
                yield token
            return

        # Cloud path: OpenRouter with Gemini fallback
        has_tokens = False
        try:
            async for token in openrouter_client.generate_with_context_stream(
                system_prompt=system_prompt,
                conversation_history=conversation_history,
                user_message=user_message,
                case_context=case_context,
                order_context=order_context,
            ):
                if token:
                    has_tokens = True
                    yield token
            if has_tokens:
                return
        except Exception as or_err:
            logger.warning("openrouter_stream_failed_trying_gemini", error=str(or_err))

        try:
            async for token in gemini_client.generate_with_context_stream(
                system_prompt=system_prompt,
                conversation_history=conversation_history,
                user_message=user_message,
                case_context=case_context,
                order_context=order_context,
            ):
                if token:
                    yield token
        except Exception as g_err:
            g_err_str = str(g_err).lower()
            if "429" in g_err_str or "quota" in g_err_str or "rate limit" in g_err_str:
                raise OnlineAILimitReachedError() from g_err
            raise


ai_orchestrator = AIOrchestrator()
