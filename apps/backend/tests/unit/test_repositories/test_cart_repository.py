import pytest
from datetime import datetime, timedelta

from app.models.cart import CartItem
from app.repositories.cart import CartRepository


@pytest.mark.asyncio
class TestCartRepository:
    async def test_get_user_cart_empty(self, db_session, sample_user):
        repo = CartRepository(db_session)
        cart_items = await repo.get_user_cart(sample_user.id)
        assert len(cart_items) == 0

    async def test_get_user_cart_with_items(self, db_session, sample_user, sample_cart_item):
        repo = CartRepository(db_session)
        cart_items = await repo.get_user_cart(sample_user.id)
        assert len(cart_items) >= 1
        assert any(item.id == sample_cart_item.id for item in cart_items)

    async def test_get_cart_item_found(self, db_session, sample_user, sample_book, sample_cart_item):
        repo = CartRepository(db_session)
        cart_item = await repo.get_cart_item(sample_user.id, sample_book.id)
        assert cart_item is not None
        assert cart_item.id == sample_cart_item.id

    async def test_get_cart_item_not_found(self, db_session, sample_user):
        repo = CartRepository(db_session)
        cart_item = await repo.get_cart_item(sample_user.id, 99999)
        assert cart_item is None

    async def test_get_cart_item_different_user(self, db_session, sample_book, sample_cart_item):
        from app.utils.security import get_password_hash
        from app.models.user import User, UserRole

        repo = CartRepository(db_session)
        other_user = User(
            email="other@example.com",
            hashed_password=get_password_hash("pass123"),
            full_name="Other User",
            role=UserRole.USER
        )
        db_session.add(other_user)
        await db_session.commit()

        cart_item = await repo.get_cart_item(other_user.id, sample_book.id)
        assert cart_item is None

    async def test_get_cart_item_by_id(self, db_session, sample_user, sample_book, sample_cart_item):
        repo = CartRepository(db_session)
        cart_item = await repo.get_cart_item_by_id(sample_cart_item.id, sample_user.id)
        assert cart_item is not None
        assert cart_item.id == sample_cart_item.id

    async def test_get_cart_item_by_id_wrong_user(self, db_session, sample_book, sample_cart_item):
        from app.utils.security import get_password_hash
        from app.models.user import User, UserRole

        repo = CartRepository(db_session)
        other_user = User(
            email="other@example.com",
            hashed_password=get_password_hash("pass123"),
            full_name="Other User",
            role=UserRole.USER
        )
        db_session.add(other_user)
        await db_session.commit()

        cart_item = await repo.get_cart_item_by_id(sample_cart_item.id, other_user.id)
        assert cart_item is None

    async def test_clear_user_cart(self, db_session, sample_user, sample_cart_item):
        repo = CartRepository(db_session)
        await repo.clear_user_cart(sample_user.id)

        cart_items = await repo.get_user_cart(sample_user.id)
        assert len(cart_items) == 0

    async def test_clear_empty_cart(self, db_session, sample_user):
        repo = CartRepository(db_session)
        await repo.clear_user_cart(sample_user.id)
        cart_items = await repo.get_user_cart(sample_user.id)
        assert len(cart_items) == 0

    async def test_remove_expired_items(self, db_session, sample_user, sample_book):
        repo = CartRepository(db_session)

        expired_item = CartItem(
            user_id=sample_user.id,
            book_id=sample_book.id,
            quantity=1,
            expires_at=datetime.utcnow() - timedelta(days=1)
        )
        db_session.add(expired_item)
        await db_session.commit()

        removed_count = await repo.remove_expired_items()
        assert removed_count >= 1

        expired_check = await repo.get_cart_item_by_id(expired_item.id, sample_user.id)
        assert expired_check is None

    async def test_cart_item_with_expired_date(self, db_session, sample_user, sample_book):
        repo = CartRepository(db_session)

        expired_item = CartItem(
            user_id=sample_user.id,
            book_id=sample_book.id,
            quantity=1,
            expires_at=datetime.utcnow() - timedelta(days=1)
        )
        db_session.add(expired_item)
        await db_session.commit()

        cart_items = await repo.get_user_cart(sample_user.id)
        assert expired_item.id not in [item.id for item in cart_items]

    async def test_create_cart_item(self, db_session, sample_user, sample_book):
        repo = CartRepository(db_session)
        cart_item_data = {
            "user_id": sample_user.id,
            "book_id": sample_book.id,
            "quantity": 3
        }
        cart_item = await repo.create(cart_item_data)
        assert cart_item.id is not None
        assert cart_item.quantity == 3

        fetched_item = await repo.get_cart_item(sample_user.id, sample_book.id)
        assert fetched_item.id == cart_item.id

    async def test_delete_cart_item(self, db_session, sample_cart_item):
        repo = CartRepository(db_session)
        item_id = sample_cart_item.id
        user_id = sample_cart_item.user_id

        await repo.delete(sample_cart_item)

        deleted_item = await repo.get_cart_item_by_id(item_id, user_id)
        assert deleted_item is None
