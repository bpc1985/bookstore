import uuid
from decimal import Decimal
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.payment import Payment, PaymentProvider, PaymentStatus
from app.models.order import Order, OrderStatus
from app.schemas.payment import PaymentCreate, WebhookPayload
from app.repositories.order import OrderRepository
from app.services.inventory import InventoryService
from app.exceptions import NotFoundException, BadRequestException, PaymentException


class MockStripeService:
    @staticmethod
    async def create_payment_intent(amount: Decimal, idempotency_key: str) -> dict:
        return {
            "id": f"pi_{uuid.uuid4().hex[:24]}",
            "status": "requires_confirmation",
            "amount": int(amount * 100),
        }

    @staticmethod
    async def confirm_payment(payment_intent_id: str) -> dict:
        import random
        success = random.random() > 0.1

        return {
            "id": payment_intent_id,
            "status": "succeeded" if success else "failed",
        }


class MockPayPalService:
    @staticmethod
    async def create_order(amount: Decimal, idempotency_key: str) -> dict:
        return {
            "id": f"PAYPAL-{uuid.uuid4().hex[:20].upper()}",
            "status": "CREATED",
            "amount": str(amount),
        }

    @staticmethod
    async def capture_order(order_id: str) -> dict:
        import random
        success = random.random() > 0.1

        return {
            "id": order_id,
            "status": "COMPLETED" if success else "FAILED",
        }


class PaymentService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.order_repo = OrderRepository(db)
        self.inventory_service = InventoryService(db)
        self.stripe = MockStripeService()
        self.paypal = MockPayPalService()

    async def get_payment_by_idempotency_key(self, key: str) -> Payment | None:
        result = await self.db.execute(
            select(Payment).where(Payment.idempotency_key == key)
        )
        return result.scalar_one_or_none()

    async def get_payment(self, payment_id: int) -> Payment:
        result = await self.db.execute(
            select(Payment).where(Payment.id == payment_id)
        )
        payment = result.scalar_one_or_none()
        if not payment:
            raise NotFoundException("Payment")
        return payment

    async def get_payment_by_order(self, order_id: int) -> Payment | None:
        result = await self.db.execute(
            select(Payment).where(Payment.order_id == order_id)
        )
        return result.scalar_one_or_none()

    async def initiate_payment(self, user_id: int, payment_data: PaymentCreate) -> dict:
        existing = await self.get_payment_by_idempotency_key(payment_data.idempotency_key)
        if existing:
            return {
                "payment_id": existing.id,
                "status": existing.status,
                "redirect_url": None,
                "message": "Payment already exists with this idempotency key"
            }

        order = await self.order_repo.get_user_order(payment_data.order_id, user_id)
        if not order:
            raise NotFoundException("Order")

        if order.status != OrderStatus.PENDING:
            raise BadRequestException("Order is not in pending status")

        existing_payment = await self.get_payment_by_order(order.id)
        if existing_payment and existing_payment.status == PaymentStatus.COMPLETED:
            raise BadRequestException("Order has already been paid")

        if payment_data.provider == PaymentProvider.STRIPE:
            provider_response = await self.stripe.create_payment_intent(
                order.total_amount, payment_data.idempotency_key
            )
            provider_reference = provider_response["id"]
        else:
            provider_response = await self.paypal.create_order(
                order.total_amount, payment_data.idempotency_key
            )
            provider_reference = provider_response["id"]

        payment = Payment(
            order_id=order.id,
            provider=payment_data.provider,
            amount=order.total_amount,
            status=PaymentStatus.PROCESSING,
            idempotency_key=payment_data.idempotency_key,
            provider_reference=provider_reference
        )
        self.db.add(payment)
        await self.db.commit()
        await self.db.refresh(payment)

        return {
            "payment_id": payment.id,
            "status": payment.status,
            "redirect_url": f"/payments/{payment.id}/confirm",
            "message": "Payment initiated successfully"
        }

    async def confirm_payment(self, payment_id: int, user_id: int) -> dict:
        payment = await self.get_payment(payment_id)

        order = await self.order_repo.get_user_order(payment.order_id, user_id)
        if not order:
            raise NotFoundException("Order")

        if payment.status == PaymentStatus.COMPLETED:
            return {
                "payment_id": payment.id,
                "status": payment.status,
                "message": "Payment already completed"
            }

        if payment.status != PaymentStatus.PROCESSING:
            raise BadRequestException("Payment cannot be confirmed")

        if payment.provider == PaymentProvider.STRIPE:
            result = await self.stripe.confirm_payment(payment.provider_reference)
            success = result["status"] == "succeeded"
        else:
            result = await self.paypal.capture_order(payment.provider_reference)
            success = result["status"] == "COMPLETED"

        if success:
            payment.status = PaymentStatus.COMPLETED
            order.status = OrderStatus.PAID
            order.payment_reference = payment.provider_reference

            from app.models.order import OrderStatusHistory
            history = OrderStatusHistory(
                order_id=order.id,
                status=OrderStatus.PAID,
                note=f"Payment completed via {payment.provider.value}"
            )
            self.db.add(history)

            await self.db.commit()

            return {
                "payment_id": payment.id,
                "status": payment.status,
                "message": "Payment completed successfully"
            }
        else:
            payment.status = PaymentStatus.FAILED
            await self.db.commit()

            raise PaymentException("Payment processing failed. Please try again.")

    async def handle_webhook(self, payload: WebhookPayload) -> dict:
        payment = await self.get_payment(payload.payment_id)

        if payload.event_type == "payment.success":
            if payment.status != PaymentStatus.COMPLETED:
                payment.status = PaymentStatus.COMPLETED

                order = await self.order_repo.get_with_details(payment.order_id)
                if order and order.status == OrderStatus.PENDING:
                    order.status = OrderStatus.PAID
                    order.payment_reference = payload.provider_reference

                    from app.models.order import OrderStatusHistory
                    history = OrderStatusHistory(
                        order_id=order.id,
                        status=OrderStatus.PAID,
                        note=f"Payment confirmed via webhook ({payload.provider.value})"
                    )
                    self.db.add(history)

                await self.db.commit()

        elif payload.event_type == "payment.failed":
            if payment.status == PaymentStatus.PROCESSING:
                payment.status = PaymentStatus.FAILED
                await self.db.commit()

        elif payload.event_type == "payment.refunded":
            if payment.status == PaymentStatus.COMPLETED:
                payment.status = PaymentStatus.REFUNDED

                order = await self.order_repo.get_with_details(payment.order_id)
                if order:
                    for item in order.items:
                        await self.inventory_service.release_stock(item.book_id, item.quantity)

                    order.status = OrderStatus.CANCELLED
                    from app.models.order import OrderStatusHistory
                    history = OrderStatusHistory(
                        order_id=order.id,
                        status=OrderStatus.CANCELLED,
                        note="Payment refunded"
                    )
                    self.db.add(history)

                await self.db.commit()

        return {"status": "processed", "payment_status": payment.status.value}
