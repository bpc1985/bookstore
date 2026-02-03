import pytest

from app.models.user import User, UserRole
from app.services.auth import AuthService
from app.schemas.user import UserCreate, UserLogin
from app.utils.security import get_password_hash, create_access_token
from app.exceptions import ConflictException, UnauthorizedException, NotFoundException


@pytest.mark.asyncio
class TestAuthService:
    async def test_register_success(self, db_session):
        service = AuthService(db_session)
        user_data = UserCreate(
            email="newuser@example.com",
            password="password123",
            full_name="New User"
        )
        user = await service.register(user_data)
        assert user.id is not None
        assert user.email == "newuser@example.com"
        assert user.full_name == "New User"
        assert user.role == UserRole.USER
        assert user.is_active is True

    async def test_register_duplicate_email(self, db_session, sample_user):
        service = AuthService(db_session)
        user_data = UserCreate(
            email=sample_user.email,
            password="password123",
            full_name="Duplicate User"
        )
        with pytest.raises(ConflictException) as exc_info:
            await service.register(user_data)
        assert "Email already registered" in str(exc_info.value.detail)

    async def test_login_success(self, db_session, sample_user):
        service = AuthService(db_session)
        credentials = UserLogin(email=sample_user.email, password="password123")
        token = await service.login(credentials)
        assert token.access_token is not None
        assert token.refresh_token is not None

    async def test_login_invalid_email(self, db_session):
        service = AuthService(db_session)
        credentials = UserLogin(email="nonexistent@example.com", password="password123")
        with pytest.raises(UnauthorizedException) as exc_info:
            await service.login(credentials)
        assert "Invalid email or password" in str(exc_info.value.detail)

    async def test_login_invalid_password(self, db_session, sample_user):
        service = AuthService(db_session)
        credentials = UserLogin(email=sample_user.email, password="wrongpassword")
        with pytest.raises(UnauthorizedException) as exc_info:
            await service.login(credentials)
        assert "Invalid email or password" in str(exc_info.value.detail)

    async def test_login_inactive_user(self, db_session, sample_user):
        service = AuthService(db_session)
        sample_user.is_active = False
        await db_session.commit()

        credentials = UserLogin(email=sample_user.email, password="password123")
        with pytest.raises(UnauthorizedException) as exc_info:
            await service.login(credentials)
        assert "User account is disabled" in str(exc_info.value.detail)

    async def test_refresh_token_success(self, db_session, sample_user):
        service = AuthService(db_session)
        from app.utils.security import create_refresh_token
        refresh_token = create_refresh_token(sample_user.id)

        new_tokens = await service.refresh_token(refresh_token)
        assert new_tokens.access_token is not None
        assert new_tokens.refresh_token is not None
        assert new_tokens.access_token != refresh_token
        assert await service.user_repo.is_token_blacklisted(refresh_token) is True

    async def test_refresh_token_blacklisted(self, db_session, sample_user):
        service = AuthService(db_session)
        from app.utils.security import create_refresh_token
        refresh_token = create_refresh_token(sample_user.id)
        await service.user_repo.blacklist_token(refresh_token)

        with pytest.raises(UnauthorizedException) as exc_info:
            await service.refresh_token(refresh_token)
        assert "Token has been revoked" in str(exc_info.value.detail)

    async def test_refresh_token_invalid_type(self, db_session, sample_user):
        service = AuthService(db_session)
        access_token = create_access_token(sample_user.id)

        with pytest.raises(UnauthorizedException) as exc_info:
            await service.refresh_token(access_token)
        assert "Invalid refresh token" in str(exc_info.value.detail)

    async def test_refresh_token_invalid_user(self, db_session):
        service = AuthService(db_session)
        from app.utils.security import create_refresh_token
        refresh_token = create_refresh_token(99999)

        with pytest.raises(UnauthorizedException) as exc_info:
            await service.refresh_token(refresh_token)
        assert "User not found or inactive" in str(exc_info.value.detail)

    async def test_logout_with_access_token_only(self, db_session, sample_user):
        service = AuthService(db_session)
        access_token = create_access_token(sample_user.id)

        await service.logout(access_token, None)
        assert await service.user_repo.is_token_blacklisted(access_token) is True

    async def test_logout_with_both_tokens(self, db_session, sample_user):
        service = AuthService(db_session)
        access_token = create_access_token(sample_user.id)
        from app.utils.security import create_refresh_token
        refresh_token = create_refresh_token(sample_user.id)

        await service.logout(access_token, refresh_token)
        assert await service.user_repo.is_token_blacklisted(access_token) is True
        assert await service.user_repo.is_token_blacklisted(refresh_token) is True

    async def test_get_current_user_success(self, db_session, sample_user):
        service = AuthService(db_session)
        access_token = create_access_token(sample_user.id)

        user = await service.get_current_user(access_token)
        assert user.id == sample_user.id
        assert user.email == sample_user.email

    async def test_get_current_user_blacklisted_token(self, db_session, sample_user):
        service = AuthService(db_session)
        access_token = create_access_token(sample_user.id)
        await service.user_repo.blacklist_token(access_token)

        with pytest.raises(UnauthorizedException) as exc_info:
            await service.get_current_user(access_token)
        assert "Token has been revoked" in str(exc_info.value.detail)

    async def test_get_current_user_invalid_token_type(self, db_session, sample_user):
        service = AuthService(db_session)
        from app.utils.security import create_refresh_token
        refresh_token = create_refresh_token(sample_user.id)

        with pytest.raises(UnauthorizedException) as exc_info:
            await service.get_current_user(refresh_token)
        assert "Invalid access token" in str(exc_info.value.detail)

    async def test_get_current_user_not_found(self, db_session):
        service = AuthService(db_session)
        access_token = create_access_token(99999)

        with pytest.raises(NotFoundException) as exc_info:
            await service.get_current_user(access_token)
        assert "User" in str(exc_info.value.detail)

    async def test_get_current_user_inactive(self, db_session, sample_user):
        service = AuthService(db_session)
        sample_user.is_active = False
        await db_session.commit()

        access_token = create_access_token(sample_user.id)
        with pytest.raises(UnauthorizedException) as exc_info:
            await service.get_current_user(access_token)
        assert "User account is disabled" in str(exc_info.value.detail)
