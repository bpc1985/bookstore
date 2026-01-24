from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewUpdate, ReviewResponse, ReviewListResponse
from app.services.review import ReviewService
from app.dependencies import get_current_active_user
from app.utils.pagination import PaginatedResponse

router = APIRouter(tags=["Reviews"])


@router.post("/books/{book_id}/reviews", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    book_id: int,
    review_data: ReviewCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a review for a book."""
    service = ReviewService(db)
    return await service.create_review(current_user.id, book_id, review_data)


@router.get("/books/{book_id}/reviews", response_model=PaginatedResponse[ReviewListResponse])
async def get_book_reviews(
    book_id: int,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Get reviews for a book."""
    service = ReviewService(db)
    return await service.get_book_reviews(book_id, page, size)


@router.put("/reviews/{review_id}", response_model=ReviewResponse)
async def update_review(
    review_id: int,
    review_data: ReviewUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Update your review."""
    service = ReviewService(db)
    return await service.update_review(current_user.id, review_id, review_data)


@router.delete("/reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete your review."""
    service = ReviewService(db)
    await service.delete_review(current_user.id, review_id)
