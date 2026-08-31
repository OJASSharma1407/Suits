"""OpenRouter AI Client — Free Model Router with automatic rotation and cooldown.

Maintains a pool of free models available on OpenRouter. When a model returns
429/503/overloaded errors it is placed in a cooldown window (default 60 s) and
the router automatically tries the next available model in the pool.

The primary model preference is controlled via OPENROUTER_MODEL in .env.
"""

from __future__ import annotations

import json
import time
from typing import Any

import structlog
from openai import AsyncOpenAI

from app.core.config import settings

logger = structlog.get_logger()

# ---------------------------------------------------------------------------
# Free model pool — ordered by quality / reliability preference
# Add or remove slugs here to adjust the routing pool.
# ---------------------------------------------------------------------------
_FREE_MODEL_POOL: list[str] = [
    "z-ai/glm-5.2",                              # Z.ai GLM 5.2 — strong reasoning, 1M ctx
    "z-ai/glm-5.2:free",                         # GLM 5.2 free tier
    "thudm/glm-4-32b:free",                      # GLM-4 32B free
    "microsoft/phi-4-reasoning-plus:free",       # Phi-4 reasoning
    "google/gemma-3-27b-it:free",                # Gemma 3 27B
    "meta-llama/llama-3.3-70b-instruct:free",    # Llama 3.3 70B
    "meta-llama/llama-3.1-8b-instruct:free",     # Llama 3.1 8B (fast fallback)
    "mistralai/mistral-7b-instruct:free",        # Mistral 7B (universal fallback)
    "qwen/qwen3-8b:free",                        # Qwen3 8B
    "deepseek/deepseek-r1-0528:free",            # DeepSeek R1
]

# Error status codes that indicate rate limiting / overload (trigger cooldown)
_RATE_LIMIT_CODES = {429, 503, 529}

# Cooldown duration in seconds after a rate-limit hit
_COOLDOWN_SECONDS = 60

BASE_URL = "https://openrouter.ai/api/v1"

_OR_EXTRA_HEADERS = {
    "HTTP-Referer": "https://suits.app",
    "X-Title": "SUITS AI",
}


class _FreeModelRouter:
    """Round-robin router with per-model cooldown tracking."""

    def __init__(self, pool: list[str]) -> None:
        self._pool = list(pool)
        # model -> unix timestamp until which it is cooled down
        self._cooldowns: dict[str, float] = {}
        self._idx = 0  # round-robin pointer

    def _is_available(self, model: str) -> bool:
        until = self._cooldowns.get(model, 0.0)
        if time.monotonic() >= until:
            if model in self._cooldowns:
                del self._cooldowns[model]
            return True
        return False

    def get_ordered(self, preferred: str | None = None) -> list[str]:
        """Return pool ordered: preferred first (if available), then round-robin."""
        available = [m for m in self._pool if self._is_available(m)]
        cooled = [m for m in self._pool if not self._is_available(m)]

        ordered: list[str] = []
        # Put preferred model at front if it's available
        if preferred and preferred in available:
            ordered.append(preferred)
            rest = [m for m in available if m != preferred]
        else:
            rest = available

        # Round-robin through the rest
        start = self._idx % max(len(rest), 1)
        ordered.extend(rest[start:] + rest[:start])

        # Append cooled-down models at end as last-resort
        ordered.extend(cooled)

        return ordered

    def mark_rate_limited(self, model: str, retry_after: float = _COOLDOWN_SECONDS) -> None:
        self._cooldowns[model] = time.monotonic() + retry_after
        logger.warning(
            "free_router_model_cooled_down",
            model=model,
            cooldown_seconds=retry_after,
        )

    def advance(self) -> None:
        """Advance round-robin index after a successful call."""
        self._idx = (self._idx + 1) % max(len(self._pool), 1)

    def status(self) -> dict[str, Any]:
        now = time.monotonic()
        return {
            m: max(0.0, round(self._cooldowns.get(m, now) - now, 1))
            for m in self._pool
        }


# Singleton router instance
_router = _FreeModelRouter(_FREE_MODEL_POOL)


def _get_preferred_model() -> str | None:
    raw = settings.openrouter_model
    if raw and raw.strip():
        return raw.strip()
    return None


def _is_rate_limit_error(exc: Exception) -> tuple[bool, float]:
    """Returns (is_rate_limit, retry_after_seconds)."""
    msg = str(exc)
    # Check HTTP status code
    for code in _RATE_LIMIT_CODES:
        if f"Error code: {code}" in msg or f"'{code}'" in msg or f"{code}" in msg[:50]:
            # Try to extract retry_after from metadata
            try:
                if "retry_after_seconds" in msg:
                    import re
                    m = re.search(r"'retry_after_seconds':\s*(\d+)", msg)
                    if m:
                        return True, float(m.group(1)) + 5
            except Exception:
                pass
            return True, _COOLDOWN_SECONDS
    # Check for overload keywords
    overload_keywords = ["overloaded", "capacity", "upstream_429", "rate.limit", "rate limit"]
    if any(k in msg.lower() for k in overload_keywords):
        return True, _COOLDOWN_SECONDS
    return False, 0.0


class OpenRouterClient:
    """Async client for OpenRouter with free-model rotating pool."""

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
        if not key or not key.strip():
            logger.warning(
                "openrouter_api_key_missing",
                hint="Set OPENROUTER_API_KEY in .env — get one at openrouter.ai",
            )
            return False
        try:
            self.client = AsyncOpenAI(
                api_key=key.strip(),
                base_url=BASE_URL,
                default_headers=_OR_EXTRA_HEADERS,
                timeout=60.0,
            )
            self._configured = True
            return True
        except Exception as exc:
            logger.error("openrouter_config_error", error=str(exc))
            return False

    def _build_context_block(
        self,
        case_context: str,
        order_context: str | None,
    ) -> str:
        if case_context and len(case_context) > 80000:
            case_context = case_context[:40000] + "\n...[TRUNCATED]...\n" + case_context[-40000:]
        if order_context and len(order_context) > 120000:
            order_context = order_context[:80000] + "\n...[TRUNCATED]...\n" + order_context[-40000:]

        parts = [f"## Case Information\n{case_context}"]
        if order_context:
            parts.append(f"## Relevant Order\n{order_context}")
        parts.append(
            "## Response Instructions\n"
            "- Answer the user's question directly and concisely\n"
            "- Use **bold** for key terms, bullet points for lists, and Markdown headings only when genuinely useful\n"
            "- Cite specific case names, section numbers, judge names, and dates from the context when relevant\n"
            "- Write in plain English — do NOT use raw JSON field names\n"
            "- Skip any section that has nothing to add\n"
            "- Keep the tone clear, professional, and easy to read"
        )
        return "\n\n".join(parts)

    def _build_messages(
        self,
        system_prompt: str,
        context_block: str,
        conversation_history: list[dict[str, str]],
        user_message: str,
    ) -> list[dict[str, Any]]:
        messages: list[dict[str, Any]] = [
            {"role": "system", "content": system_prompt},
            {"role": "system", "content": context_block},
        ]
        for entry in conversation_history[-10:]:
            role = entry.get("role", "user")
            messages.append({
                "role": "user" if role == "user" else "assistant",
                "content": entry.get("message", ""),
            })
        messages.append({"role": "user", "content": user_message})
        return messages

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def router_status(self) -> dict[str, Any]:
        """Return current router status (cooldown seconds per model)."""
        return _router.status()

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.3,
        max_output_tokens: int = 4096,
    ) -> str:
        if not self._ensure_configured():
            raise RuntimeError("OpenRouter is not configured")

        preferred = _get_preferred_model()
        last_error: Exception | None = None

        for model in _router.get_ordered(preferred):
            try:
                response = await self.client.chat.completions.create(  # type: ignore[union-attr]
                    model=model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    temperature=temperature,
                    max_tokens=max_output_tokens,
                )
                if response and response.choices and response.choices[0].message.content:
                    logger.info("openrouter_generate_success", model=model)
                    _router.advance()
                    return response.choices[0].message.content
            except Exception as exc:
                last_error = exc
                is_rl, retry_after = _is_rate_limit_error(exc)
                if is_rl:
                    _router.mark_rate_limited(model, retry_after)
                else:
                    logger.warning("openrouter_generate_failed", model=model, error=str(exc))
                continue

        raise RuntimeError(f"All OpenRouter models failed: {last_error}")

    async def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.2,
        max_output_tokens: int | None = None,
    ) -> dict[str, Any]:
        if max_output_tokens is None:
            max_output_tokens = settings.openrouter_max_tokens
        if not self._ensure_configured():
            raise RuntimeError("OpenRouter is not configured")

        preferred = _get_preferred_model()
        last_error: Exception | None = None

        for model in _router.get_ordered(preferred):
            try:
                response = await self.client.chat.completions.create(  # type: ignore[union-attr]
                    model=model,
                    messages=[
                        {"role": "system", "content": system_prompt + "\nReturn ONLY valid JSON."},
                        {"role": "user", "content": user_prompt},
                    ],
                    temperature=temperature,
                    max_tokens=max_output_tokens,
                    response_format={"type": "json_object"},
                )
                if response and response.choices and response.choices[0].message.content:
                    logger.info("openrouter_json_success", model=model)
                    _router.advance()
                    return json.loads(response.choices[0].message.content)
            except Exception as exc:
                last_error = exc
                is_rl, retry_after = _is_rate_limit_error(exc)
                if is_rl:
                    _router.mark_rate_limited(model, retry_after)
                else:
                    logger.warning("openrouter_json_failed", model=model, error=str(exc))
                continue

        raise RuntimeError(f"All OpenRouter models failed (JSON): {last_error}")

    async def generate_with_context(
        self,
        system_prompt: str,
        conversation_history: list[dict[str, str]],
        user_message: str,
        case_context: str,
        order_context: str | None = None,
        temperature: float = 0.3,
    ) -> str:
        if not self._ensure_configured():
            raise RuntimeError("OpenRouter is not configured")

        context_block = self._build_context_block(case_context, order_context)
        messages = self._build_messages(system_prompt, context_block, conversation_history, user_message)
        preferred = _get_preferred_model()
        last_error: Exception | None = None

        for model in _router.get_ordered(preferred):
            try:
                response = await self.client.chat.completions.create(  # type: ignore[union-attr]
                    model=model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=settings.openrouter_max_tokens,
                )
                if response and response.choices and response.choices[0].message.content:
                    logger.info("openrouter_context_success", model=model)
                    _router.advance()
                    return response.choices[0].message.content
            except Exception as exc:
                last_error = exc
                is_rl, retry_after = _is_rate_limit_error(exc)
                if is_rl:
                    _router.mark_rate_limited(model, retry_after)
                else:
                    logger.warning("openrouter_context_failed", model=model, error=str(exc))
                continue

        raise RuntimeError(f"All OpenRouter models failed (context): {last_error}")

    async def generate_with_context_stream(
        self,
        system_prompt: str,
        conversation_history: list[dict[str, str]],
        user_message: str,
        case_context: str,
        order_context: str | None = None,
        temperature: float = 0.3,
    ):
        """Stream tokens via the rotating free model pool.

        Yields raw text chunks. Automatically rotates to the next model
        in the pool if the current one is rate-limited or overloaded.
        """
        if not self._ensure_configured():
            raise RuntimeError("OpenRouter is not configured")

        context_block = self._build_context_block(case_context, order_context)
        messages = self._build_messages(system_prompt, context_block, conversation_history, user_message)
        preferred = _get_preferred_model()
        last_error: Exception | None = None

        for model in _router.get_ordered(preferred):
            try:
                stream = await self.client.chat.completions.create(  # type: ignore[union-attr]
                    model=model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=settings.openrouter_max_tokens,
                    stream=True,
                )
                streamed_any = False
                async for chunk in stream:
                    delta = chunk.choices[0].delta if chunk.choices else None
                    if delta and delta.content:
                        streamed_any = True
                        yield delta.content
                if streamed_any:
                    logger.info("openrouter_stream_complete", model=model)
                    _router.advance()
                    return
                # Empty stream — treat as soft failure and try next model
                logger.warning("openrouter_stream_empty", model=model)
            except Exception as exc:
                last_error = exc
                is_rl, retry_after = _is_rate_limit_error(exc)
                if is_rl:
                    _router.mark_rate_limited(model, retry_after)
                else:
                    logger.warning("openrouter_stream_failed", model=model, error=str(exc))
                continue

        raise RuntimeError(f"All OpenRouter models failed (stream): {last_error}")

    async def generate_suggested_questions(
        self,
        case_context: str,
        last_ai_response: str,
        n: int = 4,
    ) -> list[str]:
        default_questions = [
            "What is the ratio decidendi established in this case?",
            "List all precedents and statutes cited.",
            "Explain the court's substantive reasoning on the merits.",
            "What specific directions or relief were ordered by the Court?",
        ]
        if not self._ensure_configured():
            return default_questions

        prompt = (
            f"Based on the case details below and the assistant's last response, "
            f"generate exactly {n} short, specific follow-up questions a user might ask next.\n"
            f"Output ONLY a JSON array of strings with no extra text.\n\n"
            f"## Case Context\n{case_context[:3000]}\n\n"
            f"## Last AI Response\n{last_ai_response[:2000]}"
        )

        preferred = _get_preferred_model()
        for model in _router.get_ordered(preferred):
            try:
                response = await self.client.chat.completions.create(  # type: ignore[union-attr]
                    model=model,
                    messages=[
                        {"role": "system", "content": "You are a helpful assistant. Output JSON only."},
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.6,
                    max_tokens=512,
                    response_format={"type": "json_object"},
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
                        logger.info("openrouter_suggest_success", model=model)
                        return [str(q) for q in questions[:n]]
            except Exception as exc:
                is_rl, retry_after = _is_rate_limit_error(exc)
                if is_rl:
                    _router.mark_rate_limited(model, retry_after)
                else:
                    logger.warning("openrouter_suggest_failed", model=model, error=str(exc))
                continue

        return default_questions

    async def extract_markdown_from_pdf(self, pdf_bytes: bytes) -> str:
        """PDF extraction stub — text-only models can't process raw PDF bytes."""
        if not pdf_bytes:
            return "*No PDF content was available for this order.*"
        logger.warning("openrouter_pdf_extraction_unsupported")
        return (
            "*AI PDF extraction is not currently supported for this model. "
            "Please use the Kanoon document viewer to read the original judgment.*"
        )


# Singleton
openrouter_client = OpenRouterClient()
