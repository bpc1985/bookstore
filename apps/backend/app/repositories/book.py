from decimal import Decimal
from typing import Sequence
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.book import Book, book_categories
from app.repositories.base import BaseRepository


class BookRepository(BaseRepository[Book]):
    def __init__(self, db: AsyncSession):
        super().__init__(Book, db)

    async def get_with_categories(self, book_id: int) -> Book | None:
        result = await self.db.execute(
            select(Book)
            .options(selectinload(Book.categories))
            .where(Book.id == book_id, Book.is_deleted == False)
        )
        return result.scalar_one_or_none()

    async def get_by_isbn(self, isbn: str) -> Book | None:
        result = await self.db.execute(select(Book).where(Book.isbn == isbn))
        return result.scalar_one_or_none()

    async def search(
        self,
        search: str | None = None,
        category_id: int | None = None,
        min_price: Decimal | None = None,
        max_price: Decimal | None = None,
        in_stock: bool | None = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        offset: int = 0,
        limit: int = 20,
    ) -> tuple[Sequence[Book], int]:
        query = select(Book).options(selectinload(Book.categories)).where(Book.is_deleted == False)
        count_query = select(func.count(Book.id)).where(Book.is_deleted == False)

        if search:
            search_filter = or_(
                Book.title.ilike(f"%{search}%"),
                Book.author.ilike(f"%{search}%")
            )
            query = query.where(search_filter)
            count_query = count_query.where(search_filter)

        if category_id:
            query = query.join(book_categories).where(book_categories.c.category_id == category_id)
            count_query = count_query.join(book_categories).where(book_categories.c.category_id == category_id)

        if min_price is not None:
            query = query.where(Book.price >= min_price)
            count_query = count_query.where(Book.price >= min_price)

        if max_price is not None:
            query = query.where(Book.price <= max_price)
            count_query = count_query.where(Book.price <= max_price)

        if in_stock is True:
            query = query.where(Book.stock_quantity > 0)
            count_query = count_query.where(Book.stock_quantity > 0)

        sort_column = getattr(Book, sort_by, Book.created_at)
        if sort_order == "asc":
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())

        query = query.offset(offset).limit(limit)

        result = await self.db.execute(query)
        count_result = await self.db.execute(count_query)

        return result.scalars().all(), count_result.scalar_one()

    async def update_stock(self, book_id: int, quantity_change: int) -> Book | None:
        result = await self.db.execute(
            select(Book).where(Book.id == book_id).with_for_update()
        )
        book = result.scalar_one_or_none()
        if book:
            book.stock_quantity += quantity_change
            await self.db.commit()
            await self.db.refresh(book)
        return book

    async def soft_delete(self, book: Book) -> Book:
        book.is_deleted = True
        await self.db.commit()
        await self.db.refresh(book)
        return book
