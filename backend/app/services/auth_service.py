"""Auth service - business logic for authentication."""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_refresh_token
from app.core.exceptions import UnauthorizedError, DuplicateError
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import TokenResponse


class AuthService:
    def __init__(self, db: AsyncSession) -> None:
        self.repo = UserRepository(db)

    async def register(self, full_name: str, email: str, password: str) -> User:
        existing = await self.repo.get_by_email(email)
        if existing:
            raise DuplicateError("An account with this email already exists.")

        user = User(
            full_name=full_name,
            email=email,
            password_hash=hash_password(password),
        )
        return await self.repo.create(user)

    async def login(self, email: str, password: str) -> TokenResponse:
        user = await self.repo.get_by_email(email)
        if not user or not verify_password(password, user.password_hash):
            raise UnauthorizedError("Invalid email or password.")

        access_token = create_access_token({"sub": str(user.id)})
        refresh_token = create_refresh_token({"sub": str(user.id)})

        return TokenResponse(access_token=access_token, refresh_token=refresh_token)

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
