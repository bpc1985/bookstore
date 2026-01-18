from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field

from app.schemas.category import CategoryResponse


class BookBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    author: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    isbn: str = Field(..., min_length=10, max_length=20)
    price: Decimal = Field(..., gt=0)
    stock_quantity: int = Field(default=0, ge=0)
    cover_image: str | None = None


class BookCreate(BookBase):
    category_ids: list[int] = []


class BookUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=255)
    author: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    price: Decimal | None = Field(None, gt=0)
    stock_quantity: int | None = Field(None, ge=0)
    cover_image: str | None = None
    category_ids: list[int] | None = None


class BookResponse(BookBase):
    id: int
    rating: Decimal
    review_count: int
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
    categories: list[CategoryResponse] = []

    class Config:
        from_attributes = True


class BookListResponse(BaseModel):
    id: int
    title: str
    author: str
    price: Decimal
    stock_quantity: int
    cover_image: str | None
    rating: Decimal
    review_count: int
    categories: list[CategoryResponse] = []

    class Config:
        from_attributes = True


class BookSearchParams(BaseModel):
    search: str | None = None
    category_id: int | None = None
    min_price: Decimal | None = None
    max_price: Decimal | None = None
    in_stock: bool | None = None
    sort_by: str = "created_at"
    sort_order: str = "desc"
