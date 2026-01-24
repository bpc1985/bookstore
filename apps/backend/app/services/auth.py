from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserLogin, Token
from app.repositories.user import UserRepository
from app.utils.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.exceptions import (
    ConflictException,
    UnauthorizedException,
    NotFoundException,
)


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)

    async def register(self, user_data: UserCreate) -> User:
        existing_user = await self.user_repo.get_by_email(user_data.email)
        if existing_user:
            raise ConflictException("Email already registered")

        user_dict = {
            "email": user_data.email,
            "hashed_password": get_password_hash(user_data.password),
            "full_name": user_data.full_name,
            "role": UserRole.USER,
        }
        return await self.user_repo.create(user_dict)

    async def login(self, credentials: UserLogin) -> Token:
        user = await self.user_repo.get_by_email(credentials.email)
        if not user or not verify_password(credentials.password, user.hashed_password):
            raise UnauthorizedException("Invalid email or password")

        if not user.is_active:
            raise UnauthorizedException("User account is disabled")

        access_token = create_access_token(user.id)
        refresh_token = create_refresh_token(user.id)

        return Token(access_token=access_token, refresh_token=refresh_token)

    async def refresh_token(self, refresh_token: str) -> Token:
        if await self.user_repo.is_token_blacklisted(refresh_token):
            raise UnauthorizedException("Token has been revoked")

        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise UnauthorizedException("Invalid refresh token")

        user_id = int(payload.get("sub"))
        user = await self.user_repo.get(user_id)
        if not user or not user.is_active:
            raise UnauthorizedException("User not found or inactive")

        await self.user_repo.blacklist_token(refresh_token)

        new_access_token = create_access_token(user.id)
        new_refresh_token = create_refresh_token(user.id)

        return Token(access_token=new_access_token, refresh_token=new_refresh_token)

    async def logout(self, access_token: str, refresh_token: str | None = None) -> None:
        await self.user_repo.blacklist_token(access_token)
        if refresh_token:
            await self.user_repo.blacklist_token(refresh_token)

    async def get_current_user(self, token: str) -> User:
        if await self.user_repo.is_token_blacklisted(token):
            raise UnauthorizedException("Token has been revoked")

        payload = decode_token(token)
        if not payload or payload.get("type") != "access":
            raise UnauthorizedException("Invalid access token")

        user_id = int(payload.get("sub"))
        user = await self.user_repo.get(user_id)
        if not user:
            raise NotFoundException("User")
        if not user.is_active:
            raise UnauthorizedException("User account is disabled")

        return user
