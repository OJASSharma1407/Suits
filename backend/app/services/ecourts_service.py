"""eCourts service - handles court structure, enums, and reference data."""

from typing import Any

from app.clients.ecourts_client import ecourts_client
from app.core.config import settings
from app.services.cache_service import cache_service


class ECourtsService:
    """Service for court structure, enums, and reference data endpoints."""

    async def get_court_structure(self) -> dict[str, Any]:
        """Get court hierarchy with 7-day cache."""
        cache_key = "court_structure"
        cached = await cache_service.get(cache_key)
        if cached:
            return cached

        data = await ecourts_client.get_court_structure()
        await cache_service.set(cache_key, data, settings.cache_ttl_court_structure)
        return data

    async def get_enums(self) -> dict[str, Any]:
        """Get enum reference data with 24-hour cache."""
        cache_key = "enums"
        cached = await cache_service.get(cache_key)
        if cached:
            return cached

        data = await ecourts_client.get_enums()
        await cache_service.set(cache_key, data, settings.cache_ttl_enums)
        return data

    async def get_available_dates(self, court_code: str) -> dict[str, Any]:
        """Get available cause list dates with 24-hour cache."""
        cache_key = f"available_dates:{court_code}"
        cached = await cache_service.get(cache_key)
        if cached:
            return cached

        data = await ecourts_client.get_available_dates(court_code)
        await cache_service.set(cache_key, data, settings.cache_ttl_available_dates)
        return data

    async def get_cause_list(self, court_code: str, date: str) -> dict[str, Any]:
        """Get cause list with 15-minute cache."""
        cache_key = f"cause_list:{court_code}:{date}"
        cached = await cache_service.get(cache_key)
        if cached:
            return cached

        data = await ecourts_client.get_cause_list(court_code, date)
        await cache_service.set(cache_key, data, settings.cache_ttl_cause_list)
        return data

    async def validate_cnr(self, cnrs: list[str]) -> dict[str, Any]:
        """Validate CNRs with 24-hour cache."""
        cache_key = f"cnr_validation:{','.join(sorted(cnrs))}"
        cached = await cache_service.get(cache_key)
        if cached:
            return cached

        data = await ecourts_client.validate_cnr(cnrs)
        await cache_service.set(cache_key, data, settings.cache_ttl_enums)
        return data


ecourts_service = ECourtsService()
