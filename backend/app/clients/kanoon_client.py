"""Indian Kanoon API Client.

Implements the official IK API per documentation at api.indiankanoon.org.
Authentication: Token-based (Authorization: Token <token>)
All requests are POST. JSON returned via Accept: application/json header.
"""

import json
import time
from typing import Any

import httpx
import structlog

from app.core.config import settings
from app.core.exceptions import ECourtsAPIError

logger = structlog.get_logger()

# Retry config
RETRY_DELAYS = [1, 2]
RETRYABLE_STATUS_CODES = {429, 500, 502, 503, 504}
NON_RETRYABLE_STATUS_CODES = {400, 401, 403, 404}


class KanoonClient:
    """Client for the Indian Kanoon API (api.indiankanoon.org).
    
    All endpoints are POST requests. JSON format is requested via Accept header.
    Authentication is done via "Authorization: Token <token>" header.
    """

    BASE_URL = "https://api.indiankanoon.org"

    def __init__(self) -> None:
        self.api_token = settings.kanoon_api_token
        self._client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            headers = {
                # Per docs: JSON format requested via Accept header
                "Accept": "application/json",
            }
            if self.api_token and self.api_token != "your-kanoon-api-token-here":
                # Per docs: "Authorization: Token <your_own_token>"
                headers["Authorization"] = f"Token {self.api_token}"
            else:
                logger.warning(
                    "kanoon_token_missing",
                    hint="Set KANOON_API_TOKEN in .env. Get token at api.indiankanoon.org"
                )
            self._client = httpx.AsyncClient(
                base_url=self.BASE_URL,
                headers=headers,
                timeout=httpx.Timeout(15.0),
            )
        return self._client

    async def close(self) -> None:
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    async def _request(self, endpoint: str, params: dict[str, Any] | None = None) -> Any:
        """POST to a Kanoon API endpoint with retry logic.
        
        Per docs: All API requests use POST method.
        Parameters are sent in the URL (query string).
        """
        client = await self._get_client()
        attempts = [0] + RETRY_DELAYS

        for attempt, delay in enumerate(attempts):
            if delay:
                time.sleep(delay)
            try:
                # Kanoon requires POST, but parameters go in the URL query string
                response = await client.post(endpoint, params=params or {})

                if response.status_code == 200:
                    content_type = response.headers.get("content-type", "")
                    if "json" in content_type or response.text.strip().startswith("{"):
                        try:
                            return response.json()
                        except json.JSONDecodeError:
                            return {"raw": response.text}
                    # Return raw text if not JSON (shouldn't happen with Accept: application/json)
                    return {"raw": response.text}

                if response.status_code in NON_RETRYABLE_STATUS_CODES:
                    logger.error(
                        "kanoon_api_client_error",
                        status=response.status_code,
                        url=endpoint,
                        text=response.text[:500],
                    )
                    raise ECourtsAPIError(
                        f"Indian Kanoon API Error {response.status_code} for {endpoint}"
                    )

                if response.status_code in RETRYABLE_STATUS_CODES:
                    logger.warning(
                        "kanoon_api_server_error",
                        status=response.status_code,
                        url=endpoint,
                        attempt=attempt,
                    )
                    continue

                response.raise_for_status()

            except httpx.RequestError as exc:
                logger.warning("kanoon_api_connection_error", error=str(exc), url=endpoint)
                if attempt < len(attempts) - 1:
                    continue
                raise ECourtsAPIError(f"Connection error reaching Indian Kanoon API: {exc}") from exc

        raise ECourtsAPIError(f"Indian Kanoon API failed after {len(attempts)} attempts: {endpoint}")

    async def search_docs(
        self,
        query: str,
        pagenum: int = 1,
        doctypes: str | None = None,
        fromdate: str | None = None,
        todate: str | None = None,
        author: str | None = None,
        bench: str | None = None,
    ) -> dict[str, Any]:
        """Search Indian Kanoon.

        Per docs: GET /search/?formInput=<query>&pagenum=<pagenum>
        pagenum starts at 0 for the first page.

        Response fields:
          - found: total number of results
          - docs: list of {tid, title, headline, docsource, docsize}
          - categories: facets
        """
        # Kanoon pagenum is 0-indexed; our page param is 1-indexed
        kanoon_page = max(0, pagenum - 1)

        # Build formInput — supports IK operators (ANDD, ORR, NOTT)
        form_input = query.strip()

        # Append filter parameters directly to formInput per IK docs
        if doctypes:
            form_input += f" doctypes:{doctypes}"
        if fromdate:
            form_input += f" fromdate:{fromdate}"
        if todate:
            form_input += f" todate:{todate}"
        if author:
            form_input += f" author:{author}"
        if bench:
            form_input += f" bench:{bench}"

        params = {
            "formInput": form_input,
            "pagenum": kanoon_page,
        }

        logger.info("kanoon_search", query=form_input, page=kanoon_page)
        result = await self._request("/search/", params=params)
        return result if isinstance(result, dict) else {}

    async def get_doc(self, tid: str | int, maxcites: int = 5) -> dict[str, Any]:
        """Fetch full document text and metadata from Kanoon.

        Per docs: POST /doc/<docid>/
        Response fields:
          - doc: HTML content of the judgment
          - title: case title
          - tid: document ID
          - citeList: top documents cited by this one
          - citedbyList: top documents that cite this one
        """
        params = {"maxcites": maxcites}
        logger.info("kanoon_get_doc", tid=tid)
        result = await self._request(f"/doc/{tid}/", params=params)
        return result if isinstance(result, dict) else {}

    async def get_doc_meta(self, tid: str | int) -> dict[str, Any]:
        """Fetch metadata only (no full document text).

        Per docs: POST /docmeta/<docid>/
        """
        logger.info("kanoon_get_doc_meta", tid=tid)
        result = await self._request(f"/docmeta/{tid}/")
        return result if isinstance(result, dict) else {}

    async def get_doc_fragment(self, tid: str | int, query: str) -> dict[str, Any]:
        """Fetch document fragment matching a query.

        Per docs: POST /docfragment/<docid>/?formInput=<query>
        Response fields:
          - headline: matching fragment HTML
          - title: document title
          - tid: document ID
        """
        params = {"formInput": query}
        logger.info("kanoon_get_doc_fragment", tid=tid, query=query)
        result = await self._request(f"/docfragment/{tid}/", params=params)
        return result if isinstance(result, dict) else {}

    async def get_orig_doc_bytes(self, tid: str | int) -> bytes | None:
        """Fetch the original court copy (PDF/HTML) as bytes.
        
        Per docs: POST /origdoc/<docid>/
        """
        logger.info("kanoon_get_origdoc", tid=tid)
        client = await self._get_client()
        try:
            # We don't want JSON here, we want the raw file bytes
            # We must override the Accept header since _get_client sets it to application/json
            headers = dict(client.headers)
            headers["Accept"] = "*/*"
            
            response = await client.post(f"/origdoc/{tid}/", headers=headers)
            if response.status_code == 200:
                content = response.content
                if not content.startswith(b'%PDF-'):
                    # The original doc is HTML/text, so let's use Kanoon's website PDF generator
                    logger.info("kanoon_origdoc_is_html_falling_back_to_generator", tid=tid)
                    import httpx
                    async with httpx.AsyncClient(follow_redirects=True) as public_client:
                        pdf_resp = await public_client.get(
                            "https://indiankanoon.org/doc/" + str(tid) + "/?type=pdf",
                            headers={
                                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                                "Referer": f"https://indiankanoon.org/doc/{tid}/",
                                "Origin": "https://indiankanoon.org",
                                "Accept": "application/pdf,application/xhtml+xml,text/html,*/*"
                            }
                        )
                        if pdf_resp.status_code == 200 and b'%PDF-' in pdf_resp.content[:1024]:
                            return pdf_resp.content
                return content
            
            logger.error(
                "kanoon_origdoc_failed",
                status=response.status_code,
                text=response.text[:500]
            )
            return None
        except Exception as exc:
            logger.error("kanoon_origdoc_error", error=str(exc))
            return None

kanoon_client = KanoonClient()
