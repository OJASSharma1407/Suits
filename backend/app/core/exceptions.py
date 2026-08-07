"""SUITS Backend - Custom exception classes.

Standardized exceptions for the three error layers:
validation, business logic, and external API errors.
"""

from fastapi import HTTPException, status


class SuitsBaseException(HTTPException):
    """Base exception for all SUITS errors."""

    def __init__(
        self,
        status_code: int,
        detail: str,
        error_code: str = "UNKNOWN_ERROR",
    ):
        super().__init__(status_code=status_code, detail=detail)
        self.error_code = error_code


# --- Validation Errors ---

class ValidationError(SuitsBaseException):
    """Raised when input validation fails."""

    def __init__(self, detail: str = "Invalid input provided."):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail,
            error_code="VALIDATION_ERROR",
        )


class InvalidCNRError(SuitsBaseException):
    """Raised when a CNR does not match the expected format."""

    def __init__(self, cnr: str = ""):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid Case Number: {cnr}" if cnr else "Invalid Case Number.",
            error_code="INVALID_CNR",
        )


# --- Business Logic Errors ---

class NotFoundError(SuitsBaseException):
    """Raised when a requested resource does not exist."""

    def __init__(self, resource: str = "Resource"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource} not found.",
            error_code="NOT_FOUND",
        )


class DuplicateError(SuitsBaseException):
    """Raised when attempting to create a duplicate resource."""

    def __init__(self, detail: str = "Resource already exists."):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
            error_code="DUPLICATE",
        )


class UnauthorizedError(SuitsBaseException):
    """Raised when authentication fails."""

    def __init__(self, detail: str = "Invalid credentials."):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            error_code="UNAUTHORIZED",
        )


class ForbiddenError(SuitsBaseException):
    """Raised when the user lacks required permissions."""

    def __init__(self, detail: str = "Insufficient permissions."):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            error_code="FORBIDDEN",
        )


# --- External API Errors ---

class ECourtsAPIError(SuitsBaseException):
    """Raised when the eCourts API returns an error."""

    def __init__(self, detail: str = "Unable to retrieve court data. Please try again later."):
        super().__init__(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=detail,
            error_code="ECOURTS_API_ERROR",
        )


class GeminiAPIError(SuitsBaseException):
    """Raised when the Gemini AI API returns an error."""

    def __init__(self, detail: str = "AI service is temporarily unavailable."):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=detail,
            error_code="GEMINI_API_ERROR",
        )


class RateLimitError(SuitsBaseException):
    """Raised when rate limits are exceeded."""

    def __init__(self, detail: str = "Too many requests. Please try again later."):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=detail,
            error_code="RATE_LIMITED",
        )
