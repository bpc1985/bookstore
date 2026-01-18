from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cart import CartItem
from app.schemas.cart import CartItemCreate, CartItemUpdate, CartResponse, CartItemResponse
from app.repositories.cart import CartRepository
from app.repositories.book import BookRepository
from app.services.inventory import InventoryService
from app.exceptions import NotFoundException, BadRequestException


class CartService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.cart_repo = CartRepository(db)
        self.book_repo = BookRepository(db)
        self.inventory_service = InventoryService(db)

    async def get_cart(self, user_id: int) -> CartResponse:
        items = await self.cart_repo.get_user_cart(user_id)
        cart_items = []
        subtotal = Decimal("0.00")
        total_items = 0

        for item in items:
            if item.book and not item.book.is_deleted:
                cart_items.append(item)
                subtotal += item.book.price * item.quantity
                total_items += item.quantity

        return CartResponse(
            items=cart_items,
            total_items=total_items,
            subtotal=subtotal
        )

    async def add_item(self, user_id: int, item_data: CartItemCreate) -> CartItemResponse:
        book = await self.book_repo.get_with_categories(item_data.book_id)
        if not book:
            raise NotFoundException("Book")

        if not await self.inventory_service.check_stock(item_data.book_id, item_data.quantity):
            raise BadRequestException(f"Only {book.stock_quantity} items available")

        existing_item = await self.cart_repo.get_cart_item(user_id, item_data.book_id)

        if existing_item:
            new_quantity = existing_item.quantity + item_data.quantity
            if not await self.inventory_service.check_stock(item_data.book_id, new_quantity):
                raise BadRequestException(f"Only {book.stock_quantity} items available")

            existing_item.quantity = new_quantity
            existing_item.expires_at = datetime.utcnow() + timedelta(days=7)
            await self.db.commit()
            await self.db.refresh(existing_item)
            return existing_item

        cart_item = CartItem(
            user_id=user_id,
            book_id=item_data.book_id,
            quantity=item_data.quantity,
            expires_at=datetime.utcnow() + timedelta(days=7)
        )
        self.db.add(cart_item)
        await self.db.commit()
        await self.db.refresh(cart_item)

        return await self.cart_repo.get_cart_item_by_id(cart_item.id, user_id)

    async def update_item(self, user_id: int, item_id: int, item_data: CartItemUpdate) -> CartItemResponse:
        item = await self.cart_repo.get_cart_item_by_id(item_id, user_id)
        if not item:
            raise NotFoundException("Cart item")

        if not await self.inventory_service.check_stock(item.book_id, item_data.quantity):
            book = await self.book_repo.get(item.book_id)
            raise BadRequestException(f"Only {book.stock_quantity if book else 0} items available")

        item.quantity = item_data.quantity
        item.expires_at = datetime.utcnow() + timedelta(days=7)
        await self.db.commit()
        await self.db.refresh(item)

        return await self.cart_repo.get_cart_item_by_id(item.id, user_id)

    async def remove_item(self, user_id: int, item_id: int) -> None:
        item = await self.cart_repo.get_cart_item_by_id(item_id, user_id)
        if not item:
            raise NotFoundException("Cart item")
        await self.cart_repo.delete(item)

    async def clear_cart(self, user_id: int) -> None:
        await self.cart_repo.clear_user_cart(user_id)

    async def validate_cart_for_checkout(self, user_id: int) -> CartResponse:
        cart = await self.get_cart(user_id)

        if not cart.items:
            raise BadRequestException("Cart is empty")

        for item in cart.items:
            stock = await self.inventory_service.get_stock(item.book_id)
            if stock < item.quantity:
                raise BadRequestException(
                    f"Insufficient stock for '{item.book.title}'. Available: {stock}"
                )

        return cart
