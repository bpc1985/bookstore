from decimal import Decimal
from typing import Optional
import stripe
from stripe.error import StripeError, CardError, APIError
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from app.config import get_settings

settings = get_settings()

if settings.stripe_secret_key:
    stripe.api_key = settings.stripe_secret_key


class StripePaymentService:
    def __init__(self):
        self.api_key = settings.stripe_secret_key
        self.webhook_secret = settings.stripe_webhook_secret
        self.publishable_key = settings.stripe_publishable_key

    async def create_payment_intent(
        self,
        amount: Decimal,
        currency: str = "usd",
        idempotency_key: Optional[str] = None,
        metadata: Optional[dict] = None
    ) -> dict:
        try:
            amount_cents = int(amount * 100)
            
            intent_params = {
                "amount": amount_cents,
                "currency": currency,
                "automatic_payment_methods": {
                    "enabled": True,
                },
            }

            if idempotency_key:
                intent_params["idempotency_key"] = idempotency_key

            if metadata:
                intent_params["metadata"] = metadata

            intent = stripe.PaymentIntent.create(**intent_params)

            return {
                "id": intent.id,
                "status": intent.status,
                "client_secret": intent.client_secret,
                "amount": amount,
                "currency": currency,
            }
        except StripeError as e:
            raise self._handle_stripe_error(e)

    async def confirm_payment_intent(self, payment_intent_id: str) -> dict:
        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            
            return {
                "id": intent.id,
                "status": intent.status,
                "amount": Decimal(intent.amount / 100),
                "currency": intent.currency,
                "payment_method": intent.payment_method,
                "description": intent.description,
            }
        except StripeError as e:
            raise self._handle_stripe_error(e)

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((APIError,)),
    )
    async def capture_payment(
        self,
        payment_intent_id: str,
        amount_to_capture: Optional[Decimal] = None
    ) -> dict:
        try:
            capture_params = {"payment_intent": payment_intent_id}
            
            if amount_to_capture:
                capture_params["amount_to_capture"] = int(amount_to_capture * 100)

            intent = stripe.PaymentIntent.capture(payment_intent_id, **capture_params)

            return {
                "id": intent.id,
                "status": intent.status,
                "amount": Decimal(intent.amount / 100),
                "amount_captured": Decimal(intent.amount_received / 100) if intent.amount_received else Decimal(0),
            }
        except StripeError as e:
            raise self._handle_stripe_error(e)

    async def cancel_payment_intent(self, payment_intent_id: str) -> dict:
        try:
            intent = stripe.PaymentIntent.cancel(payment_intent_id)
            
            return {
                "id": intent.id,
                "status": intent.status,
            }
        except StripeError as e:
            raise self._handle_stripe_error(e)

    async def create_refund(
        self,
        payment_intent_id: str,
        amount: Optional[Decimal] = None,
        reason: Optional[str] = None,
        metadata: Optional[dict] = None
    ) -> dict:
        try:
            refund_params = {"payment_intent": payment_intent_id}

            if amount:
                refund_params["amount"] = int(amount * 100)

            if reason:
                refund_params["reason"] = reason

            if metadata:
                refund_params["metadata"] = metadata

            refund = stripe.Refund.create(**refund_params)

            return {
                "id": refund.id,
                "status": refund.status,
                "amount": Decimal(refund.amount / 100),
                "currency": refund.currency,
                "payment_intent": refund.payment_intent,
            }
        except StripeError as e:
            raise self._handle_stripe_error(e)

    async def construct_webhook_event(self, payload: bytes, sig_header: str) -> dict:
        if not self.webhook_secret:
            raise ValueError("Stripe webhook secret not configured")

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, self.webhook_secret
            )
            return {
                "id": event.id,
                "type": event.type,
                "data": event.data,
            }
        except ValueError:
            raise ValueError("Invalid payload")
        except stripe.error.SignatureVerificationError:
            raise ValueError("Invalid signature")

    async def retrieve_payment_method(self, payment_method_id: str) -> dict:
        try:
            payment_method = stripe.PaymentMethod.retrieve(payment_method_id)
            
            return {
                "id": payment_method.id,
                "type": payment_method.type,
                "card": {
                    "brand": payment_method.card.brand,
                    "last4": payment_method.card.last4,
                    "exp_month": payment_method.card.exp_month,
                    "exp_year": payment_method.card.exp_year,
                } if payment_method.card else None,
            }
        except StripeError as e:
            raise self._handle_stripe_error(e)

    def _handle_stripe_error(self, error: StripeError) -> Exception:
        if isinstance(error, CardError):
            return Exception(f"Card error: {error.message}")
        elif isinstance(error, APIError):
            return Exception(f"API error: {error.message}")
        else:
            return Exception(f"Stripe error: {error.message}")

    def get_publishable_key(self) -> str:
        return self.publishable_key