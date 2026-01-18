from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field

from app.models.order import OrderStatus


class OrderItemResponse(BaseModel):
    id: int
    book_id: int
    quantity: int
    price_at_purchase: Decimal
    book_title: str | None = None
    book_author: str | None = None

    class Config:
        from_attributes = True


class OrderStatusHistoryResponse(BaseModel):
    id: int
    status: OrderStatus
    note: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    shipping_address: str = Field(..., min_length=10, max_length=500)


class OrderResponse(BaseModel):
    id: int
    user_id: int
    status: OrderStatus
    total_amount: Decimal
    shipping_address: str
    payment_reference: str | None
    created_at: datetime
    updated_at: datetime
    items: list[OrderItemResponse] = []

    class Config:
        from_attributes = True


class OrderDetailResponse(OrderResponse):
    status_history: list[OrderStatusHistoryResponse] = []

    class Config:
        from_attributes = True


class OrderListResponse(BaseModel):
    id: int
    status: OrderStatus
    total_amount: Decimal
    created_at: datetime
    item_count: int

    class Config:
        from_attributes = True


class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    note: str | None = None
