import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from decimal import Decimal
from sqlalchemy import select

from app.repositories.order import OrderRepository
from app.models.order import Order, OrderStatus, OrderStatusHistory, OrderItem
from app.models.user import User, UserRole
from app.models.book import Book
from app.models.category import Category
from app.models.cart import CartItem
from app.utils.security import get_password_hash


@pytest.fixture
async def order_repository(db_session):
    return OrderRepository(db_session)


@pytest.fixture
async def sample_user_with_orders(db_session):
    user = User(
        email="orderuser@example.com",
        hashed_password=get_password_hash("password123"),
        full_name="Order User",
        role=UserRole.USER
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def sample_book_for_orders(db_session, sample_category):
    book = Book(
        title="Order Test Book",
        author="Order Test Author",
        description="Order test description",
        isbn="9999999999999",
        price=Decimal("39.99"),
        stock_quantity=20,
        rating=Decimal("4.8"),
        review_count=15
    )
    book.categories.append(sample_category)
    db_session.add(book)
    await db_session.commit()
    await db_session.refresh(book)
    return book


@pytest.fixture
async def sample_order(db_session, sample_user_with_orders, sample_book_for_orders):
    order = Order(
        user_id=sample_user_with_orders.id,
        status=OrderStatus.PENDING,
        total_amount=Decimal("79.98"),
        shipping_address="123 Order Street, Order City, OC 12345"
    )
    db_session.add(order)
    await db_session.flush()

    order_item = OrderItem(
        order_id=order.id,
        book_id=sample_book_for_orders.id,
        quantity=2,
        price_at_purchase=Decimal("39.99")
    )
    db_session.add(order_item)

    status_history = OrderStatusHistory(
        order_id=order.id,
        status=OrderStatus.PENDING,
        note="Order created"
    )
    db_session.add(status_history)

    await db_session.commit()
    await db_session.refresh(order)
    return order


@pytest.mark.asyncio
class TestOrderRepository:
    async def test_get_user_orders(self, db_session, order_repository, sample_user_with_orders, sample_order):
        orders, total = await order_repository.get_user_orders(
            sample_user_with_orders.id,
            status=None,
            offset=0,
            limit=10
        )
        assert len(orders) >= 1
        assert total >= 1
        assert orders[0].id == sample_order.id

    async def test_get_user_orders_empty(self, db_session, order_repository):
        user = User(
            email="noorders@example.com",
            hashed_password=get_password_hash("password123"),
            full_name="No Orders User",
            role=UserRole.USER
        )
        db_session.add(user)
        await db_session.commit()

        orders, total = await order_repository.get_user_orders(
            user.id,
            status=None,
            offset=0,
            limit=10
        )
        assert len(orders) == 0
        assert total == 0

    async def test_get_user_orders_with_status_filter(self, db_session, order_repository, sample_user_with_orders, sample_order):
        orders, total = await order_repository.get_user_orders(
            sample_user_with_orders.id,
            status=OrderStatus.PENDING,
            offset=0,
            limit=10
        )
        assert len(orders) >= 1
        assert total >= 1
        assert orders[0].status == OrderStatus.PENDING

    async def test_get_user_orders_pagination(self, db_session, order_repository, sample_user_with_orders):
        # Create multiple orders
        user = sample_user_with_orders
        for i in range(5):
            order = Order(
                user_id=user.id,
                status=OrderStatus.PENDING,
                total_amount=Decimal("10.00"),
                shipping_address=f"Address {i}"
            )
            db_session.add(order)

        await db_session.commit()

        orders, total = await order_repository.get_user_orders(
            user.id,
            status=None,
            offset=0,
            limit=3
        )
        assert len(orders) == 3
        assert total == 5

    async def test_get_all_orders(self, db_session, order_repository, sample_order):
        orders, total = await order_repository.get_all_orders(
            status=None,
            offset=0,
            limit=10
        )
        assert len(orders) >= 1
        assert total >= 1

    async def test_get_all_orders_with_status_filter(self, db_session, order_repository, sample_order):
        orders, total = await order_repository.get_all_orders(
            status=OrderStatus.PENDING,
            offset=0,
            limit=10
        )
        assert len(orders) >= 1
        assert total >= 1
        assert all(o.status == OrderStatus.PENDING for o in orders)

    async def test_get_all_orders_pagination(self, db_session, order_repository):
        # Create orders for different users
        for i in range(5):
            user = User(
                email=f"user{i}@example.com",
                hashed_password=get_password_hash("password123"),
                full_name=f"User {i}",
                role=UserRole.USER
            )
            db_session.add(user)
            await db_session.flush()

            order = Order(
                user_id=user.id,
                status=OrderStatus.PENDING,
                total_amount=Decimal("10.00"),
                shipping_address=f"Address {i}"
            )
            db_session.add(order)

        await db_session.commit()

        orders, total = await order_repository.get_all_orders(
            status=None,
            offset=0,
            limit=3
        )
        assert len(orders) == 3
        assert total == 5

    async def test_get_with_details(self, db_session, order_repository, sample_order):
        order = await order_repository.get_with_details(sample_order.id)
        assert order is not None
        assert order.id == sample_order.id
        assert len(order.items) >= 1
        assert len(order.status_history) >= 1

    async def test_get_with_details_not_found(self, db_session, order_repository):
        order = await order_repository.get_with_details(99999)
        assert order is None

    async def test_get_with_details_includes_items(self, db_session, order_repository, sample_order, sample_book_for_orders):
        order = await order_repository.get_with_details(sample_order.id)
        assert order is not None
        assert len(order.items) >= 1
        assert order.items[0].book_id == sample_book_for_orders.id

    async def test_get_with_details_includes_status_history(self, db_session, order_repository, sample_order):
        order = await order_repository.get_with_details(sample_order.id)
        assert order is not None
        assert len(order.status_history) >= 1
        assert order.status_history[0].status == OrderStatus.PENDING

    async def test_add_status_history(self, db_session, order_repository, sample_order):
        # Explicitly load status_history to avoid lazy loading issues
        result = await db_session.execute(
            select(OrderStatusHistory).where(OrderStatusHistory.order_id == sample_order.id)
        )
        initial_count = len(result.scalars().all())

        await order_repository.add_status_history(
            sample_order,
            OrderStatus.PAID,
            "Payment received"
        )

        await db_session.flush()

        result = await db_session.execute(
            select(OrderStatusHistory).where(OrderStatusHistory.order_id == sample_order.id)
        )
        final_count = len(result.scalars().all())

        assert final_count == initial_count + 1

        # Get latest history to verify
        result = await db_session.execute(
            select(OrderStatusHistory)
            .where(OrderStatusHistory.order_id == sample_order.id)
            .order_by(OrderStatusHistory.created_at.desc())
        )
        latest_history = result.scalars().first()
        assert latest_history.status == OrderStatus.PAID
        assert latest_history.note == "Payment received"

    async def test_add_status_history_creates_new_record(self, db_session, order_repository, sample_order):
        from sqlalchemy import select
        from app.models.order import OrderStatusHistory

        initial_result = await db_session.execute(
            select(OrderStatusHistory).where(OrderStatusHistory.order_id == sample_order.id)
        )
        initial_count = len(initial_result.scalars().all())

        await order_repository.add_status_history(sample_order, OrderStatus.SHIPPED, "Shipped")

        result = await db_session.execute(
            select(OrderStatusHistory).where(OrderStatusHistory.order_id == sample_order.id)
        )
        final_count = len(result.scalars().all())

        assert final_count == initial_count + 1

    async def test_get_user_order(self, db_session, order_repository, sample_order):
        order = await order_repository.get_user_order(sample_order.id, sample_order.user_id)
        assert order is not None
        assert order.id == sample_order.id

    async def test_get_user_order_wrong_user(self, db_session, order_repository, sample_order):
        other_user = User(
            email="other@example.com",
            hashed_password=get_password_hash("password123"),
            full_name="Other User",
            role=UserRole.USER
        )
        db_session.add(other_user)
        await db_session.commit()

        order = await order_repository.get_user_order(sample_order.id, other_user.id)
        assert order is None

    async def test_get_user_order_not_found(self, db_session, order_repository, sample_user_with_orders):
        order = await order_repository.get_user_order(99999, sample_user_with_orders.id)
        assert order is None
