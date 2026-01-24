from typing import Sequence
from decimal import Decimal
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.review import Review
from app.models.book import Book
from app.repositories.base import BaseRepository


class ReviewRepository(BaseRepository[Review]):
    def __init__(self, db: AsyncSession):
        super().__init__(Review, db)

    async def get_user_review_for_book(self, user_id: int, book_id: int) -> Review | None:
        result = await self.db.execute(
            select(Review)
            .options(selectinload(Review.user))
            .where(Review.user_id == user_id, Review.book_id == book_id)
        )
        return result.scalar_one_or_none()

    async def get_book_reviews(
        self,
        book_id: int,
        approved_only: bool = True,
        offset: int = 0,
        limit: int = 20
    ) -> tuple[Sequence[Review], int]:
        query = select(Review).options(selectinload(Review.user)).where(Review.book_id == book_id)
        count_query = select(func.count(Review.id)).where(Review.book_id == book_id)

        if approved_only:
            query = query.where(Review.is_approved == True)
            count_query = count_query.where(Review.is_approved == True)

        query = query.order_by(Review.created_at.desc()).offset(offset).limit(limit)

        result = await self.db.execute(query)
        count_result = await self.db.execute(count_query)

        return result.scalars().all(), count_result.scalar_one()

    async def get_pending_reviews(
        self,
        offset: int = 0,
        limit: int = 20
    ) -> tuple[Sequence[Review], int]:
        query = (
            select(Review)
            .options(selectinload(Review.user), selectinload(Review.book))
            .where(Review.is_approved == False)
            .order_by(Review.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        count_query = select(func.count(Review.id)).where(Review.is_approved == False)

        result = await self.db.execute(query)
        count_result = await self.db.execute(count_query)

        return result.scalars().all(), count_result.scalar_one()

    async def calculate_book_rating(self, book_id: int) -> tuple[Decimal, int]:
        result = await self.db.execute(
            select(
                func.avg(Review.rating),
                func.count(Review.id)
            ).where(Review.book_id == book_id, Review.is_approved == True)
        )
        row = result.one()
        avg_rating = Decimal(str(row[0])) if row[0] else Decimal("0.00")
        count = row[1] or 0
        return round(avg_rating, 2), count

    async def update_book_rating(self, book_id: int) -> None:
        avg_rating, count = await self.calculate_book_rating(book_id)

        result = await self.db.execute(
            select(Book).where(Book.id == book_id)
        )
        book = result.scalar_one_or_none()
        if book:
            book.rating = avg_rating
            book.review_count = count
            await self.db.commit()
