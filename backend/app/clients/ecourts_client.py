"""eCourts Partner API Client.

Handles authentication, retry logic, rate limiting, and error parsing
for all eCourts Partner API endpoints.
"""

import time
import hashlib
import json
from typing import Any

import httpx
import structlog

from app.core.config import settings
from app.core.exceptions import ECourtsAPIError, RateLimitError

logger = structlog.get_logger()

# Fast fail: eCourts either responds instantly or is down. No retries.
RETRY_DELAYS: list[int] = []
RETRYABLE_STATUS_CODES = {429, 500}
NON_RETRYABLE_STATUS_CODES = {400, 401, 404}


class ECourtsClient:
    """Client for the eCourts Partner API with built-in caching, retry, and error handling."""

    def __init__(self) -> None:
        self.base_url = settings.ecourts_base_url.rstrip("/")
        self.api_key = settings.ecourts_api_key
        self._client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                # Fast timeout: 2 seconds maximum per request
                timeout=httpx.Timeout(2.0),
            )
        return self._client

    async def close(self) -> None:
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    @staticmethod
    def _cache_key(endpoint: str, params: dict | None = None) -> str:
        """Generate a deterministic cache key for an API request."""
        raw = f"{endpoint}:{json.dumps(params or {}, sort_keys=True)}"
        return hashlib.md5(raw.encode()).hexdigest()

    async def _request(
        self,
        method: str,
        endpoint: str,
        params: dict[str, Any] | None = None,
        json_body: dict[str, Any] | None = None,
    ) -> httpx.Response:
        """Execute an HTTP request with fast retry logic and error handling."""
        client = await self._get_client()
        last_exception: Exception | None = None

        for attempt, delay in enumerate(RETRY_DELAYS + [0], start=1):
            start_time = time.monotonic()
            try:
                if method.upper() == "GET":
                    response = await client.get(endpoint, params=params)
                elif method.upper() == "POST":
                    response = await client.post(endpoint, params=params, json=json_body)
                else:
                    raise ValueError(f"Unsupported HTTP method: {method}")

                elapsed_ms = (time.monotonic() - start_time) * 1000

                if response.status_code == 200:
                    logger.info(
                        "ecourts_api_success",
                        endpoint=endpoint,
                        status=response.status_code,
                        elapsed_ms=round(elapsed_ms, 2),
                    )
                    return response

                if response.status_code in NON_RETRYABLE_STATUS_CODES:
                    logger.warning(
                        "ecourts_api_non_retryable_error",
                        endpoint=endpoint,
                        status=response.status_code,
                    )
                    if response.status_code == 401:
                        raise ECourtsAPIError("Authentication failed with eCourts API.")
                    if response.status_code == 404:
                        raise ECourtsAPIError("Requested resource not found on eCourts.")
                    raise ECourtsAPIError(f"eCourts API error: {response.status_code}")

                if response.status_code in RETRYABLE_STATUS_CODES:
                    logger.warning(
                        "ecourts_api_retryable_error",
                        endpoint=endpoint,
                        status=response.status_code,
                        attempt=attempt,
                    )
                    if response.status_code == 429 and attempt > len(RETRY_DELAYS):
                        raise RateLimitError()
                    last_exception = ECourtsAPIError(
                        f"eCourts API returned {response.status_code}"
                    )

            except (httpx.RequestError, httpx.TimeoutException) as exc:
                logger.warning("ecourts_api_request_failed", error=str(exc), attempt=attempt)
                last_exception = ECourtsAPIError("Connection to eCourts API timed out or failed.")
                # Connection failed, fail fast instead of blocking
                break

            if delay > 0 and attempt <= len(RETRY_DELAYS):
                import asyncio
                await asyncio.sleep(delay)

        raise last_exception or ECourtsAPIError()

    # --- Public API Methods ---

    async def search_cases(self, params: dict[str, Any]) -> dict[str, Any]:
        """GET /api/partner/search"""
        response = await self._request("GET", "/api/partner/search", params=params)
        return response.json()

    async def get_case_details(self, cnr: str) -> dict[str, Any]:
        """GET /api/partner/case/{cnr}"""
        response = await self._request("GET", f"/api/partner/case/{cnr}")
        return response.json()

    async def refresh_case(self, cnr: str) -> dict[str, Any]:
        """POST /api/partner/case/{cnr}/refresh"""
        response = await self._request("POST", f"/api/partner/case/{cnr}/refresh")
        return response.json()

    async def get_order_download(self, cnr: str, filename: str) -> bytes:
        """GET /api/partner/case/{cnr}/order/{filename} - Returns PDF bytes."""
        response = await self._request("GET", f"/api/partner/case/{cnr}/order/{filename}")
        return response.content

    async def get_order_markdown(self, cnr: str, filename: str) -> dict[str, Any]:
        """GET /api/partner/case/{cnr}/order-markdown/{filename}"""
        response = await self._request("GET", f"/api/partner/case/{cnr}/order-markdown/{filename}")
        return response.json()

    async def get_order_ai(self, cnr: str, filename: str) -> dict[str, Any]:
        """GET /api/partner/case/{cnr}/order-ai/{filename}"""
        response = await self._request("GET", f"/api/partner/case/{cnr}/order-ai/{filename}")
        return response.json()

    async def get_court_structure(self) -> dict[str, Any]:
        """GET /api/partner/court-structure"""
        response = await self._request("GET", "/api/partner/court-structure")
        return response.json()

    async def get_enums(self) -> dict[str, Any]:
        """GET /api/partner/enums"""
        response = await self._request("GET", "/api/partner/enums")
        return response.json()

    async def get_search_capabilities(self) -> dict[str, Any]:
        """GET /api/partner/search/capabilities"""
        response = await self._request("GET", "/api/partner/search/capabilities")
        return response.json()

    async def get_available_dates(self, court_code: str) -> dict[str, Any]:
        """GET /api/partner/cause-list/available-dates"""
        response = await self._request(
            "GET", "/api/partner/cause-list/available-dates", params={"courtCode": court_code}
        )
        return response.json()

    async def get_cause_list(self, court_code: str, date: str) -> dict[str, Any]:
        """GET /api/partner/cause-list/search"""
        response = await self._request(
            "GET", "/api/partner/cause-list/search",
            params={"courtCode": court_code, "date": date},
        )
        return response.json()

    async def validate_cnr(self, cnrs: list[str]) -> dict[str, Any]:
        """POST /api/partner/cnr/check"""
        response = await self._request("POST", "/api/partner/cnr/check", json_body={"cnrs": cnrs})
        return response.json()

    async def bulk_refresh(self, cnrs: list[str]) -> dict[str, Any]:
        """POST /api/partner/case/refresh/bulk"""
        response = await self._request(
            "POST", "/api/partner/case/refresh/bulk", json_body={"cnrs": cnrs}
        )
        return response.json()

    async def get_bulk_refresh_status(self, request_id: str) -> dict[str, Any]:
        """GET /api/partner/case/refresh/bulk/{requestId}"""
        response = await self._request("GET", f"/api/partner/case/refresh/bulk/{request_id}")
        return response.json()


# Singleton instance
ecourts_client = ECourtsClient()
