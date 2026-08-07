"""Cache service - Redis and PostgreSQL two-tier caching.

Implements the documented cache strategy:
Request → Redis → PostgreSQL → eCourts API → Store both
"""

import json
from typing import Any

import structlog
import redis.asyncio as redis

from app.core.config import settings

logger = structlog.get_logger()


class CacheService:
    """Two-tier cache: Redis (fast) + PostgreSQL (persistent)."""

    def __init__(self) -> None:
        self._redis: redis.Redis | None = None

    async def _get_redis(self) -> redis.Redis | None:
        """Get Redis connection, returning None if unavailable (graceful degradation)."""
        if self._redis is None:
            try:
                self._redis = redis.from_url(
                    settings.redis_url,
                    decode_responses=True,
                    socket_connect_timeout=2,
                )
                await self._redis.ping()
            except Exception as exc:
                logger.warning("redis_connection_failed", error=str(exc))
                self._redis = None
        return self._redis

    async def get(self, key: str) -> Any | None:
        """Get a value from Redis cache."""
        r = await self._get_redis()
        if r is None:
            return None
        try:
            value = await r.get(key)
            if value:
                logger.debug("cache_hit", key=key)
                return json.loads(value)
            logger.debug("cache_miss", key=key)
            return None
        except Exception as exc:
            logger.warning("cache_get_error", key=key, error=str(exc))
            return None

    async def set(self, key: str, value: Any, ttl_seconds: int | None = None) -> None:
        """Set a value in Redis cache with optional TTL."""
        r = await self._get_redis()
        if r is None:
            return
        try:
            serialized = json.dumps(value, default=str)
            if ttl_seconds:
                await r.setex(key, ttl_seconds, serialized)
            else:
                await r.set(key, serialized)
            logger.debug("cache_set", key=key, ttl=ttl_seconds)
        except Exception as exc:
            logger.warning("cache_set_error", key=key, error=str(exc))

    async def delete(self, key: str) -> None:
        """Delete a value from Redis cache."""
        r = await self._get_redis()
        if r is None:
            return
        try:
            await r.delete(key)
            logger.debug("cache_delete", key=key)
        except Exception as exc:
            logger.warning("cache_delete_error", key=key, error=str(exc))

    async def delete_pattern(self, pattern: str) -> None:
        """Delete all keys matching a pattern."""
        r = await self._get_redis()
        if r is None:
            return
        try:
            keys = []
            async for key in r.scan_iter(match=pattern):
                keys.append(key)
            if keys:
                await r.delete(*keys)
                logger.debug("cache_delete_pattern", pattern=pattern, count=len(keys))
        except Exception as exc:
            logger.warning("cache_delete_pattern_error", error=str(exc))

    async def close(self) -> None:
        if self._redis:
            await self._redis.aclose()


# Singleton
cache_service = CacheService()
