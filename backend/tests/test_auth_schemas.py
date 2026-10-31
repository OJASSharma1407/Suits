"""Tests for auth schemas and password strength validation."""

import pytest
from pydantic import ValidationError
from app.schemas.auth import RegisterRequest, LoginRequest, validate_password_strength
from app.schemas.user import ChangePasswordRequest


def test_password_strength_valid():
    """Verify strong passwords are accepted."""
    assert validate_password_strength("LegalTech#2026") == "LegalTech#2026"
    assert validate_password_strength("MySecureP@ssw0rd") == "MySecureP@ssw0rd"


def test_password_strength_rejects_weak():
    """Verify weak passwords fail validation."""
    with pytest.raises(ValueError, match="at least 8 characters"):
        validate_password_strength("short")

    with pytest.raises(ValueError, match="uppercase letter"):
        validate_password_strength("alllowercase123!")

    with pytest.raises(ValueError, match="lowercase letter"):
        validate_password_strength("ALLUPPERCASE123!")

    with pytest.raises(ValueError, match="number"):
        validate_password_strength("NoNumbersHere!")

    with pytest.raises(ValueError, match="special character"):
        validate_password_strength("NoSpecialChar123")


def test_register_request_validation():
    """Verify RegisterRequest enforces password strength."""
    # Valid
    req = RegisterRequest(
        full_name="Advocate Sharma",
        email="sharma@example.com",
        password="SecurePass#123",
    )
    assert req.email == "sharma@example.com"

    # Weak password raises ValidationError
    with pytest.raises(ValidationError):
        RegisterRequest(
            full_name="Advocate Sharma",
            email="sharma@example.com",
            password="weakpassword",
        )


def test_change_password_request_validation():
    """Verify ChangePasswordRequest enforces strength on new_password."""
    with pytest.raises(ValidationError):
        ChangePasswordRequest(
            current_password="OldPassword123!",
            new_password="123",
        )

    req = ChangePasswordRequest(
        current_password="OldPassword123!",
        new_password="NewP@ssw0rd2026",
    )
    assert req.new_password == "NewP@ssw0rd2026"
