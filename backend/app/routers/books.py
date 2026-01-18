from decimal import Decimal
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.book import (
    BookCreate,
    BookUpdate,
    BookResponse,
    BookListResponse,
    BookSearchParams,
)
from app.services.book import BookService
from app.services.recommendation import RecommendationService
from app.dependencies import get_admin_user, get_optional_user
from app.utils.pagination import PaginatedResponse

router = APIRouter(prefix="/books", tags=["Books"])


@router.get("", response_model=PaginatedResponse[BookListResponse])
async def list_books(
    search: str | None = Query(None, description="Search in title or author"),
    category_id: int | None = Query(None, description="Filter by category"),
    min_price: Decimal | None = Query(None, description="Minimum price"),
    max_price: Decimal | None = Query(None, description="Maximum price"),
    in_stock: bool | None = Query(None, description="Only show in-stock items"),
    sort_by: str = Query("created_at", description="Sort field"),
    sort_order: str = Query("desc", description="Sort order (asc/desc)"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Page size"),
    db: AsyncSession = Depends(get_db),
):
    """List books with filtering, sorting, and pagination."""
    params = BookSearchParams(
        search=search,
        category_id=category_id,
        min_price=min_price,
        max_price=max_price,
        in_stock=in_stock,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    service = BookService(db)
    return await service.search_books(params, page, size)


@router.get("/{book_id}", response_model=BookResponse)
async def get_book(book_id: int, db: AsyncSession = Depends(get_db)):
    """Get a book by ID."""
    service = BookService(db)
    return await service.get_book(book_id)


@router.get("/{book_id}/recommendations", response_model=list[BookListResponse])
async def get_book_recommendations(
    book_id: int,
    limit: int = Query(5, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
):
    """Get book recommendations (customers also bought)."""
    service = RecommendationService(db)
    return await service.get_also_bought(book_id, limit)


@router.post("", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
async def create_book(
    book_data: BookCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    """Create a new book (Admin only)."""
    service = BookService(db)
    return await service.create_book(book_data)


@router.put("/{book_id}", response_model=BookResponse)
async def update_book(
    book_id: int,
    book_data: BookUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    """Update a book (Admin only)."""
    service = BookService(db)
    return await service.update_book(book_id, book_data)


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_book(
    book_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    """Soft delete a book (Admin only)."""
    service = BookService(db)
    await service.delete_book(book_id)
