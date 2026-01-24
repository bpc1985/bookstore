from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field

from app.schemas.book import BookListResponse


class CartItemBase(BaseModel):
    book_id: int
    quantity: int = Field(default=1, ge=1)


class CartItemCreate(CartItemBase):
    pass


class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=1)


class CartItemResponse(BaseModel):
    id: int
    book_id: int
    quantity: int
    added_at: datetime
    expires_at: datetime
    book: BookListResponse

    class Config:
        from_attributes = True


class CartResponse(BaseModel):
    items: list[CartItemResponse]
    total_items: int
    subtotal: Decimal

    class Config:
        from_attributes = True


class CartSummary(BaseModel):
    total_items: int
    subtotal: Decimal
