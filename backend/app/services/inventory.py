from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.book import Book
from app.exceptions import NotFoundException, InsufficientStockException


class InventoryService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def check_stock(self, book_id: int, quantity: int) -> bool:
        result = await self.db.execute(
            select(Book).where(Book.id == book_id, Book.is_deleted == False)
        )
        book = result.scalar_one_or_none()
        if not book:
            raise NotFoundException("Book")
        return book.stock_quantity >= quantity

    async def reserve_stock(self, book_id: int, quantity: int) -> Book:
        result = await self.db.execute(
            select(Book)
            .where(Book.id == book_id, Book.is_deleted == False)
            .with_for_update()
        )
        book = result.scalar_one_or_none()
        if not book:
            raise NotFoundException("Book")

        if book.stock_quantity < quantity:
            raise InsufficientStockException(book.title)

        book.stock_quantity -= quantity
        return book

    async def release_stock(self, book_id: int, quantity: int) -> Book:
        result = await self.db.execute(
            select(Book).where(Book.id == book_id).with_for_update()
        )
        book = result.scalar_one_or_none()
        if not book:
            raise NotFoundException("Book")

        book.stock_quantity += quantity
        return book

    async def get_stock(self, book_id: int) -> int:
        result = await self.db.execute(
            select(Book.stock_quantity).where(Book.id == book_id, Book.is_deleted == False)
        )
        stock = result.scalar_one_or_none()
        if stock is None:
            raise NotFoundException("Book")
        return stock
