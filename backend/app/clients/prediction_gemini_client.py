"""Isolated Gemini Client for Judicial Outcome Prediction & Precedent Comparison Engine.

Uses google-genai SDK 2.0+ with settings.prediction_gemini_api_key.
Completely isolated from the standard gemini_client.py to prevent interfering with
existing order summarization, OCR, or chat functionalities.
"""

from __future__ import annotations

import asyncio
import json
import re
from typing import Any

import structlog
from google import genai
from google.genai import types

from app.core.config import settings

logger = structlog.get_logger()

_LEVEL_FAMILY = ("gemini-3.7", "gemini-3.8")
_BUDGET_FAMILY = ("gemini-3.1", "gemini-3-", "gemini-2.5")


class PredictionGeminiClient:
    """Isolated client dedicated solely to the Judicial Outcome Prediction Engine."""

    def __init__(self) -> None:
        self._configured = False
        self.client: genai.Client | None = None

    def _ensure_configured(self) -> bool:
        if not self._configured:
            key = settings.prediction_gemini_api_key
            if not key or not key.strip():
                logger.warning(
                    "prediction_gemini_api_key_missing",
                    hint="Set PREDICTION_GEMINI_API_KEY in backend/.env",
                )
                return False
            try:
                self.client = genai.Client(api_key=key.strip())
                self._configured = True
                return True
            except Exception as exc:
                logger.error("prediction_gemini_config_error", error=str(exc))
                return False
        return self._configured

    def _model_candidates(self) -> list[str]:
        """Return ordered list of verified healthy models, prioritizing active models."""
        primary = settings.prediction_gemini_model or "gemini-3.6-flash"
        candidates = [primary, "gemini-3.6-flash", "gemini-3-flash-preview"]
        seen: set[str] = set()
        return [m for m in candidates if not (m in seen or seen.add(m))]

    def _build_config(self, model: str, system_instruction: str) -> types.GenerateContentConfig:
        """Construct model-family compliant config.

        Strips sampling parameters (temperature, top_p, top_k) when thinking is configured.
        """
        config_kwargs: dict[str, Any] = {
            "system_instruction": system_instruction,
            "response_mime_type": "application/json",
        }

        # Thinking config adaptation
        if model.startswith(_LEVEL_FAMILY):
            config_kwargs["thinking_config"] = types.ThinkingConfig(
                thinking_level=settings.prediction_thinking_level
            )
        elif hasattr(settings, "prediction_thinking_budget") and settings.prediction_thinking_budget > 0:
            config_kwargs["thinking_config"] = types.ThinkingConfig(
                thinking_budget=settings.prediction_thinking_budget
            )

        return types.GenerateContentConfig(**config_kwargs)

    async def generate_prediction_json(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> tuple[dict[str, Any] | None, str | None]:
        """Call Gemini to produce structured prediction JSON and capture reasoning summary.

        Returns (parsed_dict, reasoning_summary).
        Returns (None, None) on complete failure so caller can return 204 No Content.
        """
        if not self._ensure_configured():
            logger.warning("prediction_gemini_client_not_configured")
            return None, None

        last_error = ""
        for model_name in self._model_candidates():
            # Retry up to 2 times for each model if experiencing temporary 503 demand spikes
            for attempt in range(2):
                try:
                    config = self._build_config(model_name, system_prompt)
                    coro = self.client.aio.models.generate_content(  # type: ignore[union-attr]
                        model=model_name,
                        contents=user_prompt,
                        config=config,
                    )
                    # Enforce a 25s timeout to prevent hanging connections
                    response = await asyncio.wait_for(coro, timeout=25.0)

                    if not response or not response.text:
                        logger.warning("empty_prediction_response", model=model_name, attempt=attempt)
                        continue

                    raw_text = response.text.strip()
                    # Defensive markdown fence stripping
                    if raw_text.startswith("```"):
                        raw_text = re.sub(r"^```(?:json)?\s*", "", raw_text)
                        raw_text = re.sub(r"\s*```$", "", raw_text)
                    raw_text = raw_text.strip()

                    try:
                        parsed_json = json.loads(raw_text)
                    except json.JSONDecodeError:
                        idx = raw_text.find("{")
                        if idx != -1:
                            decoder = json.JSONDecoder()
                            parsed_json, _ = decoder.raw_decode(raw_text[idx:])
                        else:
                            raise

                    # Extract reasoning summary if exposed in candidate parts
                    reasoning_summary: str | None = None
                    try:
                        candidates = getattr(response, "candidates", None)
                        if candidates and len(candidates) > 0:
                            content = candidates[0].content
                            if content and hasattr(content, "parts"):
                                for part in content.parts:
                                    if getattr(part, "thought", None):
                                        reasoning_summary = str(part.thought).strip()
                                        break
                    except Exception:
                        pass

                    logger.info("prediction_gemini_success", model=model_name, attempt=attempt)
                    return parsed_json, reasoning_summary

                except Exception as exc:
                    last_error = str(exc)
                    is_503 = "503" in last_error or "UNAVAILABLE" in last_error or isinstance(exc, asyncio.TimeoutError)
                    logger.warning(
                        "prediction_gemini_model_failed",
                        model=model_name,
                        attempt=attempt,
                        error=last_error or "TimeoutError",
                    )
                    if is_503 and attempt == 0:
                        # Temporary load spike on Google's endpoint: wait 1.2s and retry this model once
                        await asyncio.sleep(1.2)
                        continue
                    break

        logger.error("all_prediction_gemini_models_failed", last_error=last_error)
        return None, None

    async def health_check(self) -> bool:
        """Fast health-check endpoint for early diagnostics."""
        if not self._ensure_configured():
            return False
        try:
            for model_name in self._model_candidates()[:1]:
                config = types.GenerateContentConfig(
                    system_instruction="You are a health check assistant.",
                    max_output_tokens=10,
                )
                resp = await self.client.aio.models.generate_content(  # type: ignore[union-attr]
                    model=model_name,
                    contents="ping",
                    config=config,
                )
                if resp and resp.text:
                    return True
        except Exception as exc:
            logger.warning("prediction_health_check_failed", error=str(exc))
        return False


prediction_gemini_client = PredictionGeminiClient()
