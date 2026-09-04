"""SUITS Backend - FastAPI Application Entry Point."""

from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.exceptions import SuitsBaseException
from app.middleware.logging import RequestLoggingMiddleware
from app.middleware.rate_limit import RateLimitMiddleware
from app.api import auth, search, cases, orders, chat, bookmarks, history, analytics, files, documents
from app.clients.ecourts_client import ecourts_client
from app.services.cache_service import cache_service
from app.database.session import engine, init_db
from app.database.base import Base
from sqlalchemy import text

# Import all models to ensure they are registered with Base.metadata
import app.models  # noqa: F401

import logging

_log_level = getattr(logging, settings.log_level.upper(), logging.INFO)

structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.add_log_level,
        structlog.dev.ConsoleRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(_log_level),
)

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    logger.info("suits_starting", environment=settings.environment)

    # Automatically create database tables and migrate SQLite schema
    await init_db()
    try:
        async with engine.begin() as conn:
            await conn.execute(
                text("""
                    DELETE FROM cached_orders
                    WHERE markdown LIKE '*PDF extraction failed%'
                    OR markdown LIKE '*This court order%'
                    OR markdown LIKE '%could not be retrieved%'
                """)
            )
            await conn.execute(
                text("""
                    DELETE FROM cached_ai_analysis
                    WHERE ai_json LIKE '%"extractionConfidence": 0.0%'
                    AND (
                        ai_json LIKE '%could not be analyzed%'
                        OR ai_json LIKE '%unavailable%'
                    )
                """)
            )
    except Exception as exc:
        logger.warning("startup_cache_cleanup_skipped", error=str(exc))

    yield

    # Cleanup
    await ecourts_client.close()
    await cache_service.close()
    logger.info("suits_stopped")


app = FastAPI(
    title="SUITS API",
    description="AI-Powered Court Intelligence & Legal Research Platform",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.environment == "development" else None,
    redoc_url="/redoc" if settings.environment == "development" else None,
)

# --- Middleware (order matters: last added = first executed) ---

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=r"^https?://(?:localhost|127\.0\.0\.1)(?::\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(RateLimitMiddleware)

# --- Global Exception Handler ---

@app.exception_handler(SuitsBaseException)
async def suits_exception_handler(request: Request, exc: SuitsBaseException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.detail,
            "error_code": exc.error_code,
        },
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("unhandled_exception", error=str(exc), path=request.url.path)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "An unexpected error occurred.",
            "error_code": "INTERNAL_ERROR",
        },
    )

# --- Routers ---

app.include_router(auth.router, prefix="/api")
app.include_router(search.router, prefix="/api")
app.include_router(cases.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(bookmarks.router, prefix="/api")
app.include_router(history.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(files.router, prefix="/api")
app.include_router(documents.router, prefix="/api")


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}
