"""Common schemas - shared DTOs for pagination, errors, and API responses."""

from typing import Any, Generic, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    """Standard API response wrapper."""
    success: bool = True
    data: T | None = None
    message: str = ""
    error_code: str | None = None


class PaginationMeta(BaseModel):
    """Pagination metadata."""
    page: int = 1
    page_size: int = 20
    total_items: int = 0
    total_pages: int = 0


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated API response."""
    success: bool = True
    data: list[T] = []
    pagination: PaginationMeta = PaginationMeta()


class ErrorResponse(BaseModel):
    """Standard error response."""
    success: bool = False
    message: str
    error_code: str = "UNKNOWN_ERROR"
    details: dict[str, Any] | None = None
