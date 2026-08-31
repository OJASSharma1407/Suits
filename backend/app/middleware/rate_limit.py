"""Simple in-memory rate limiting middleware."""

import time
from collections import defaultdict

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.core.config import settings


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple token-bucket rate limiter per IP address."""

    def __init__(self, app, max_requests: int | None = None, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests or settings.rate_limit_per_minute
        self.window = window_seconds
        self._requests: dict[str, list[float]] = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        # Always bypass rate limiting for CORS preflight (OPTIONS) and health check
        if request.method == "OPTIONS" or request.url.path == "/api/health":
            return await call_next(request)

        # In development mode, provide generous headroom (e.g. 600 req/min) for single-user dev
        effective_limit = (
            max(self.max_requests, 600)
            if settings.environment == "development"
            else self.max_requests
        )

        client_ip = request.client.host if request.client else "unknown"
        now = time.monotonic()

        # Clean old entries outside the window
        self._requests[client_ip] = [
            t for t in self._requests[client_ip] if now - t < self.window
        ]

        if len(self._requests[client_ip]) >= effective_limit:
            return JSONResponse(
                status_code=429,
                content={"success": False, "message": "Too many requests. Please try again later."},
            )

        self._requests[client_ip].append(now)
        return await call_next(request)
