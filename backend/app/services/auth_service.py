"""Auth service - business logic for authentication, Google OAuth, and Email OTP verification."""

import uuid
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional

from sqlalchemy import select, update, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession
import structlog
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from app.core.config import settings
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_refresh_token
from app.core.exceptions import UnauthorizedError, DuplicateError, ForbiddenError, ValidationError
from app.models.user import User
from app.models.email_verification import EmailVerification
from app.repositories.user_repository import UserRepository
from app.schemas.auth import TokenResponse
from app.schemas.user import UserResponse
from app.services.email_service import email_service

logger = structlog.get_logger()


class AuthService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = UserRepository(db)

    async def register(self, full_name: str, email: str, password: str) -> User:
        """Register a new user in unverified state and dispatch OTP verification email."""
        clean_email = email.strip().lower()
        existing = await self.repo.get_by_email(clean_email)
        
        if existing:
            if not existing.is_verified:
                # User previously registered but didn't verify: update info and re-send OTP
                existing.full_name = full_name
                existing.password_hash = hash_password(password)
                await self.db.flush()
                await self._generate_and_send_otp(clean_email, full_name=full_name)
                return existing
            raise DuplicateError("An account with this email already exists.")

        user = User(
            full_name=full_name,
            email=clean_email,
            password_hash=hash_password(password),
            is_verified=False,
            auth_provider="local",
        )
        created_user = await self.repo.create(user)

        # Generate and send 6-digit OTP
        await self._generate_and_send_otp(clean_email, full_name=full_name)

        return created_user

    async def _generate_and_send_otp(self, email: str, full_name: Optional[str] = None, purpose: str = "register") -> str:
        """Internal helper to create an OTP record and dispatch email."""
        # Invalidate existing active OTPs for this email and purpose
        await self.db.execute(
            update(EmailVerification)
            .where(and_(EmailVerification.email == email, EmailVerification.purpose == purpose, EmailVerification.is_used == False))
            .values(is_used=True)
        )

        otp = email_service.generate_otp()
        otp_hash = email_service.hash_otp(otp)
        expires_at = email_service.get_otp_expiry()

        record = EmailVerification(
            email=email,
            otp_hash=otp_hash,
            purpose=purpose,
            expires_at=expires_at,
            is_used=False,
            attempts=0,
        )
        self.db.add(record)
        await self.db.flush()

        # Send email (or log to dev console)
        await email_service.send_verification_otp(email=email, otp=otp, full_name=full_name)
        return otp

    async def verify_otp(self, email: str, otp: str, purpose: str = "register") -> dict:
        """Verify the 6-digit OTP and activate user account."""
        clean_email = email.strip().lower()

        # Find latest unused verification record
        result = await self.db.execute(
            select(EmailVerification)
            .where(
                and_(
                    EmailVerification.email == clean_email,
                    EmailVerification.purpose == purpose,
                    EmailVerification.is_used == False,
                )
            )
            .order_by(desc(EmailVerification.created_at))
        )
        record = result.scalars().first()

        if not record:
            raise ValidationError("No active verification code found for this email. Please request a new code.")

        # Check maximum attempts (brute force protection)
        if record.attempts >= 5:
            record.is_used = True
            await self.db.flush()
            raise ValidationError("Too many incorrect attempts. Please request a new verification code.")

        # Check expiration
        now = datetime.now(timezone.utc)
        record_expiry = record.expires_at
        if record_expiry.tzinfo is None:
            record_expiry = record_expiry.replace(tzinfo=timezone.utc)

        if now > record_expiry:
            record.is_used = True
            await self.db.flush()
            raise ValidationError("Verification code has expired. Please request a new one.")

        # Check OTP match
        if not email_service.verify_otp_hash(otp, record.otp_hash):
            record.attempts += 1
            await self.db.flush()
            remaining = 5 - record.attempts
            raise ValidationError(f"Invalid verification code. {remaining} attempt(s) remaining.")

        # Mark OTP as successfully used
        record.is_used = True

        # Activate user
        user = await self.repo.get_by_email(clean_email)
        if not user:
            raise ValidationError("User account not found.")

        user.is_verified = True
        await self.db.flush()

        # Generate JWT tokens
        access_token = create_access_token({"sub": str(user.id)})
        refresh_token = create_refresh_token({"sub": str(user.id)})

        return {
            "user": UserResponse.model_validate(user),
            "tokens": TokenResponse(access_token=access_token, refresh_token=refresh_token),
        }

    async def resend_otp(self, email: str, purpose: str = "register") -> bool:
        """Resend a new 6-digit OTP with 60-second cooldown protection."""
        clean_email = email.strip().lower()
        user = await self.repo.get_by_email(clean_email)
        if not user:
            raise ValidationError("Account with this email does not exist.")

        if user.is_verified and purpose == "register":
            raise ValidationError("This email is already verified. You can log in directly.")

        # Check rate-limit / cooldown (minimum 60 seconds between resends)
        result = await self.db.execute(
            select(EmailVerification)
            .where(
                and_(
                    EmailVerification.email == clean_email,
                    EmailVerification.purpose == purpose,
                )
            )
            .order_by(desc(EmailVerification.created_at))
        )
        latest_record = result.scalars().first()

        if latest_record:
            created_at = latest_record.created_at
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)
            seconds_since = (datetime.now(timezone.utc) - created_at).total_seconds()
            if seconds_since < 60:
                remaining_secs = int(60 - seconds_since)
                raise ValidationError(f"Please wait {remaining_secs} seconds before requesting a new code.")

        await self._generate_and_send_otp(clean_email, full_name=user.full_name, purpose=purpose)
        return True

    async def login(self, email: str, password: str) -> TokenResponse:
        """Authenticate user with email + password, enforcing email verification."""
        clean_email = email.strip().lower()
        user = await self.repo.get_by_email(clean_email)
        
        if not user or not user.password_hash:
            raise UnauthorizedError("Invalid email or password.")

        if user.password_hash.startswith("oauth:"):
            raise UnauthorizedError("This account was created with Google Sign-In. Please click 'Continue with Google'.")

        if not verify_password(password, user.password_hash):
            raise UnauthorizedError("Invalid email or password.")

        if not user.is_verified:
            # Re-dispatch verification email automatically so user has a fresh code
            try:
                await self._generate_and_send_otp(clean_email, full_name=user.full_name)
            except Exception:
                pass
            raise ForbiddenError("Please verify your email address to continue. A verification code has been sent.")

        access_token = create_access_token({"sub": str(user.id)})
        refresh_token = create_refresh_token({"sub": str(user.id)})

        return TokenResponse(access_token=access_token, refresh_token=refresh_token)

    async def google_auth(self, credential_jwt: str) -> dict:
        """Authenticate or register user via Google ID Token."""
        try:
            # Verify the token against Google's public keys
            # When GOOGLE_CLIENT_ID is set in config, verify audience matches
            client_id = settings.google_client_id if settings.google_client_id else None
            idinfo = id_token.verify_oauth2_token(
                credential_jwt,
                google_requests.Request(),
                audience=client_id,
            )
        except Exception as e:
            logger.warning("google_token_verification_failed", error=str(e))
            raise UnauthorizedError("Google authentication failed. Invalid token.")

        email = idinfo.get("email")
        if not email:
            raise UnauthorizedError("Google token did not contain a valid email address.")

        clean_email = email.strip().lower()
        full_name = idinfo.get("name") or clean_email.split("@")[0]
        google_sub = idinfo.get("sub")
        picture = idinfo.get("picture")

        # Check if user already exists
        user = await self.repo.get_by_email(clean_email)
        if user:
            # Link Google account if not yet linked
            user.is_verified = True  # Google has already verified the email
            if not user.google_id:
                user.google_id = google_sub
            if not user.avatar_url and picture:
                user.avatar_url = picture
            await self.db.commit()
        else:
            # Create new user via Google OAuth
            user = User(
                id=uuid.uuid4(),
                full_name=full_name,
                email=clean_email,
                password_hash=f"oauth:google:{secrets.token_urlsafe(16)}",
                is_verified=True,
                auth_provider="google",
                google_id=google_sub,
                avatar_url=picture,
            )
            user = await self.repo.create(user)
            await self.db.commit()

        logger.info("google_auth_success", email=clean_email, user_id=str(user.id))

        access_token = create_access_token({"sub": str(user.id)})
        refresh_token = create_refresh_token({"sub": str(user.id)})

        return {
            "user": UserResponse.model_validate(user),
            "tokens": TokenResponse(access_token=access_token, refresh_token=refresh_token),
        }

    async def refresh_tokens(self, refresh_token: str) -> TokenResponse:
        payload = decode_refresh_token(refresh_token)
        if not payload:
            raise UnauthorizedError("Invalid or expired refresh token.")

        user_id = payload.get("sub")
        user = await self.repo.get_by_id(uuid.UUID(user_id))
        if not user:
            raise UnauthorizedError("User not found.")

        new_access = create_access_token({"sub": str(user.id)})
        new_refresh = create_refresh_token({"sub": str(user.id)})

        return TokenResponse(access_token=new_access, refresh_token=new_refresh)
