"""Cache service - Two-tier caching with Redis and in-memory fallback.

Implements the documented cache strategy:
Request → In-Memory / Redis → PostgreSQL → External API → Store both
"""

import json
import time
from typing import Any

import structlog
import redis.asyncio as redis

from app.core.config import settings

logger = structlog.get_logger()


class CacheService:
    """Two-tier cache: In-Memory / Redis (fast) + PostgreSQL (persistent)."""

    def __init__(self) -> None:
        self._redis: redis.Redis | None = None
        self._memory_cache: dict[str, tuple[float | None, Any]] = {}

    async def _get_redis(self) -> redis.Redis | None:
        """Get Redis connection, returning None if unavailable (graceful degradation)."""
        if self._redis is None:
            try:
                self._redis = redis.from_url(
                    settings.redis_url,
                    decode_responses=True,
                    socket_connect_timeout=1,
                )
                await self._redis.ping()
            except Exception as exc:
                logger.debug("redis_connection_unavailable_using_memory", error=str(exc))
                self._redis = None
        return self._redis

    async def get(self, key: str) -> Any | None:
        """Get a value from cache (checking Redis and in-memory fallback)."""
        # 1. Check in-memory fast cache first
        if key in self._memory_cache:
            expiry, val = self._memory_cache[key]
            if expiry is None or time.time() < expiry:
                logger.debug("memory_cache_hit", key=key)
                return val
            else:
                del self._memory_cache[key]

        # 2. Check Redis if available
        r = await self._get_redis()
        if r is not None:
            try:
                value = await r.get(key)
                if value:
                    logger.debug("redis_cache_hit", key=key)
                    parsed = json.loads(value)
                    self._memory_cache[key] = (time.time() + 3600, parsed)
                    return parsed
            except Exception as exc:
                logger.debug("redis_cache_get_error", key=key, error=str(exc))

        return None

    async def set(self, key: str, value: Any, ttl_seconds: int | None = None) -> None:
        """Set a value in cache (both in-memory and Redis)."""
        # 1. Save to in-memory cache
        expiry = time.time() + ttl_seconds if ttl_seconds else None
        self._memory_cache[key] = (expiry, value)

        # 2. Save to Redis if available
        r = await self._get_redis()
        if r is not None:
            try:
                serialized = json.dumps(value, default=str)
                if ttl_seconds:
                    await r.setex(key, ttl_seconds, serialized)
                else:
                    await r.set(key, serialized)
                logger.debug("cache_set", key=key, ttl=ttl_seconds)
            except Exception as exc:
                logger.debug("cache_set_error", key=key, error=str(exc))

    async def delete(self, key: str) -> None:
        """Delete a value from cache."""
        self._memory_cache.pop(key, None)
        r = await self._get_redis()
        if r is not None:
            try:
                await r.delete(key)
                logger.debug("cache_delete", key=key)
            except Exception as exc:
                logger.debug("cache_delete_error", key=key, error=str(exc))

    async def delete_pattern(self, pattern: str) -> None:
        """Delete all keys matching a pattern."""
        import re
        regex = re.compile(pattern.replace("*", ".*"))
        keys_to_del = [k for k in self._memory_cache if regex.match(k)]
        for k in keys_to_del:
            self._memory_cache.pop(k, None)

        r = await self._get_redis()
        if r is not None:
            try:
                keys = []
                async for key in r.scan_iter(match=pattern):
                    keys.append(key)
                if keys:
                    await r.delete(*keys)
                    logger.debug("cache_delete_pattern", pattern=pattern, count=len(keys))
            except Exception as exc:
                logger.debug("cache_delete_pattern_error", error=str(exc))

    async def close(self) -> None:
        if self._redis:
            await self._redis.aclose()


# Singleton
cache_service = CacheService()
