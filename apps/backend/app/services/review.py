from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.review import Review
from app.models.order import Order, OrderItem, OrderStatus
from app.schemas.review import ReviewCreate, ReviewUpdate
from app.repositories.review import ReviewRepository
from app.repositories.book import BookRepository
from app.exceptions import NotFoundException, ConflictException, ForbiddenException
from app.utils.pagination import PaginatedResponse


class ReviewService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.review_repo = ReviewRepository(db)
        self.book_repo = BookRepository(db)

    async def has_purchased_book(self, user_id: int, book_id: int) -> bool:
        result = await self.db.execute(
            select(OrderItem)
            .join(Order)
            .where(
                Order.user_id == user_id,
                Order.status.in_([OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.COMPLETED]),
                OrderItem.book_id == book_id
            )
        )
        return result.scalar_one_or_none() is not None

    async def create_review(
        self,
        user_id: int,
        book_id: int,
        review_data: ReviewCreate
    ) -> Review:
        book = await self.book_repo.get_with_categories(book_id)
        if not book:
            raise NotFoundException("Book")

        existing = await self.review_repo.get_user_review_for_book(user_id, book_id)
        if existing:
            raise ConflictException("You have already reviewed this book")

        is_verified = await self.has_purchased_book(user_id, book_id)

        review = Review(
            user_id=user_id,
            book_id=book_id,
            rating=review_data.rating,
            comment=review_data.comment,
            is_verified_purchase=is_verified,
            is_approved=True
        )
        self.db.add(review)
        await self.db.commit()
        await self.db.refresh(review)

        await self.review_repo.update_book_rating(book_id)

        result = await self.db.execute(
            select(Review)
            .where(Review.id == review.id)
        )
        return result.scalar_one()

    async def get_book_reviews(
        self,
        book_id: int,
        page: int = 1,
        size: int = 20
    ) -> PaginatedResponse:
        book = await self.book_repo.get_with_categories(book_id)
        if not book:
            raise NotFoundException("Book")

        offset = (page - 1) * size
        reviews, total = await self.review_repo.get_book_reviews(book_id, True, offset, size)

        review_list = []
        for review in reviews:
            review_list.append({
                "id": review.id,
                "rating": review.rating,
                "comment": review.comment,
                "is_verified_purchase": review.is_verified_purchase,
                "created_at": review.created_at,
                "reviewer_name": review.user.full_name if review.user else "Anonymous"
            })

        return PaginatedResponse.create(items=review_list, total=total, page=page, size=size)

    async def update_review(
        self,
        user_id: int,
        review_id: int,
        review_data: ReviewUpdate
    ) -> Review:
        result = await self.db.execute(
            select(Review).where(Review.id == review_id)
        )
        review = result.scalar_one_or_none()

        if not review:
            raise NotFoundException("Review")

        if review.user_id != user_id:
            raise ForbiddenException("You can only edit your own reviews")

        if review_data.rating is not None:
            review.rating = review_data.rating
        if review_data.comment is not None:
            review.comment = review_data.comment

        await self.db.commit()
        await self.db.refresh(review)

        await self.review_repo.update_book_rating(review.book_id)

        return review

    async def delete_review(self, user_id: int, review_id: int) -> None:
        result = await self.db.execute(
            select(Review).where(Review.id == review_id)
        )
        review = result.scalar_one_or_none()

        if not review:
            raise NotFoundException("Review")

        if review.user_id != user_id:
            raise ForbiddenException("You can only delete your own reviews")

        book_id = review.book_id
        await self.review_repo.delete(review)
        await self.review_repo.update_book_rating(book_id)

    async def approve_review(self, review_id: int, approved: bool = True) -> Review:
        result = await self.db.execute(
            select(Review).where(Review.id == review_id)
        )
        review = result.scalar_one_or_none()

        if not review:
            raise NotFoundException("Review")

        review.is_approved = approved
        await self.db.commit()
        await self.db.refresh(review)

        await self.review_repo.update_book_rating(review.book_id)

        return review

    async def get_pending_reviews(self, page: int = 1, size: int = 20) -> PaginatedResponse:
        offset = (page - 1) * size
        reviews, total = await self.review_repo.get_pending_reviews(offset, size)
        return PaginatedResponse.create(items=list(reviews), total=total, page=page, size=size)
