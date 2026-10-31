"""Groq Cloud AI Client — Gemini Fallback.

Uses Groq's OpenAI-compatible REST API with httpx (no extra SDK needed).
Only activated when Gemini credits are depleted or all Gemini models fail.

Model: openai/gpt-oss-120b  (fastest, most capable on Groq as of 2026)
Docs:  https://console.groq.com/docs/openai
"""

from __future__ import annotations

import asyncio
import json
import re
from typing import Any

import httpx
import structlog

from app.core.config import settings

logger = structlog.get_logger()

_GROQ_BASE_URL = "https://api.groq.com/openai/v1"
_TIMEOUT = 30.0


class GroqClient:
    """Lightweight Groq client using httpx (OpenAI-compatible endpoint).

    Used exclusively as a fallback when the Gemini API is unavailable.
    """

    def __init__(self) -> None:
        self._configured = False
        self._api_key: str = ""
        self._model: str = ""

    def _ensure_configured(self) -> bool:
        import os
        key = os.getenv("GROQ_API_KEY", "") or settings.groq_api_key
        if not key or not key.strip() or key.strip() in ("your-groq-api-key-here", "your-groq-api-key"):
            logger.warning("groq_api_key_missing", hint="Set GROQ_API_KEY in backend/.env")
            return False
        self._api_key = key.strip()
        self._model = os.getenv("GROQ_MODEL", "") or settings.groq_model or "openai/gpt-oss-120b"
        self._configured = True
        return self._configured

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.3,
        max_output_tokens: int = 4096,
    ) -> str | None:
        """Generate a text response via Groq. Returns None on failure."""
        if not self._ensure_configured():
            return None

        payload = {
            "model": self._model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": temperature,
            "max_tokens": max_output_tokens,
        }

        try:
            async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
                resp = await client.post(
                    f"{_GROQ_BASE_URL}/chat/completions",
                    headers=self._headers(),
                    json=payload,
                )
                resp.raise_for_status()
                data = resp.json()
                text = data["choices"][0]["message"]["content"]
                # Strip internal reasoning tags if present
                text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()
                logger.info("groq_generate_success", model=self._model, chars=len(text))
                return text
        except httpx.HTTPStatusError as exc:
            logger.error("groq_generate_http_error", status=exc.response.status_code, error=exc.response.text[:200])
        except Exception as exc:
            logger.error("groq_generate_failed", error=str(exc))
        return None

    async def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.2,
        max_output_tokens: int = 8192,
    ) -> dict[str, Any] | list[Any] | None:
        """Generate a JSON response via Groq. Returns None on failure."""
        if not self._ensure_configured():
            return None

        payload = {
            "model": self._model,
            "messages": [
                {
                    "role": "system",
                    "content": system_prompt + "\n\nIMPORTANT: Respond with valid JSON only. No markdown fences.",
                },
                {"role": "user", "content": user_prompt},
            ],
            "temperature": temperature,
            "max_tokens": max_output_tokens,
            "response_format": {"type": "json_object"},
        }

        try:
            async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
                resp = await client.post(
                    f"{_GROQ_BASE_URL}/chat/completions",
                    headers=self._headers(),
                    json=payload,
                )
                resp.raise_for_status()
                data = resp.json()
                raw = data["choices"][0]["message"]["content"].strip()

                # Strip reasoning/thinking tags if model outputs them
                raw = re.sub(r"<think>.*?</think>", "", raw, flags=re.DOTALL).strip()

                # Strip any accidental markdown fences
                if raw.startswith("```"):
                    raw = re.sub(r"^```(?:json)?\s*", "", raw)
                    raw = re.sub(r"\s*```$", "", raw).strip()

                try:
                    parsed = json.loads(raw)
                except json.JSONDecodeError:
                    # Resilient extraction of outermost JSON object or list
                    idx = -1
                    first_brace = raw.find("{")
                    first_bracket = raw.find("[")
                    if first_brace != -1 and (first_bracket == -1 or first_brace < first_bracket):
                        idx = first_brace
                    elif first_bracket != -1:
                        idx = first_bracket
                    if idx != -1:
                        decoder = json.JSONDecoder()
                        parsed, _ = decoder.raw_decode(raw[idx:])
                    else:
                        raise

                logger.info("groq_generate_json_success", model=self._model)
                return parsed
        except httpx.HTTPStatusError as exc:
            logger.error("groq_json_http_error", status=exc.response.status_code, error=exc.response.text[:200])
        except json.JSONDecodeError as exc:
            logger.error("groq_json_parse_error", error=str(exc))
        except Exception as exc:
            logger.error("groq_json_failed", error=str(exc))
        return None

    async def health_check(self) -> bool:
        """Quick ping to verify Groq connectivity."""
        if not self._ensure_configured():
            return False
        result = await self.generate(
            system_prompt="You are a health check assistant.",
            user_prompt='Return exactly: {"status": "ok"}',
            max_output_tokens=20,
        )
        return result is not None


groq_client = GroqClient()
