import pytest

from app.models.user import User, UserRole, TokenBlacklist
from app.repositories.user import UserRepository
from app.utils.security import get_password_hash


@pytest.mark.asyncio
class TestUserRepository:
    async def test_get_by_email_found(self, db_session, sample_user):
        repo = UserRepository(db_session)
        user = await repo.get_by_email(sample_user.email)
        assert user is not None
        assert user.email == sample_user.email
        assert user.id == sample_user.id

    async def test_get_by_email_not_found(self, db_session):
        repo = UserRepository(db_session)
        user = await repo.get_by_email("nonexistent@example.com")
        assert user is None

    async def test_blacklist_token(self, db_session):
        repo = UserRepository(db_session)
        token = "test_token_value"
        await repo.blacklist_token(token)

        blacklisted = await repo.is_token_blacklisted(token)
        assert blacklisted is True

    async def test_is_token_blacklisted_true(self, db_session):
        repo = UserRepository(db_session)
        token = "blacklisted_token"
        blacklisted_entry = TokenBlacklist(token=token)
        db_session.add(blacklisted_entry)
        await db_session.commit()

        result = await repo.is_token_blacklisted(token)
        assert result is True

    async def test_is_token_blacklisted_false(self, db_session):
        repo = UserRepository(db_session)
        result = await repo.is_token_blacklisted("nonexistent_token")
        assert result is False

    async def test_multiple_blacklisted_tokens(self, db_session):
        repo = UserRepository(db_session)
        tokens = ["token1", "token2", "token3"]
        for token in tokens:
            await repo.blacklist_token(token)

        assert await repo.is_token_blacklisted("token1") is True
        assert await repo.is_token_blacklisted("token2") is True
        assert await repo.is_token_blacklisted("token3") is True
        assert await repo.is_token_blacklisted("token4") is False

    async def test_create_user_with_base_repository_methods(self, db_session):
        repo = UserRepository(db_session)
        user_data = {
            "email": "newuser@example.com",
            "hashed_password": get_password_hash("password"),
            "full_name": "New User",
            "role": UserRole.USER,
            "is_active": True
        }
        user = await repo.create(user_data)
        assert user.email == "newuser@example.com"

        found_by_email = await repo.get_by_email("newuser@example.com")
        assert found_by_email.id == user.id

        found_by_id = await repo.get(user.id)
        assert found_by_id.email == "newuser@example.com"
