import pytest
from decimal import Decimal

from app.services.cart import CartService
from app.schemas.cart import CartItemCreate, CartItemUpdate
from app.exceptions import NotFoundException, BadRequestException


@pytest.mark.asyncio
class TestCartService:
    async def test_get_cart_empty(self, db_session, sample_user):
        service = CartService(db_session)
        cart = await service.get_cart(sample_user.id)
        assert len(cart.items) == 0
        assert cart.total_items == 0
        assert cart.subtotal == Decimal("0.00")

    async def test_get_cart_with_items(self, db_session, sample_user, sample_cart_item):
        service = CartService(db_session)
        cart = await service.get_cart(sample_user.id)
        assert len(cart.items) >= 1
        assert cart.total_items >= 2
        assert cart.subtotal > Decimal("0.00")

    async def test_get_cart_excludes_deleted_books(self, db_session, sample_user, sample_cart_item):
        service = CartService(db_session)
        sample_cart_item.book.is_deleted = True
        await db_session.commit()

        cart = await service.get_cart(sample_user.id)
        assert sample_cart_item.id not in [item.id for item in cart.items]

    async def test_add_item_new(self, db_session, sample_user, sample_book):
        service = CartService(db_session)
        item_data = CartItemCreate(book_id=sample_book.id, quantity=1)
        cart_item = await service.add_item(sample_user.id, item_data)
        assert cart_item.id is not None
        assert cart_item.quantity == 1

    async def test_add_item_existing(self, db_session, sample_user, sample_book, sample_cart_item):
        service = CartService(db_session)
        item_data = CartItemCreate(book_id=sample_book.id, quantity=3)
        cart_item = await service.add_item(sample_user.id, item_data)
        assert cart_item.quantity == 5  # 2 (existing) + 3 (new)

    async def test_add_item_book_not_found(self, db_session, sample_user):
        service = CartService(db_session)
        item_data = CartItemCreate(book_id=99999, quantity=1)
        with pytest.raises(NotFoundException) as exc_info:
            await service.add_item(sample_user.id, item_data)
        assert "Book" in str(exc_info.value.detail)

    async def test_add_item_insufficient_stock(self, db_session, sample_user, sample_book):
        service = CartService(db_session)
        sample_book.stock_quantity = 2
        await db_session.commit()

        item_data = CartItemCreate(book_id=sample_book.id, quantity=5)
        with pytest.raises(BadRequestException) as exc_info:
            await service.add_item(sample_user.id, item_data)
        assert "Only 2 items available" in str(exc_info.value.detail)

    async def test_update_item(self, db_session, sample_user, sample_cart_item):
        service = CartService(db_session)
        update_data = CartItemUpdate(quantity=5)
        cart_item = await service.update_item(sample_user.id, sample_cart_item.id, update_data)
        assert cart_item.quantity == 5

    async def test_update_item_not_found(self, db_session, sample_user):
        service = CartService(db_session)
        update_data = CartItemUpdate(quantity=5)
        with pytest.raises(NotFoundException) as exc_info:
            await service.update_item(sample_user.id, 99999, update_data)
        assert "Cart item" in str(exc_info.value.detail)

    async def test_update_item_insufficient_stock(self, db_session, sample_user, sample_book, sample_cart_item):
        service = CartService(db_session)
        sample_book.stock_quantity = 3
        await db_session.commit()

        update_data = CartItemUpdate(quantity=10)
        with pytest.raises(BadRequestException) as exc_info:
            await service.update_item(sample_user.id, sample_cart_item.id, update_data)
        assert "Only 3 items available" in str(exc_info.value.detail)

    async def test_remove_item(self, db_session, sample_user, sample_cart_item):
        service = CartService(db_session)
        await service.remove_item(sample_user.id, sample_cart_item.id)

        cart = await service.get_cart(sample_user.id)
        assert sample_cart_item.id not in [item.id for item in cart.items]

    async def test_remove_item_not_found(self, db_session, sample_user):
        service = CartService(db_session)
        with pytest.raises(NotFoundException) as exc_info:
            await service.remove_item(sample_user.id, 99999)
        assert "Cart item" in str(exc_info.value.detail)

    async def test_clear_cart(self, db_session, sample_user, sample_cart_item):
        service = CartService(db_session)
        await service.clear_cart(sample_user.id)

        cart = await service.get_cart(sample_user.id)
        assert len(cart.items) == 0

    async def test_validate_cart_for_checkout_success(self, db_session, sample_user, sample_cart_item):
        service = CartService(db_session)
        cart = await service.validate_cart_for_checkout(sample_user.id)
        assert len(cart.items) >= 1

    async def test_validate_cart_empty(self, db_session, sample_user):
        service = CartService(db_session)
        with pytest.raises(BadRequestException) as exc_info:
            await service.validate_cart_for_checkout(sample_user.id)
        assert "Cart is empty" in str(exc_info.value.detail)

    async def test_validate_cart_insufficient_stock(self, db_session, sample_user, sample_book, sample_cart_item):
        service = CartService(db_session)
        sample_book.stock_quantity = 1
        await db_session.commit()

        with pytest.raises(BadRequestException) as exc_info:
            await service.validate_cart_for_checkout(sample_user.id)
        assert "Insufficient stock" in str(exc_info.value.detail)

    async def test_cart_calculates_subtotal(self, db_session, sample_user, sample_book):
        service = CartService(db_session)
        item_data = CartItemCreate(book_id=sample_book.id, quantity=2)
        await service.add_item(sample_user.id, item_data)

        cart = await service.get_cart(sample_user.id)
        expected_subtotal = sample_book.price * 2
        assert cart.subtotal == expected_subtotal

    async def test_cart_calculates_total_items(self, db_session, sample_user, sample_book):
        service = CartService(db_session)
        item_data = CartItemCreate(book_id=sample_book.id, quantity=3)
        await service.add_item(sample_user.id, item_data)

        cart = await service.get_cart(sample_user.id)
        assert cart.total_items >= 3
