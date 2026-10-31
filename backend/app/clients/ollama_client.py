"""Local Ollama AI Client — Offline & Local AI Engine with Qwen 7B.

Provides full offline and private AI inference using an Ollama daemon running locally:
- Standard chat completions and token streaming via OpenAI-compatible endpoint (/v1) or native API.
- Strict structured JSON generation via `response_format={"type": "json_object"}`.
- Real-time connection and model installation verification (/api/tags).
- Dedicated legal assistant context framing tailored for Qwen 7B instruction following.
"""

from __future__ import annotations

import asyncio
import json
import re
import time
from typing import Any, AsyncGenerator

import httpx
import structlog
from openai import AsyncOpenAI

from app.core.config import settings

logger = structlog.get_logger()


class OllamaClient:
    """Client for local Ollama instances running Qwen 7B or other local LLMs."""

    def __init__(self) -> None:
        self.base_url = settings.ollama_base_url.rstrip("/")
        self.model = settings.ollama_model
        self.timeout = settings.ollama_timeout_seconds
        self.temperature = settings.ollama_temperature
        self._openai_client: AsyncOpenAI | None = None

    def _get_client(self) -> AsyncOpenAI:
        """Lazy-initialize AsyncOpenAI client targeting Ollama's /v1 endpoint."""
        if self._openai_client is None:
            self._openai_client = AsyncOpenAI(
                base_url=f"{self.base_url}/v1",
                api_key="ollama",  # Ollama /v1 accepts any non-empty string
                timeout=float(self.timeout),
            )
        return self._openai_client

    async def check_health(self) -> dict[str, Any]:
        """Verify connectivity to local Ollama daemon and check if target model is pulled."""
        target_model = self.model.lower().strip()
        target_prefix = target_model.split(":")[0]

        try:
            async with httpx.AsyncClient(timeout=3.0) as http_client:
                resp = await http_client.get(f"{self.base_url}/api/tags")
                if resp.status_code == 200:
                    data = resp.json()
                    models_raw = data.get("models", [])
                    installed_models = [m.get("name", "") for m in models_raw]

                    # Match exact name or prefix (e.g. qwen2.5:7b matches qwen2.5:7b or qwen2.5:7b-instruct)
                    is_installed = any(
                        target_model in m.lower() or (target_prefix in m.lower() and "7b" in m.lower())
                        for m in installed_models
                    )

                    return {
                        "running": True,
                        "url": self.base_url,
                        "model_configured": self.model,
                        "model_installed": is_installed,
                        "models": installed_models,
                        "message": (
                            f"Ollama running with '{self.model}' ready."
                            if is_installed
                            else f"Ollama running, but '{self.model}' is not pulled yet. Run: `ollama run {self.model}`"
                        ),
                    }
                else:
                    return {
                        "running": False,
                        "url": self.base_url,
                        "model_configured": self.model,
                        "model_installed": False,
                        "error": f"Ollama returned HTTP {resp.status_code}",
                        "models": [],
                    }
        except Exception as exc:
            return {
                "running": False,
                "url": self.base_url,
                "model_configured": self.model,
                "model_installed": False,
                "error": f"Ollama unreachable at {self.base_url} ({str(exc)})",
                "hint": f"Ensure Ollama is running (`ollama serve`) and model is downloaded (`ollama run {self.model}`).",
                "models": [],
            }

    async def get_effective_model(self) -> str:
        """Dynamically resolve the best matching model installed in Ollama.

        Prioritizes:
        1. Exact match for settings.ollama_model (e.g. qwen2.5:7b)
        2. Any installed model containing 'qwen' (e.g. qwen:7b, qwen2.5, qwen2.5:latest)
        3. First installed model in Ollama if any
        4. Fallback to settings.ollama_model
        """
        try:
            async with httpx.AsyncClient(timeout=2.0) as http_client:
                resp = await http_client.get(f"{self.base_url}/api/tags")
                if resp.status_code == 200:
                    data = resp.json()
                    installed = [m.get("name", "") for m in data.get("models", [])]
                    target = self.model.lower().strip()

                    # Exact or prefix match
                    for m in installed:
                        if m.lower() == target or m.lower().startswith(target):
                            return m

                    # Any Qwen model installed
                    for m in installed:
                        if "qwen" in m.lower():
                            return m

                    # If user has another model installed (e.g. llama3, mistral)
                    if installed:
                        return installed[0]
        except Exception:
            pass
        return self.model

    async def generate(
        self,
        prompt: str,
        system_prompt: str = "",
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> str:
        """Generate text response using local Qwen model."""
        client = self._get_client()
        active_model = await self.get_effective_model()
        messages: list[dict[str, str]] = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        t0 = time.monotonic()
        try:
            response = await client.chat.completions.create(
                model=active_model,
                messages=messages,  # type: ignore[arg-type]
                temperature=temperature if temperature is not None else self.temperature,
                max_tokens=max_tokens or 2048,
                frequency_penalty=0.25,
                presence_penalty=0.1,
                extra_body={"options": {"num_ctx": 8192, "repeat_penalty": 1.15}},
            )
            elapsed = time.monotonic() - t0
            content = response.choices[0].message.content or ""
            logger.info("ollama_generate_success", model=active_model, elapsed_s=round(elapsed, 2), chars=len(content))
            return content.strip()
        except Exception as exc:
            logger.error("ollama_generate_failed", model=active_model, error=str(exc))
            raise

    async def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.1,
        max_tokens: int = 2048,
    ) -> dict[str, Any]:
        """Generate and parse structured JSON using Ollama with Qwen 7B."""
        client = self._get_client()

        # Augment system prompt to strictly mandate JSON formatting for Qwen and prevent loops
        json_system_prompt = (
            system_prompt.strip()
            + "\n\nCRITICAL INSTRUCTIONS:\n"
            "1. Respond ONLY with valid, raw RFC-8259 JSON.\n"
            "2. Do NOT include markdown fences (```json), commentary, or leading/trailing text.\n"
            "3. Do NOT repeat keys, sentences, or phrases in loops. Limit all lists to at most 3 concise items."
        )

        messages: list[dict[str, str]] = [
            {"role": "system", "content": json_system_prompt},
            {"role": "user", "content": user_prompt},
        ]

        t0 = time.monotonic()
        active_model = await self.get_effective_model()
        try:
            response = await client.chat.completions.create(
                model=active_model,
                messages=messages,  # type: ignore[arg-type]
                temperature=temperature,
                max_tokens=max_tokens or 2048,
                frequency_penalty=0.25,
                presence_penalty=0.15,
                response_format={"type": "json_object"},
                extra_body={"options": {"num_ctx": 8192, "repeat_penalty": 1.15}},
            )
            elapsed = time.monotonic() - t0
            content = response.choices[0].message.content or ""

            # Robust JSON cleaning and parsing
            cleaned = content.strip()
            if cleaned.startswith("```"):
                cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
                cleaned = re.sub(r"\s*```$", "", cleaned)
            cleaned = cleaned.strip()

            parsed = json.loads(cleaned)
            if not isinstance(parsed, dict):
                raise ValueError(f"Expected JSON object, got {type(parsed).__name__}")

            # Intelligent single-wrapper unwrapping if model nested response
            if len(parsed) == 1:
                k = next(iter(parsed.keys())).lower()
                v = next(iter(parsed.values()))
                if isinstance(v, dict) and any(w in k for w in ("response", "result", "analysis", "data", "output", "order", "case", "json")):
                    parsed = v

            logger.info("ollama_json_success", model=active_model, elapsed_s=round(elapsed, 2))
            return parsed
        except Exception as exc:
            logger.error("ollama_json_failed", model=active_model, error=str(exc))
            raise

    async def generate_with_context(
        self,
        system_prompt: str,
        conversation_history: list[dict[str, str]],
        user_message: str,
        case_context: str = "",
        order_context: str = "",
    ) -> str:
        """Multi-turn context chat generation for AI Legal Copilot."""
        client = self._get_client()
        active_model = await self.get_effective_model()

        context_parts = []
        if case_context:
            context_parts.append(f"### CASE CONTEXT:\n{case_context[:5000]}")
        if order_context:
            context_parts.append(f"### CURRENT COURT ORDER TEXT:\n{order_context[:7000]}")

        sys_content = system_prompt
        if context_parts:
            sys_content += "\n\n" + "\n\n".join(context_parts)

        messages: list[dict[str, str]] = [{"role": "system", "content": sys_content}]

        # Append last 10 messages from history
        for msg in conversation_history[-10:]:
            role = "assistant" if msg.get("role") == "assistant" else "user"
            messages.append({"role": role, "content": msg.get("content", "")})

        messages.append({"role": "user", "content": user_message})

        try:
            response = await client.chat.completions.create(
                model=active_model,
                messages=messages,  # type: ignore[arg-type]
                temperature=0.3,
                max_tokens=1500,
                frequency_penalty=0.2,
                presence_penalty=0.1,
                extra_body={"options": {"num_ctx": 8192, "repeat_penalty": 1.15}},
            )
            return (response.choices[0].message.content or "").strip()
        except Exception as exc:
            logger.error("ollama_context_generate_failed", model=active_model, error=str(exc))
            raise

    async def generate_with_context_stream(
        self,
        system_prompt: str,
        conversation_history: list[dict[str, str]],
        user_message: str,
        case_context: str = "",
        order_context: str = "",
    ) -> AsyncGenerator[str, None]:
        """Streaming multi-turn context chat generation for real-time SSE."""
        client = self._get_client()
        active_model = await self.get_effective_model()

        context_parts = []
        if case_context:
            context_parts.append(f"### CASE CONTEXT:\n{case_context[:5000]}")
        if order_context:
            context_parts.append(f"### CURRENT COURT ORDER TEXT:\n{order_context[:7000]}")

        sys_content = system_prompt
        if context_parts:
            sys_content += "\n\n" + "\n\n".join(context_parts)

        messages: list[dict[str, str]] = [{"role": "system", "content": sys_content}]

        for msg in conversation_history[-10:]:
            role = "assistant" if msg.get("role") == "assistant" else "user"
            messages.append({"role": role, "content": msg.get("content", "")})

        messages.append({"role": "user", "content": user_message})

        try:
            stream = await client.chat.completions.create(
                model=active_model,
                messages=messages,  # type: ignore[arg-type]
                temperature=0.3,
                max_tokens=1500,
                frequency_penalty=0.2,
                presence_penalty=0.1,
                stream=True,
                extra_body={"options": {"num_ctx": 8192, "repeat_penalty": 1.15}},
            )
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as exc:
            logger.error("ollama_stream_failed", model=active_model, error=str(exc))
            raise


ollama_client = OllamaClient()
