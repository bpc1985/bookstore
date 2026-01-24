from decimal import Decimal
from typing import Optional
import paypalrestsdk
from paypalrestsdk import ResourceNotFound, Payment as PaymentResource
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import logging

from app.config import get_settings

settings = get_settings()

logger = logging.getLogger(__name__)

paypalrestsdk.configure({
    "mode": settings.paypal_mode,
    "client_id": settings.paypal_client_id,
    "client_secret": settings.paypal_client_secret
})


class PayPalPaymentService:
    def __init__(self):
        self.client_id = settings.paypal_client_id
        self.client_secret = settings.paypal_client_secret
        self.mode = settings.paypal_mode

    async def create_payment(
        self,
        amount: Decimal,
        currency: str = "USD",
        description: str = "Bookstore Purchase",
        return_url: str = "http://localhost:3000/payment/success",
        cancel_url: str = "http://localhost:3000/payment/cancel",
        metadata: Optional[dict] = None
    ) -> dict:
        try:
            payment = paypalrestsdk.Payment({
                "intent": "sale",
                "payer": {
                    "payment_method": "paypal"
                },
                "transactions": [{
                    "amount": {
                        "total": str(amount),
                        "currency": currency
                    },
                    "description": description
                }],
                "redirect_urls": {
                    "return_url": return_url,
                    "cancel_url": cancel_url
                }
            })

            if payment.create():
                approval_url = next(
                    (link.href for link in payment.links if link.rel == "approval_url"),
                    None
                )

                return {
                    "id": payment.id,
                    "status": payment.state,
                    "approval_url": approval_url,
                    "amount": amount,
                    "currency": currency,
                }
            else:
                raise Exception(f"PayPal payment creation failed: {payment.error}")

        except ResourceNotFound as e:
            logger.error(f"PayPal resource not found: {e}")
            raise Exception(f"PayPal error: Resource not found")
        except Exception as e:
            logger.error(f"PayPal payment creation error: {e}")
            raise Exception(f"PayPal error: {str(e)}")

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((Exception,)),
    )
    async def execute_payment(
        self,
        payment_id: str,
        payer_id: str
    ) -> dict:
        try:
            payment = paypalrestsdk.Payment.find(payment_id)

            if payment.state == "approved":
                return {
                    "id": payment.id,
                    "status": payment.state,
                    "amount": Decimal(float(payment.transactions[0].amount.total)),
                    "currency": payment.transactions[0].amount.currency,
                }

            if payment.execute({"payer_id": payer_id}):
                return {
                    "id": payment.id,
                    "status": payment.state,
                    "amount": Decimal(float(payment.transactions[0].amount.total)),
                    "currency": payment.transactions[0].amount.currency,
                }
            else:
                raise Exception(f"PayPal payment execution failed: {payment.error}")

        except ResourceNotFound as e:
            logger.error(f"PayPal resource not found: {e}")
            raise Exception(f"PayPal error: Resource not found")
        except Exception as e:
            logger.error(f"PayPal payment execution error: {e}")
            raise Exception(f"PayPal error: {str(e)}")

    async def get_payment(self, payment_id: str) -> dict:
        try:
            payment = paypalrestsdk.Payment.find(payment_id)

            return {
                "id": payment.id,
                "status": payment.state,
                "intent": payment.intent,
                "create_time": payment.create_time,
                "update_time": payment.update_time,
                "transactions": [
                    {
                        "amount": {
                            "total": transaction.amount.total,
                            "currency": transaction.amount.currency,
                        },
                        "description": transaction.description,
                    }
                    for transaction in payment.transactions
                ],
            }
        except ResourceNotFound as e:
            logger.error(f"PayPal resource not found: {e}")
            raise Exception(f"PayPal error: Resource not found")
        except Exception as e:
            logger.error(f"PayPal get payment error: {e}")
            raise Exception(f"PayPal error: {str(e)}")

    async def refund_payment(
        self,
        payment_id: str,
        amount: Optional[Decimal] = None,
        reason: Optional[str] = None
    ) -> dict:
        try:
            payment = paypalrestsdk.Payment.find(payment_id)

            if not payment.transactions or not payment.transactions[0].related_resources:
                raise Exception("No transaction found for this payment")

            sale_id = payment.transactions[0].related_resources[0].sale.id

            refund_data = {"amount": {}}
            
            if amount:
                refund_data["amount"]["total"] = str(amount)
                refund_data["amount"]["currency"] = payment.transactions[0].amount.currency

            if reason:
                refund_data["reason"] = reason

            sale = paypalrestsdk.Sale.find(sale_id)
            refund = sale.refund(refund_data)

            if refund.success():
                return {
                    "id": refund.id,
                    "status": refund.state,
                    "amount": Decimal(float(refund.amount.total)),
                    "currency": refund.amount.currency,
                    "payment_id": payment_id,
                }
            else:
                raise Exception(f"PayPal refund failed: {refund.error}")

        except ResourceNotFound as e:
            logger.error(f"PayPal resource not found: {e}")
            raise Exception(f"PayPal error: Resource not found")
        except Exception as e:
            logger.error(f"PayPal refund error: {e}")
            raise Exception(f"PayPal error: {str(e)}")

    async def verify_webhook_signature(
        self,
        payload: str,
        headers: dict
    ) -> bool:
        from paypalrestsdk import Webhook

        webhook_id = settings.paypal_webhook_id
        if not webhook_id:
            logger.warning("PayPal webhook ID not configured, skipping verification")
            return True

        try:
            webhook_event = WebhookEvent(payload)
            webhook_event.headers = headers

            is_valid = webhook_event.verify(webhook_id)
            return is_valid
        except Exception as e:
            logger.error(f"PayPal webhook verification error: {e}")
            return False

    async def capture_order(
        self,
        authorization_id: str,
        amount: Optional[Decimal] = None
    ) -> dict:
        try:
            authorization = paypalrestsdk.Authorization.find(authorization_id)

            capture_data = {}
            
            if amount:
                capture_data["amount"] = {
                    "total": str(amount),
                    "currency": authorization.amount.currency
                }

            capture = authorization.capture(capture_data)

            if capture.success():
                return {
                    "id": capture.id,
                    "status": capture.state,
                    "amount": Decimal(float(capture.amount.total)),
                    "currency": capture.amount.currency,
                }
            else:
                raise Exception(f"PayPal capture failed: {capture.error}")

        except ResourceNotFound as e:
            logger.error(f"PayPal resource not found: {e}")
            raise Exception(f"PayPal error: Resource not found")
        except Exception as e:
            logger.error(f"PayPal capture error: {e}")
            raise Exception(f"PayPal error: {str(e)}")

    def get_client_id(self) -> str:
        return self.client_id