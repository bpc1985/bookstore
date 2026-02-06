from typing import Sequence
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.order import Order, OrderItem, OrderStatusHistory, OrderStatus
from app.repositories.base import BaseRepository


class OrderRepository(BaseRepository[Order]):
    def __init__(self, db: AsyncSession):
        super().__init__(Order, db)

    async def get_with_details(self, order_id: int) -> Order | None:
        result = await self.db.execute(
            select(Order)
            .options(
                selectinload(Order.items).selectinload(OrderItem.book),
                selectinload(Order.status_history),
                selectinload(Order.user)
            )
            .where(Order.id == order_id)
        )
        return result.scalar_one_or_none()

    async def get_user_order(self, order_id: int, user_id: int) -> Order | None:
        result = await self.db.execute(
            select(Order)
            .options(
                selectinload(Order.items).selectinload(OrderItem.book),
                selectinload(Order.status_history)
            )
            .where(Order.id == order_id, Order.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_user_orders(
        self,
        user_id: int,
        status: OrderStatus | None = None,
        offset: int = 0,
        limit: int = 20
    ) -> tuple[Sequence[Order], int]:
        query = select(Order).options(selectinload(Order.items)).where(Order.user_id == user_id)
        count_query = select(func.count(Order.id)).where(Order.user_id == user_id)

        if status:
            query = query.where(Order.status == status)
            count_query = count_query.where(Order.status == status)

        query = query.order_by(Order.created_at.desc()).offset(offset).limit(limit)

        result = await self.db.execute(query)
        count_result = await self.db.execute(count_query)

        return result.scalars().all(), count_result.scalar_one()

    async def get_all_orders(
        self,
        status: OrderStatus | None = None,
        offset: int = 0,
        limit: int = 20
    ) -> tuple[Sequence[Order], int]:
        query = select(Order).options(selectinload(Order.items), selectinload(Order.user))
        count_query = select(func.count(Order.id))

        if status:
            query = query.where(Order.status == status)
            count_query = count_query.where(Order.status == status)

        query = query.order_by(Order.created_at.desc()).offset(offset).limit(limit)

        result = await self.db.execute(query)
        count_result = await self.db.execute(count_query)

        return result.scalars().all(), count_result.scalar_one()

    async def add_status_history(
        self,
        order: Order,
        status: OrderStatus,
        note: str | None = None
    ) -> OrderStatusHistory:
        history = OrderStatusHistory(
            order_id=order.id,
            status=status,
            note=note
        )
        self.db.add(history)
        order.status = status
        await self.db.commit()
        await self.db.refresh(history)
        return history
