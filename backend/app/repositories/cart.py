from datetime import datetime
from typing import Sequence
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.cart import CartItem
from app.models.book import Book
from app.repositories.base import BaseRepository


class CartRepository(BaseRepository[CartItem]):
    def __init__(self, db: AsyncSession):
        super().__init__(CartItem, db)

    async def get_user_cart(self, user_id: int) -> Sequence[CartItem]:
        result = await self.db.execute(
            select(CartItem)
            .options(selectinload(CartItem.book).selectinload(Book.categories))
            .where(
                CartItem.user_id == user_id,
                CartItem.expires_at > datetime.utcnow()
            )
            .order_by(CartItem.added_at.desc())
        )
        return result.scalars().all()

    async def get_cart_item(self, user_id: int, book_id: int) -> CartItem | None:
        result = await self.db.execute(
            select(CartItem)
            .options(selectinload(CartItem.book).selectinload(Book.categories))
            .where(
                CartItem.user_id == user_id,
                CartItem.book_id == book_id,
                CartItem.expires_at > datetime.utcnow()
            )
        )
        return result.scalar_one_or_none()

    async def get_cart_item_by_id(self, item_id: int, user_id: int) -> CartItem | None:
        result = await self.db.execute(
            select(CartItem)
            .options(selectinload(CartItem.book).selectinload(Book.categories))
            .where(
                CartItem.id == item_id,
                CartItem.user_id == user_id,
                CartItem.expires_at > datetime.utcnow()
            )
        )
        return result.scalar_one_or_none()

    async def clear_user_cart(self, user_id: int) -> None:
        await self.db.execute(
            delete(CartItem).where(CartItem.user_id == user_id)
        )
        await self.db.commit()

    async def remove_expired_items(self) -> int:
        result = await self.db.execute(
            delete(CartItem).where(CartItem.expires_at <= datetime.utcnow())
        )
        await self.db.commit()
        return result.rowcount
