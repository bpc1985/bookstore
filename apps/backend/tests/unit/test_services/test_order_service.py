import pytest
from decimal import Decimal

from app.services.order import OrderService
from app.schemas.order import OrderCreate, OrderStatusUpdate
from app.models.order import OrderStatus
from app.exceptions import NotFoundException, BadRequestException


@pytest.mark.asyncio
class TestOrderService:
    async def test_create_order_success(self, db_session, sample_user, sample_book):
        cart_service = self._get_cart_service(db_session)
        item_data = self._get_cart_item_create(sample_book.id, 2)
        await cart_service.add_item(sample_user.id, item_data)

        service = OrderService(db_session)
        order_data = OrderCreate(shipping_address="123 Test Street, Test City, TC 12345")
        order = await service.create_order(sample_user.id, order_data)
        assert order.id is not None
        assert order.status == OrderStatus.PENDING
        assert order.user_id == sample_user.id
        assert len(order.items) >= 1

    async def test_create_order_empty_cart(self, db_session, sample_user):
        service = OrderService(db_session)
        order_data = OrderCreate(shipping_address="123 Test Street, Test City, TC 12345")
        with pytest.raises(BadRequestException) as exc_info:
            await service.create_order(sample_user.id, order_data)
        assert "Cart is empty" in str(exc_info.value.detail)

    async def test_get_order_success(self, db_session, sample_user, sample_book):
        service = OrderService(db_session)
        await self._create_test_order(db_session, sample_user, sample_book)

        order = await service.get_order(1, sample_user.id)
        assert order.id == 1
        assert order.user_id == sample_user.id

    async def test_get_order_not_found(self, db_session, sample_user):
        service = OrderService(db_session)
        with pytest.raises(NotFoundException) as exc_info:
            await service.get_order(99999, sample_user.id)
        assert "Order" in str(exc_info.value.detail)

    async def test_get_order_wrong_user(self, db_session, sample_user, sample_book):
        from app.utils.security import get_password_hash
        from app.models.user import User, UserRole

        service = OrderService(db_session)
        await self._create_test_order(db_session, sample_user, sample_book)

        other_user = User(
            email="other@example.com",
            hashed_password=get_password_hash("pass123"),
            full_name="Other User",
            role=UserRole.USER
        )
        db_session.add(other_user)
        await db_session.commit()

        with pytest.raises(NotFoundException):
            await service.get_order(1, other_user.id)

    async def test_get_user_orders(self, db_session, sample_user, sample_book):
        service = OrderService(db_session)
        await self._create_test_order(db_session, sample_user, sample_book)

        orders = await service.get_user_orders(sample_user.id)
        assert orders.total >= 1
        assert len(orders.items) >= 1

    async def test_get_all_orders(self, db_session, sample_user, sample_book):
        service = OrderService(db_session)
        await self._create_test_order(db_session, sample_user, sample_book)

        orders = await service.get_all_orders()
        assert orders.total >= 1
        assert len(orders.items) >= 1

    async def test_cancel_order_pending(self, db_session, sample_user, sample_book):
        service = OrderService(db_session)
        order = await self._create_test_order(db_session, sample_user, sample_book)

        cancelled_order = await service.cancel_order(order.id, sample_user.id)
        assert cancelled_order.status == OrderStatus.CANCELLED

    async def test_cancel_order_not_found(self, db_session, sample_user):
        service = OrderService(db_session)
        with pytest.raises(NotFoundException) as exc_info:
            await service.cancel_order(99999, sample_user.id)
        assert "Order" in str(exc_info.value.detail)

    async def test_cancel_order_wrong_status(self, db_session, sample_user, sample_book):
        service = OrderService(db_session)
        order = await self._create_test_order(db_session, sample_user, sample_book)
        order.status = OrderStatus.PAID
        await db_session.commit()

        with pytest.raises(BadRequestException) as exc_info:
            await service.cancel_order(order.id, sample_user.id)
        assert "Only pending orders can be cancelled" in str(exc_info.value.detail)

    async def test_update_order_status_pending_to_paid(self, db_session, sample_user, sample_book):
        service = OrderService(db_session)
        order = await self._create_test_order(db_session, sample_user, sample_book)

        status_update = OrderStatusUpdate(status=OrderStatus.PAID, note="Payment received")
        updated_order = await service.update_order_status(order.id, status_update)
        assert updated_order.status == OrderStatus.PAID

    async def test_update_order_status_invalid_transition(self, db_session, sample_user, sample_book):
        service = OrderService(db_session)
        order = await self._create_test_order(db_session, sample_user, sample_book)

        status_update = OrderStatusUpdate(status=OrderStatus.COMPLETED, note="Skip")
        with pytest.raises(BadRequestException) as exc_info:
            await service.update_order_status(order.id, status_update)
        assert "Cannot transition" in str(exc_info.value.detail)

    async def test_update_order_status_not_found(self, db_session):
        service = OrderService(db_session)
        status_update = OrderStatusUpdate(status=OrderStatus.PAID)
        with pytest.raises(NotFoundException) as exc_info:
            await service.update_order_status(99999, status_update)
        assert "Order" in str(exc_info.value.detail)

    async def test_get_order_tracking(self, db_session, sample_user, sample_book):
        service = OrderService(db_session)
        order = await self._create_test_order(db_session, sample_user, sample_book)

        tracking = await service.get_order_tracking(order.id, sample_user.id)
        assert len(tracking) >= 1
        assert tracking[0].status == OrderStatus.PENDING

    async def test_create_order_reduces_stock(self, db_session, sample_user, sample_book):
        from app.repositories.book import BookRepository
        initial_stock = sample_book.stock_quantity
        cart_service = self._get_cart_service(db_session)
        item_data = self._get_cart_item_create(sample_book.id, 3)
        await cart_service.add_item(sample_user.id, item_data)

        service = OrderService(db_session)
        order_data = OrderCreate(shipping_address="123 Test Street, Test City, TC 12345")
        await service.create_order(sample_user.id, order_data)

        book_repo = BookRepository(db_session)
        updated_book = await book_repo.get(sample_book.id)
        assert updated_book.stock_quantity == initial_stock - 3

    async def test_cancel_order_restores_stock(self, db_session, sample_user, sample_book):
        from app.repositories.book import BookRepository
        initial_stock = sample_book.stock_quantity
        service = OrderService(db_session)
        order = await self._create_test_order(db_session, sample_user, sample_book)

        await service.cancel_order(order.id, sample_user.id)
        book_repo = BookRepository(db_session)
        updated_book = await book_repo.get(sample_book.id)
        assert updated_book.stock_quantity == initial_stock

    def _get_cart_service(self, db_session):
        from app.services.cart import CartService
        return CartService(db_session)

    def _get_cart_item_create(self, book_id, quantity):
        from app.schemas.cart import CartItemCreate
        return CartItemCreate(book_id=book_id, quantity=quantity)

    async def _create_test_order(self, db_session, user, book):
        cart_service = self._get_cart_service(db_session)
        item_data = self._get_cart_item_create(book.id, 2)
        await cart_service.add_item(user.id, item_data)

        service = OrderService(db_session)
        order_data = OrderCreate(shipping_address="123 Test Street, Test City, TC 12345")
        return await service.create_order(user.id, order_data)
