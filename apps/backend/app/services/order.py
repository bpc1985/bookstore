from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order, OrderItem, OrderStatus, OrderStatusHistory
from app.schemas.order import OrderCreate, OrderStatusUpdate
from app.repositories.order import OrderRepository
from app.services.cart import CartService
from app.services.inventory import InventoryService
from app.exceptions import NotFoundException, BadRequestException, ForbiddenException
from app.utils.pagination import PaginatedResponse


class OrderService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.order_repo = OrderRepository(db)
        self.cart_service = CartService(db)
        self.inventory_service = InventoryService(db)

    async def create_order(self, user_id: int, order_data: OrderCreate) -> Order:
        cart = await self.cart_service.validate_cart_for_checkout(user_id)

        order = Order(
            user_id=user_id,
            total_amount=cart.subtotal,
            shipping_address=order_data.shipping_address,
            status=OrderStatus.PENDING
        )
        self.db.add(order)
        await self.db.flush()

        for cart_item in cart.items:
            await self.inventory_service.reserve_stock(cart_item.book_id, cart_item.quantity)

            order_item = OrderItem(
                order_id=order.id,
                book_id=cart_item.book_id,
                quantity=cart_item.quantity,
                price_at_purchase=cart_item.book.price
            )
            self.db.add(order_item)

        status_history = OrderStatusHistory(
            order_id=order.id,
            status=OrderStatus.PENDING,
            note="Order created"
        )
        self.db.add(status_history)

        await self.cart_service.clear_cart(user_id)

        await self.db.commit()
        await self.db.refresh(order)

        return await self.order_repo.get_with_details(order.id)

    async def get_order(self, order_id: int, user_id: int) -> Order:
        order = await self.order_repo.get_user_order(order_id, user_id)
        if not order:
            raise NotFoundException("Order")
        return order

    async def get_order_admin(self, order_id: int) -> Order:
        order = await self.order_repo.get_with_details(order_id)
        if not order:
            raise NotFoundException("Order")
        return order

    async def get_user_orders(
        self,
        user_id: int,
        status: OrderStatus | None = None,
        page: int = 1,
        size: int = 20
    ) -> PaginatedResponse:
        offset = (page - 1) * size
        orders, total = await self.order_repo.get_user_orders(user_id, status, offset, size)

        order_list = []
        for order in orders:
            order_list.append({
                "id": order.id,
                "status": order.status,
                "total_amount": order.total_amount,
                "created_at": order.created_at,
                "item_count": sum(item.quantity for item in order.items)
            })

        return PaginatedResponse.create(items=order_list, total=total, page=page, size=size)

    async def get_all_orders(
        self,
        status: OrderStatus | None = None,
        page: int = 1,
        size: int = 20
    ) -> PaginatedResponse:
        offset = (page - 1) * size
        orders, total = await self.order_repo.get_all_orders(status, offset, size)

        order_list = []
        for order in orders:
            order_list.append({
                "id": order.id,
                "status": order.status,
                "total_amount": order.total_amount,
                "created_at": order.created_at,
                "item_count": sum(item.quantity for item in order.items)
            })

        return PaginatedResponse.create(items=order_list, total=total, page=page, size=size)

    async def cancel_order(self, order_id: int, user_id: int) -> Order:
        order = await self.order_repo.get_user_order(order_id, user_id)
        if not order:
            raise NotFoundException("Order")

        if order.status not in [OrderStatus.PENDING]:
            raise BadRequestException("Only pending orders can be cancelled")

        for item in order.items:
            await self.inventory_service.release_stock(item.book_id, item.quantity)

        await self.order_repo.add_status_history(order, OrderStatus.CANCELLED, "Cancelled by user")

        return await self.order_repo.get_with_details(order.id)

    async def update_order_status(
        self,
        order_id: int,
        status_update: OrderStatusUpdate
    ) -> Order:
        order = await self.order_repo.get_with_details(order_id)
        if not order:
            raise NotFoundException("Order")

        valid_transitions = {
            OrderStatus.PENDING: [OrderStatus.PAID, OrderStatus.CANCELLED],
            OrderStatus.PAID: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
            OrderStatus.SHIPPED: [OrderStatus.COMPLETED],
            OrderStatus.CANCELLED: [],
            OrderStatus.COMPLETED: [],
        }

        if status_update.status not in valid_transitions.get(order.status, []):
            raise BadRequestException(
                f"Cannot transition from {order.status.value} to {status_update.status.value}"
            )

        if status_update.status == OrderStatus.CANCELLED and order.status in [OrderStatus.PENDING, OrderStatus.PAID]:
            for item in order.items:
                await self.inventory_service.release_stock(item.book_id, item.quantity)

        await self.order_repo.add_status_history(order, status_update.status, status_update.note)

        return await self.order_repo.get_with_details(order.id)

    async def get_order_tracking(self, order_id: int, user_id: int) -> list[OrderStatusHistory]:
        order = await self.order_repo.get_user_order(order_id, user_id)
        if not order:
            raise NotFoundException("Order")
        return sorted(order.status_history, key=lambda x: x.created_at)
