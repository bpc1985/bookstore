from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field

from app.models.payment import PaymentProvider, PaymentStatus


class PaymentCreate(BaseModel):
    order_id: int
    provider: PaymentProvider
    idempotency_key: str = Field(..., min_length=10, max_length=255)


class PaymentResponse(BaseModel):
    id: int
    order_id: int
    provider: PaymentProvider
    amount: Decimal
    status: PaymentStatus
    idempotency_key: str
    provider_reference: str | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PaymentCheckoutResponse(BaseModel):
    payment_id: int
    status: PaymentStatus
    redirect_url: str | None = None
    message: str


class WebhookPayload(BaseModel):
    payment_id: int
    provider: PaymentProvider
    event_type: str
    provider_reference: str | None = None
