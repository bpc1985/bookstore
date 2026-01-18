from datetime import datetime
from pydantic import BaseModel, Field


class ReviewBase(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: str | None = Field(None, max_length=2000)


class ReviewCreate(ReviewBase):
    pass


class ReviewUpdate(BaseModel):
    rating: int | None = Field(None, ge=1, le=5)
    comment: str | None = Field(None, max_length=2000)


class ReviewerInfo(BaseModel):
    id: int
    full_name: str

    class Config:
        from_attributes = True


class ReviewResponse(ReviewBase):
    id: int
    user_id: int
    book_id: int
    is_verified_purchase: bool
    is_approved: bool
    created_at: datetime
    updated_at: datetime
    reviewer: ReviewerInfo | None = None

    class Config:
        from_attributes = True


class ReviewListResponse(BaseModel):
    id: int
    rating: int
    comment: str | None
    is_verified_purchase: bool
    created_at: datetime
    reviewer_name: str

    class Config:
        from_attributes = True
