from typing import Sequence
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.book import Book, book_categories
from app.models.order import Order, OrderItem, OrderStatus


class RecommendationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_also_bought(self, book_id: int, limit: int = 5) -> Sequence[Book]:
        orders_with_book = (
            select(OrderItem.order_id)
            .where(OrderItem.book_id == book_id)
        )

        other_books = (
            select(OrderItem.book_id, func.count(OrderItem.book_id).label("count"))
            .where(
                OrderItem.order_id.in_(orders_with_book),
                OrderItem.book_id != book_id
            )
            .group_by(OrderItem.book_id)
            .order_by(func.count(OrderItem.book_id).desc())
            .limit(limit)
        )

        other_book_ids = await self.db.execute(other_books)
        book_ids = [row[0] for row in other_book_ids.fetchall()]

        if not book_ids:
            return await self.get_category_recommendations(book_id, limit)

        result = await self.db.execute(
            select(Book)
            .options(selectinload(Book.categories))
            .where(Book.id.in_(book_ids), Book.is_deleted == False)
        )
        return result.scalars().all()

    async def get_category_recommendations(
        self,
        book_id: int,
        limit: int = 5
    ) -> Sequence[Book]:
        book_result = await self.db.execute(
            select(Book).options(selectinload(Book.categories)).where(Book.id == book_id)
        )
        book = book_result.scalar_one_or_none()

        if not book or not book.categories:
            return await self.get_popular_books(limit)

        category_ids = [c.id for c in book.categories]

        result = await self.db.execute(
            select(Book)
            .options(selectinload(Book.categories))
            .join(book_categories)
            .where(
                book_categories.c.category_id.in_(category_ids),
                Book.id != book_id,
                Book.is_deleted == False
            )
            .group_by(Book.id)
            .order_by(Book.rating.desc(), Book.review_count.desc())
            .limit(limit)
        )
        return result.scalars().all()

    async def get_popular_books(self, limit: int = 5) -> Sequence[Book]:
        result = await self.db.execute(
            select(Book)
            .options(selectinload(Book.categories))
            .where(Book.is_deleted == False)
            .order_by(Book.rating.desc(), Book.review_count.desc())
            .limit(limit)
        )
        return result.scalars().all()

    async def get_user_recommendations(
        self,
        user_id: int,
        limit: int = 10
    ) -> Sequence[Book]:
        user_orders = await self.db.execute(
            select(OrderItem.book_id)
            .join(Order)
            .where(Order.user_id == user_id)
            .distinct()
        )
        purchased_book_ids = [row[0] for row in user_orders.fetchall()]

        if not purchased_book_ids:
            return await self.get_popular_books(limit)

        user_categories = await self.db.execute(
            select(book_categories.c.category_id)
            .where(book_categories.c.book_id.in_(purchased_book_ids))
            .distinct()
        )
        category_ids = [row[0] for row in user_categories.fetchall()]

        if not category_ids:
            return await self.get_popular_books(limit)

        result = await self.db.execute(
            select(Book)
            .options(selectinload(Book.categories))
            .join(book_categories)
            .where(
                book_categories.c.category_id.in_(category_ids),
                ~Book.id.in_(purchased_book_ids),
                Book.is_deleted == False
            )
            .group_by(Book.id)
            .order_by(Book.rating.desc(), Book.review_count.desc())
            .limit(limit)
        )
        return result.scalars().all()
