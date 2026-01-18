from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.payment import PaymentCreate, PaymentResponse, PaymentCheckoutResponse, WebhookPayload
from app.services.payment import PaymentService
from app.dependencies import get_current_active_user

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/checkout", response_model=PaymentCheckoutResponse, status_code=status.HTTP_201_CREATED)
async def initiate_checkout(
    payment_data: PaymentCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Initiate payment for an order."""
    service = PaymentService(db)
    return await service.initiate_payment(current_user.id, payment_data)


@router.post("/{payment_id}/confirm", response_model=PaymentCheckoutResponse)
async def confirm_payment(
    payment_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Confirm and complete a payment."""
    service = PaymentService(db)
    return await service.confirm_payment(payment_id, current_user.id)


@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get payment details."""
    service = PaymentService(db)
    payment = await service.get_payment(payment_id)

    order = await service.order_repo.get_user_order(payment.order_id, current_user.id)
    if not order:
        from app.exceptions import NotFoundException
        raise NotFoundException("Payment")

    return payment


@router.post("/webhook")
async def payment_webhook(
    payload: WebhookPayload,
    db: AsyncSession = Depends(get_db),
):
    """Handle payment provider webhooks (Stripe/PayPal)."""
    service = PaymentService(db)
    return await service.handle_webhook(payload)
