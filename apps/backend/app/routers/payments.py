from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User
from app.dependencies import get_current_active_user

router = APIRouter(prefix="/payments", tags=["Payments"])


class CompleteOrderRequest(BaseModel):
    order_id: int


@router.post("/checkout", status_code=status.HTTP_201_CREATED)
async def complete_order(
    request_data: CompleteOrderRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Complete an order without payment processing."""
    from app.repositories.order import OrderRepository
    from app.models.order import OrderStatus, OrderStatusHistory
    from app.services.inventory import InventoryService
    import logging

    logger = logging.getLogger(__name__)

    logger.info(f"Completing order {request_data.order_id} for user {current_user.id}")

    order_repo = OrderRepository(db)
    inventory_service = InventoryService(db)

    order = await order_repo.get_user_order(request_data.order_id, current_user.id)
    if not order:
        logger.error(f"Order {request_data.order_id} not found for user {current_user.id}")
        from app.exceptions import NotFoundException
        raise NotFoundException("Order")
    if not order:
        from app.exceptions import NotFoundException
        raise NotFoundException("Order")

    if order.status != OrderStatus.PENDING:
        from app.exceptions import BadRequestException
        raise BadRequestException("Order is not in pending status")

    order.status = OrderStatus.PAID
    order.payment_reference = "completed_without_payment"

    history = OrderStatusHistory(
        order_id=order.id,
        status=OrderStatus.PAID,
        note="Order completed without payment processing"
    )
    db.add(history)

    await db.commit()

    return {
        "order_id": order.id,
        "status": "completed",
        "message": "Order completed successfully"
    }