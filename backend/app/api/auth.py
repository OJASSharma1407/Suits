"""Auth router - Login, Register, Refresh Token, Profile."""

from fastapi import APIRouter

from app.dependencies.auth import CurrentUser, DbSession
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, RefreshTokenRequest
from app.schemas.user import UserResponse, UpdateProfileRequest, ChangePasswordRequest
from app.schemas.common import APIResponse
from app.services.auth_service import AuthService
from app.core.security import hash_password, verify_password
from app.core.exceptions import UnauthorizedError

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=APIResponse[UserResponse])
async def register(request: RegisterRequest, db: DbSession):
    service = AuthService(db)
    user = await service.register(request.full_name, request.email, request.password)
    return APIResponse(data=UserResponse.model_validate(user), message="Registration successful.")


@router.post("/login", response_model=APIResponse[TokenResponse])
async def login(request: LoginRequest, db: DbSession):
    service = AuthService(db)
    tokens = await service.login(request.email, request.password)
    return APIResponse(data=tokens, message="Login successful.")


@router.post("/refresh", response_model=APIResponse[TokenResponse])
async def refresh_token(request: RefreshTokenRequest, db: DbSession):
    service = AuthService(db)
    tokens = await service.refresh_tokens(request.refresh_token)
    return APIResponse(data=tokens, message="Token refreshed.")


@router.get("/profile", response_model=APIResponse[UserResponse])
async def get_profile(user: CurrentUser):
    return APIResponse(data=UserResponse.model_validate(user))


@router.patch("/profile", response_model=APIResponse[UserResponse])
async def update_profile(request: UpdateProfileRequest, user: CurrentUser, db: DbSession):
    if request.full_name:
        user.full_name = request.full_name
    await db.commit()
    return APIResponse(data=UserResponse.model_validate(user), message="Profile updated.")


@router.post("/change-password", response_model=APIResponse)
async def change_password(request: ChangePasswordRequest, user: CurrentUser, db: DbSession):
    if not verify_password(request.current_password, user.password_hash):
        raise UnauthorizedError("Current password is incorrect.")
    user.password_hash = hash_password(request.new_password)
    await db.commit()
    return APIResponse(message="Password changed successfully.")
