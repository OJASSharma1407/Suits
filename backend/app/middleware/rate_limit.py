"""Rate limiting middleware with reverse-proxy support and bounded memory."""

import time
from collections import defaultdict

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.core.config import settings


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Token-bucket rate limiter supporting reverse proxy IPs and bounded memory."""

    def __init__(self, app, max_requests: int | None = None, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests or settings.rate_limit_per_minute
        self.window = window_seconds
        self._requests: dict[str, list[float]] = defaultdict(list)
        self._last_cleanup = time.monotonic()

    def _extract_client_ip(self, request: Request) -> str:
        """Extract the real client IP address behind reverse proxies."""
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip.strip()
        return request.client.host if request.client else "unknown"

    def _prune_stale_ips(self, now: float) -> None:
        """Periodically clean empty IP buckets to prevent unbounded memory growth."""
        if now - self._last_cleanup > 300:  # Every 5 minutes
            stale = [ip for ip, timestamps in self._requests.items() if not timestamps or (now - timestamps[-1] >= self.window)]
            for ip in stale:
                self._requests.pop(ip, None)
            self._last_cleanup = now

    async def dispatch(self, request: Request, call_next):
        # Always bypass rate limiting for CORS preflight (OPTIONS) and health check
        if request.method == "OPTIONS" or request.url.path.startswith("/api/health"):
            return await call_next(request)

        # In development mode, provide generous headroom for single-user dev
        effective_limit = (
            max(self.max_requests, 600)
            if settings.environment == "development"
            else self.max_requests
        )

        client_ip = self._extract_client_ip(request)
        now = time.monotonic()

        # Clean old entries outside the window
        valid_timestamps = [t for t in self._requests[client_ip] if now - t < self.window]

        if len(valid_timestamps) >= effective_limit:
            return JSONResponse(
                status_code=429,
                content={"success": False, "message": "Too many requests. Please try again later."},
            )

        valid_timestamps.append(now)
        self._requests[client_ip] = valid_timestamps

        self._prune_stale_ips(now)
        return await call_next(request)
