import logging
from decimal import Decimal
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.payment import Payment, PaymentProvider, PaymentStatus
from app.models.payment_log import PaymentLog
from app.models.order import Order, OrderStatus
from app.schemas.payment import PaymentCreate, WebhookPayload
from app.repositories.order import OrderRepository
from app.services.inventory import InventoryService
from app.services.stripe_service import StripePaymentService
from app.services.paypal_service import PayPalPaymentService
from app.exceptions import NotFoundException, BadRequestException, PaymentException
from app.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)


class PaymentService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.order_repo = OrderRepository(db)
        self.inventory_service = InventoryService(db)
        self.stripe = StripePaymentService()
        self.paypal = PayPalPaymentService()
        self.max_retries = settings.payment_retry_max_attempts
        self.retry_delay = settings.payment_retry_delay_seconds

    async def _log_payment_action(
        self,
        payment: Payment,
        action: str,
        status: str,
        request_data: dict = None,
        response_data: dict = None,
        error_message: str = None
    ):
        log = PaymentLog(
            payment_id=payment.id,
            action=action,
            status=status,
            request_data=request_data,
            response_data=response_data,
            error_message=error_message
        )
        self.db.add(log)
        await self.db.commit()

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
            logger.info(f"Payment already exists with idempotency key: {payment_data.idempotency_key}")
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

        payment = Payment(
            order_id=order.id,
            provider=payment_data.provider,
            amount=order.total_amount,
            status=PaymentStatus.PENDING,
            idempotency_key=payment_data.idempotency_key,
            provider_reference=None
        )
        self.db.add(payment)
        await self.db.commit()
        await self.db.refresh(payment)

        try:
            if payment_data.provider == PaymentProvider.STRIPE:
                provider_response = await self.stripe.create_payment_intent(
                    order.total_amount,
                    idempotency_key=payment_data.idempotency_key,
                    metadata={"order_id": str(order.id)}
                )
                provider_reference = provider_response["id"]
                client_secret = provider_response.get("client_secret")
                payment.provider_reference = provider_reference
                payment.status = PaymentStatus.PROCESSING

                await self._log_payment_action(
                    payment,
                    "create_payment_intent",
                    "success",
                    request_data={"amount": str(order.total_amount)},
                    response_data={"intent_id": provider_reference}
                )

                await self.db.commit()
                await self.db.refresh(payment)

                return {
                    "payment_id": payment.id,
                    "status": payment.status,
                    "client_secret": client_secret,
                    "redirect_url": None,
                    "message": "Payment initiated successfully"
                }

            elif payment_data.provider == PaymentProvider.PAYPAL:
                provider_response = await self.paypal.create_payment(
                    order.total_amount,
                    metadata={"order_id": str(order.id)}
                )
                provider_reference = provider_response["id"]
                approval_url = provider_response.get("approval_url")
                payment.provider_reference = provider_reference
                payment.status = PaymentStatus.REQUIRES_ACTION

                await self._log_payment_action(
                    payment,
                    "create_payment",
                    "success",
                    request_data={"amount": str(order.total_amount)},
                    response_data={"payment_id": provider_reference}
                )

                await self.db.commit()
                await self.db.refresh(payment)

                return {
                    "payment_id": payment.id,
                    "status": payment.status,
                    "approval_url": approval_url,
                    "redirect_url": None,
                    "message": "Payment initiated successfully"
                }

        except Exception as e:
            logger.error(f"Payment initiation failed: {e}")
            payment.status = PaymentStatus.FAILED
            await self._log_payment_action(
                payment,
                "initiate_payment",
                "failed",
                error_message=str(e)
            )
            await self.db.commit()
            raise PaymentException(f"Payment initiation failed: {str(e)}")

    async def confirm_stripe_payment(
        self,
        payment_id: int,
        user_id: int,
        payment_method_id: str
    ) -> dict:
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

        if payment.status not in [PaymentStatus.PROCESSING, PaymentStatus.REQUIRES_ACTION]:
            raise BadRequestException("Payment cannot be confirmed")

        try:
            intent_result = await self.stripe.confirm_payment_intent(payment.provider_reference)

            if intent_result["status"] in ["succeeded"]:
                await self._complete_payment(payment, order)
                return {
                    "payment_id": payment.id,
                    "status": payment.status,
                    "message": "Payment completed successfully"
                }
            elif intent_result["status"] == "requires_action":
                payment.status = PaymentStatus.REQUIRES_ACTION
                await self.db.commit()
                raise BadRequestException("Additional authentication required")
            else:
                payment.status = PaymentStatus.FAILED
                await self._log_payment_action(
                    payment,
                    "confirm_payment",
                    "failed",
                    error_message=f"Payment status: {intent_result['status']}"
                )
                await self.db.commit()
                raise PaymentException("Payment failed")

        except Exception as e:
            logger.error(f"Stripe payment confirmation failed: {e}")
            payment.status = PaymentStatus.FAILED
            await self._log_payment_action(
                payment,
                "confirm_payment",
                "failed",
                error_message=str(e)
            )
            await self.db.commit()
            raise PaymentException(f"Payment confirmation failed: {str(e)}")

    async def confirm_paypal_payment(
        self,
        payment_id: int,
        user_id: int,
        payer_id: str
    ) -> dict:
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

        if payment.status != PaymentStatus.REQUIRES_ACTION:
            raise BadRequestException("Payment cannot be confirmed")

        try:
            execute_result = await self.paypal.execute_payment(
                payment.provider_reference,
                payer_id
            )

            if execute_result["status"] == "approved":
                await self._complete_payment(payment, order)
                return {
                    "payment_id": payment.id,
                    "status": payment.status,
                    "message": "Payment completed successfully"
                }
            else:
                payment.status = PaymentStatus.FAILED
                await self._log_payment_action(
                    payment,
                    "execute_payment",
                    "failed",
                    error_message=f"Payment status: {execute_result['status']}"
                )
                await self.db.commit()
                raise PaymentException("Payment failed")

        except Exception as e:
            logger.error(f"PayPal payment execution failed: {e}")
            payment.status = PaymentStatus.FAILED
            await self._log_payment_action(
                payment,
                "execute_payment",
                "failed",
                error_message=str(e)
            )
            await self.db.commit()
            raise PaymentException(f"Payment execution failed: {str(e)}")

    async def _complete_payment(self, payment: Payment, order: Order):
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

        await self._log_payment_action(
            payment,
            "complete_payment",
            "success",
            response_data={"order_id": order.id}
        )

        await self.db.commit()

    async def refund_payment(
        self,
        payment_id: int,
        amount: Decimal = None,
        reason: str = None
    ) -> dict:
        payment = await self.get_payment(payment_id)

        if payment.status != PaymentStatus.COMPLETED:
            raise BadRequestException("Only completed payments can be refunded")

        try:
            order = await self.order_repo.get_with_details(payment.order_id)

            if payment.provider == PaymentProvider.STRIPE:
                refund_result = await self.stripe.create_refund(
                    payment.provider_reference,
                    amount=amount,
                    reason=reason
                )
            elif payment.provider == PaymentProvider.PAYPAL:
                refund_result = await self.paypal.refund_payment(
                    payment.provider_reference,
                    amount=amount,
                    reason=reason
                )
            else:
                raise BadRequestException("Unsupported payment provider")

            payment.status = PaymentStatus.REFUNDED

            if order and order.status in [OrderStatus.PAID, OrderStatus.PROCESSING]:
                for item in order.items:
                    await self.inventory_service.release_stock(item.book_id, item.quantity)

                order.status = OrderStatus.CANCELLED
                from app.models.order import OrderStatusHistory
                history = OrderStatusHistory(
                    order_id=order.id,
                    status=OrderStatus.CANCELLED,
                    note=f"Payment refunded: {reason or 'No reason provided'}"
                )
                self.db.add(history)

            await self._log_payment_action(
                payment,
                "refund_payment",
                "success",
                request_data={"amount": str(amount) if amount else "full", "reason": reason},
                response_data={"refund_id": refund_result.get("id")}
            )

            await self.db.commit()

            return {
                "payment_id": payment.id,
                "status": payment.status,
                "refund_id": refund_result.get("id"),
                "amount_refunded": refund_result.get("amount"),
                "message": "Payment refunded successfully"
            }

        except Exception as e:
            logger.error(f"Refund failed: {e}")
            await self._log_payment_action(
                payment,
                "refund_payment",
                "failed",
                error_message=str(e)
            )
            raise PaymentException(f"Refund failed: {str(e)}")

    async def handle_webhook(self, payload: WebhookPayload, raw_payload: bytes = None, sig_header: str = None) -> dict:
        payment = await self.get_payment(payload.payment_id)

        if payload.provider == PaymentProvider.STRIPE and raw_payload and sig_header:
            try:
                event = await self.stripe.construct_webhook_event(raw_payload, sig_header)
                await self._log_payment_action(
                    payment,
                    "webhook_received",
                    "success",
                    request_data={"event_type": event.get("type")}
                )
            except Exception as e:
                logger.error(f"Stripe webhook verification failed: {e}")
                raise BadRequestException("Invalid webhook signature")

        elif payload.provider == PaymentProvider.PAYPAL:
            await self._log_payment_action(
                payment,
                "webhook_received",
                "success",
                request_data={"event_type": payload.event_type}
            )

        if payload.event_type in ["payment.succeeded", "payment_intent.succeeded"]:
            if payment.status != PaymentStatus.COMPLETED:
                await self._complete_payment_from_webhook(payment)

        elif payload.event_type in ["payment.failed", "payment_intent.payment_failed"]:
            if payment.status == PaymentStatus.PROCESSING:
                payment.status = PaymentStatus.FAILED
                await self._log_payment_action(
                    payment,
                    "webhook_failed",
                    "success",
                    error_message="Payment failed via webhook"
                )
                await self.db.commit()

        elif payload.event_type in ["payment.refunded", "charge.refunded"]:
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
                        note="Payment refunded via webhook"
                    )
                    self.db.add(history)

                await self._log_payment_action(
                    payment,
                    "webhook_refunded",
                    "success"
                )

                await self.db.commit()

        return {"status": "processed", "payment_status": payment.status.value}

    async def _complete_payment_from_webhook(self, payment: Payment):
        payment.status = PaymentStatus.COMPLETED

        order = await self.order_repo.get_with_details(payment.order_id)
        if order and order.status == OrderStatus.PENDING:
            order.status = OrderStatus.PAID
            order.payment_reference = payment.provider_reference

            from app.models.order import OrderStatusHistory
            history = OrderStatusHistory(
                order_id=order.id,
                status=OrderStatus.PAID,
                note=f"Payment confirmed via webhook ({payment.provider.value})"
            )
            self.db.add(history)

        await self._log_payment_action(
            payment,
            "webhook_complete",
            "success"
        )

        await self.db.commit()