import pytest
from decimal import Decimal

from app.models.user import User, UserRole
from app.repositories.user import UserRepository
from app.utils.security import get_password_hash


@pytest.mark.asyncio
class TestBaseRepository:
    async def test_create(self, db_session):
        repo = UserRepository(db_session)
        user_data = {
            "email": "new@example.com",
            "hashed_password": get_password_hash("pass123"),
            "full_name": "New User",
            "role": UserRole.USER,
            "is_active": True
        }
        user = await repo.create(user_data)
        assert user.id is not None
        assert user.email == "new@example.com"
        assert user.full_name == "New User"

    async def test_get(self, db_session, sample_user):
        repo = UserRepository(db_session)
        user = await repo.get(sample_user.id)
        assert user is not None
        assert user.id == sample_user.id
        assert user.email == sample_user.email

    async def test_get_not_found(self, db_session):
        repo = UserRepository(db_session)
        user = await repo.get(99999)
        assert user is None

    async def test_get_all(self, db_session):
        repo = UserRepository(db_session)
        users = await repo.get_all()
        initial_count = len(users)

        user_data = {
            "email": "user1@example.com",
            "hashed_password": get_password_hash("pass123"),
            "full_name": "User One",
            "role": UserRole.USER,
            "is_active": True
        }
        await repo.create(user_data)

        users = await repo.get_all()
        assert len(users) == initial_count + 1

    async def test_update(self, db_session, sample_user):
        repo = UserRepository(db_session)
        update_data = {"full_name": "Updated Name"}
        updated_user = await repo.update(sample_user, update_data)
        assert updated_user.full_name == "Updated Name"
        assert updated_user.email == sample_user.email

    async def test_update_with_none_values(self, db_session, sample_user):
        repo = UserRepository(db_session)
        update_data = {"full_name": None}
        updated_user = await repo.update(sample_user, update_data)
        assert updated_user.full_name == sample_user.full_name

    async def test_delete(self, db_session):
        repo = UserRepository(db_session)
        user_data = {
            "email": "delete@example.com",
            "hashed_password": get_password_hash("pass123"),
            "full_name": "Delete Me",
            "role": UserRole.USER,
            "is_active": True
        }
        user = await repo.create(user_data)
        user_id = user.id

        await repo.delete(user)
        deleted_user = await repo.get(user_id)
        assert deleted_user is None

    async def test_count(self, db_session):
        repo = UserRepository(db_session)
        initial_count = await repo.count()

        user_data = {
            "email": "count@example.com",
            "hashed_password": get_password_hash("pass123"),
            "full_name": "Count User",
            "role": UserRole.USER,
            "is_active": True
        }
        await repo.create(user_data)

        new_count = await repo.count()
        assert new_count == initial_count + 1
