"""AI Provider Context Middleware.

Reads the `X-AI-Provider` header from incoming HTTP requests and binds it to a
thread/task-safe ContextVar. This allows backend AI services (Headnote, Prediction,
Chat, Precedents, Era Transition) to automatically dispatch to either Cloud AI
(Gemini / OpenRouter) or Local Ollama (Qwen 7B) without altering route signatures.
"""

from __future__ import annotations

from contextvars import ContextVar
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

# ContextVar for active AI provider: "cloud" | "ollama"
active_ai_provider: ContextVar[str] = ContextVar("active_ai_provider", default="cloud")


def get_active_ai_provider() -> str:
    """Return the active AI provider for the current request context."""
    return active_ai_provider.get()


def is_local_ai_active() -> bool:
    """Return True if Local Ollama is the active provider for the current request."""
    return active_ai_provider.get() == "ollama"


class AIProviderMiddleware(BaseHTTPMiddleware):
    """Inspects X-AI-Provider header and sets the active_ai_provider context."""

    async def dispatch(self, request: Request, call_next) -> Response:
        header_val = request.headers.get("x-ai-provider", "").lower().strip()
        provider = "ollama" if header_val in ("ollama", "local") else "cloud"

        token = active_ai_provider.set(provider)
        try:
            response = await call_next(request)
            response.headers["X-AI-Provider"] = provider
            return response
        finally:
            active_ai_provider.reset(token)
