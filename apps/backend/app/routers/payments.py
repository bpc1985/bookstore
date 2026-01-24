from fastapi import APIRouter, Depends, status, Request, Header
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field
from decimal import Decimal

from app.database import get_db
from app.models.user import User
from app.schemas.payment import PaymentCreate, PaymentResponse, PaymentCheckoutResponse
from app.services.payment import PaymentService
from app.dependencies import get_current_active_user

router = APIRouter(prefix="/payments", tags=["Payments"])


class StripeConfirmRequest(BaseModel):
    payment_method_id: str = Field(..., min_length=1)


class PayPalConfirmRequest(BaseModel):
    payer_id: str = Field(..., min_length=1)


class RefundRequest(BaseModel):
    amount: Decimal | None = Field(None, gt=0, description="Partial refund amount. If not provided, full refund is processed")
    reason: str | None = Field(None, max_length=255, description="Reason for the refund")


class RefundResponse(BaseModel):
    payment_id: int
    status: str
    refund_id: str | None
    amount_refunded: Decimal | None
    message: str


@router.post("/checkout", response_model=PaymentCheckoutResponse, status_code=status.HTTP_201_CREATED)
async def initiate_checkout(
    payment_data: PaymentCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Initiate payment for an order."""
    service = PaymentService(db)
    return await service.initiate_payment(current_user.id, payment_data)


@router.post("/stripe/{payment_id}/confirm", response_model=PaymentCheckoutResponse)
async def confirm_stripe_payment(
    payment_id: int,
    request: StripeConfirmRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Confirm and complete a Stripe payment."""
    service = PaymentService(db)
    return await service.confirm_stripe_payment(
        payment_id,
        current_user.id,
        request.payment_method_id
    )


@router.post("/paypal/{payment_id}/confirm", response_model=PaymentCheckoutResponse)
async def confirm_paypal_payment(
    payment_id: int,
    request: PayPalConfirmRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Execute and complete a PayPal payment."""
    service = PaymentService(db)
    return await service.confirm_paypal_payment(
        payment_id,
        current_user.id,
        request.payer_id
    )


@router.post("/{payment_id}/refund", response_model=RefundResponse)
async def refund_payment(
    payment_id: int,
    refund_data: RefundRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Refund a completed payment (full or partial)."""
    from app.exceptions import ForbiddenException

    service = PaymentService(db)
    payment = await service.get_payment(payment_id)

    order = await service.order_repo.get_user_order(payment.order_id, current_user.id)
    if not order:
        raise ForbiddenException("You can only refund your own payments")

    return await service.refund_payment(
        payment_id,
        amount=refund_data.amount,
        reason=refund_data.reason
    )


@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get payment details."""
    service = PaymentService(db)
    payment = await service.get_payment(payment_id)

    from app.models.user import Role
    if current_user.role != Role.ADMIN:
        order = await service.order_repo.get_user_order(payment.order_id, current_user.id)
        if not order:
            from app.exceptions import ForbiddenException
            raise ForbiddenException("You can only view your own payments")

    return payment


@router.post("/webhook/stripe")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="stripe-signature"),
    db: AsyncSession = Depends(get_db),
):
    """Handle Stripe webhooks with signature verification."""
    from app.schemas.payment import WebhookPayload
    from app.models.payment import PaymentProvider

    payload = await request.body()
    try:
        from app.services.payment import PaymentService
        service = PaymentService(db)

        payload_dict = await request.json()
        webhook_payload = WebhookPayload(
            payment_id=int(payload_dict.get("data", {}).get("object", {}).get("metadata", {}).get("order_id", 0)),
            provider=PaymentProvider.STRIPE,
            event_type=payload_dict.get("type", ""),
            provider_reference=payload_dict.get("data", {}).get("object", {}).get("id")
        )

        return await service.handle_webhook(
            webhook_payload,
            raw_payload=payload,
            sig_header=stripe_signature
        )
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/webhook/paypal")
async def paypal_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Handle PayPal webhooks."""
    from app.schemas.payment import WebhookPayload
    from app.models.payment import PaymentProvider

    try:
        from app.services.payment import PaymentService
        service = PaymentService(db)

        payload_dict = await request.json()
        webhook_payload = WebhookPayload(
            payment_id=int(payload_dict.get("resource", {}).get("custom", "").replace("order_id_", "")),
            provider=PaymentProvider.PAYPAL,
            event_type=payload_dict.get("event_type", ""),
            provider_reference=payload_dict.get("resource", {}).get("id")
        )

        return await service.handle_webhook(webhook_payload)
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=str(e))