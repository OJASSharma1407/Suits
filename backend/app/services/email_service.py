"""SUITS Backend - Email & OTP Service.

Handles secure OTP generation, verification hashing, and email delivery via Resend API
with fallback to console output in development mode.
"""

import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

import structlog
from app.core.config import settings

logger = structlog.get_logger()


class EmailService:
    """Service for sending emails and managing OTP tokens."""

    @staticmethod
    def generate_otp(length: int = 6) -> str:
        """Generate a cryptographically secure 6-digit numeric OTP."""
        # Generates numbers from 100000 to 999999
        return str(secrets.randbelow(900000) + 100000)

    @staticmethod
    def hash_otp(otp: str) -> str:
        """Hash an OTP with SHA-256 for secure storage."""
        return hashlib.sha256(otp.encode("utf-8")).hexdigest()

    @staticmethod
    def verify_otp_hash(otp: str, hashed: str) -> bool:
        """Verify an OTP against its stored hash."""
        return hashlib.sha256(otp.encode("utf-8")).hexdigest() == hashed

    @staticmethod
    def get_otp_expiry() -> datetime:
        """Return the UTC expiration datetime for a new OTP."""
        return datetime.now(timezone.utc) + timedelta(minutes=settings.otp_expiry_minutes)

    @classmethod
    async def send_verification_otp(cls, email: str, otp: str, full_name: Optional[str] = None) -> bool:
        """Send a 6-digit verification OTP email to the user.

        If RESEND_API_KEY is configured, sends via Resend REST API.
        Otherwise (or in development), logs the OTP prominently to the console.
        """
        greeting_name = full_name if full_name else "Legal Scholar"
        subject = f"{otp} is your SUITS verification code"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #030712; color: #f9fafb; margin: 0; padding: 40px 20px; }}
            .card {{ max-width: 520px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 36px 32px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }}
            .logo {{ font-size: 24px; font-weight: 800; letter-spacing: 2px; color: #38bdf8; text-transform: uppercase; margin-bottom: 24px; }}
            .title {{ font-size: 20px; font-weight: 700; color: #ffffff; margin-bottom: 12px; }}
            .text {{ font-size: 15px; color: #9ca3af; line-height: 1.6; margin-bottom: 24px; }}
            .otp-box {{ background: linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(129, 140, 248, 0.1)); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 12px; padding: 20px; text-align: center; margin: 28px 0; }}
            .otp-code {{ font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; font-family: monospace; }}
            .footer {{ font-size: 12px; color: #6b7280; text-align: center; margin-top: 32px; border-top: 1px solid #1f2937; padding-top: 20px; }}
          </style>
        </head>
        <body>
          <div class="card">
            <div class="logo">SUITS</div>
            <div class="title">Verify Your Email Address</div>
            <div class="text">Hello {greeting_name},<br>Welcome to SUITS. Please use the verification code below to verify your email and activate your account.</div>
            <div class="otp-box">
              <div class="otp-code">{otp}</div>
            </div>
            <div class="text" style="font-size: 13px;">This code will expire in <strong>{settings.otp_expiry_minutes} minutes</strong>. If you did not request this, please ignore this email.</div>
            <div class="footer">© {datetime.now(timezone.utc).year} SUITS AI Legal Research. All rights reserved.</div>
          </div>
        </body>
        </html>
        """

        # Log OTP to developer console
        logger.info(
            "email_verification_code",
            recipient=email,
            otp=otp,
            expiry_minutes=settings.otp_expiry_minutes,
            has_resend_api_key=bool(settings.resend_api_key),
        )

        if settings.resend_api_key:
            try:
                import resend
                resend.api_key = settings.resend_api_key

                params = {
                    "from": settings.email_from,
                    "to": [email],
                    "subject": subject,
                    "html": html_content,
                }
                resend.Emails.send(params)
                logger.info("email_sent_via_resend", recipient=email)
                return True
            except Exception as e:
                logger.error("resend_send_failed", error=str(e), recipient=email)
                # Still return True in dev so login flow isn't blocked if network/API fails
                if settings.environment == "development":
                    return True
                raise

        return True


email_service = EmailService()
