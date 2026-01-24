from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.order import Order, OrderStatus
from app.models.book import Book
from app.models.review import Review
from app.schemas.order import OrderDetailResponse, OrderListResponse, OrderStatusUpdate
from app.schemas.review import ReviewResponse
from app.services.order import OrderService
from app.services.review import ReviewService
from app.dependencies import get_admin_user
from app.utils.pagination import PaginatedResponse
from pydantic import BaseModel
from decimal import Decimal


router = APIRouter(prefix="/admin", tags=["Admin"])


class AnalyticsResponse(BaseModel):
    total_orders: int
    total_revenue: Decimal
    pending_orders: int
    total_books: int
    total_users: int
    total_reviews: int


@router.get("/orders", response_model=PaginatedResponse[OrderListResponse])
async def list_all_orders(
    status: OrderStatus | None = Query(None, description="Filter by status"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """List all orders (Admin only)."""
    service = OrderService(db)
    return await service.get_all_orders(status, page, size)


@router.get("/orders/{order_id}", response_model=OrderDetailResponse)
async def get_order_admin(
    order_id: int,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Get order details (Admin only)."""
    service = OrderService(db)
    order = await service.get_order_admin(order_id)

    items_response = []
    for item in order.items:
        items_response.append({
            "id": item.id,
            "book_id": item.book_id,
            "quantity": item.quantity,
            "price_at_purchase": item.price_at_purchase,
            "book_title": item.book.title if item.book else None,
            "book_author": item.book.author if item.book else None,
        })

    return {
        "id": order.id,
        "user_id": order.user_id,
        "status": order.status,
        "total_amount": order.total_amount,
        "shipping_address": order.shipping_address,
        "payment_reference": order.payment_reference,
        "created_at": order.created_at,
        "updated_at": order.updated_at,
        "items": items_response,
        "status_history": order.status_history,
    }


@router.put("/orders/{order_id}/status", response_model=OrderDetailResponse)
async def update_order_status(
    order_id: int,
    status_update: OrderStatusUpdate,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Update order status (Admin only)."""
    service = OrderService(db)
    return await service.update_order_status(order_id, status_update)


@router.get("/reviews/pending", response_model=PaginatedResponse[ReviewResponse])
async def list_pending_reviews(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """List pending reviews for moderation (Admin only)."""
    service = ReviewService(db)
    return await service.get_pending_reviews(page, size)


@router.put("/reviews/{review_id}/approve", response_model=ReviewResponse)
async def approve_review(
    review_id: int,
    approved: bool = Query(True, description="Approve or reject"),
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Approve or reject a review (Admin only)."""
    service = ReviewService(db)
    return await service.approve_review(review_id, approved)


@router.get("/analytics", response_model=AnalyticsResponse)
async def get_analytics(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Get basic analytics (Admin only)."""
    total_orders_result = await db.execute(select(func.count(Order.id)))
    total_orders = total_orders_result.scalar_one()

    revenue_result = await db.execute(
        select(func.sum(Order.total_amount))
        .where(Order.status.in_([OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.COMPLETED]))
    )
    total_revenue = revenue_result.scalar_one() or Decimal("0.00")

    pending_result = await db.execute(
        select(func.count(Order.id)).where(Order.status == OrderStatus.PENDING)
    )
    pending_orders = pending_result.scalar_one()

    books_result = await db.execute(
        select(func.count(Book.id)).where(Book.is_deleted == False)
    )
    total_books = books_result.scalar_one()

    users_result = await db.execute(select(func.count(User.id)))
    total_users = users_result.scalar_one()

    reviews_result = await db.execute(select(func.count(Review.id)))
    total_reviews = reviews_result.scalar_one()

    return AnalyticsResponse(
        total_orders=total_orders,
        total_revenue=total_revenue,
        pending_orders=pending_orders,
        total_books=total_books,
        total_users=total_users,
        total_reviews=total_reviews,
    )
