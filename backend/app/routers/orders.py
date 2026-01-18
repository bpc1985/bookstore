from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.order import OrderStatus
from app.schemas.order import (
    OrderCreate,
    OrderResponse,
    OrderDetailResponse,
    OrderListResponse,
    OrderStatusHistoryResponse,
)
from app.services.order import OrderService
from app.dependencies import get_current_active_user
from app.utils.pagination import PaginatedResponse

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("", response_model=OrderDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: OrderCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new order from cart items."""
    service = OrderService(db)
    return await service.create_order(current_user.id, order_data)


@router.get("", response_model=PaginatedResponse[OrderListResponse])
async def list_orders(
    status: OrderStatus | None = Query(None, description="Filter by status"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List current user's orders."""
    service = OrderService(db)
    return await service.get_user_orders(current_user.id, status, page, size)


@router.get("/{order_id}", response_model=OrderDetailResponse)
async def get_order(
    order_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get order details."""
    service = OrderService(db)
    order = await service.get_order(order_id, current_user.id)

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


@router.get("/{order_id}/tracking", response_model=list[OrderStatusHistoryResponse])
async def get_order_tracking(
    order_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get order status timeline."""
    service = OrderService(db)
    return await service.get_order_tracking(order_id, current_user.id)


@router.put("/{order_id}/cancel", response_model=OrderDetailResponse)
async def cancel_order(
    order_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Cancel a pending order."""
    service = OrderService(db)
    return await service.cancel_order(order_id, current_user.id)
