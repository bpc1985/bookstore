import pytest
from decimal import Decimal


@pytest.mark.asyncio
class TestOrderFlow:
    async def test_complete_order_flow(self, client, sample_book):
        # Step 1: Register and login
        await client.post(
            "/auth/register",
            json={
                "email": "orderflow@example.com",
                "password": "password123",
                "full_name": "Order Flow User"
            }
        )
        login_response = await client.post(
            "/auth/login",
            json={"email": "orderflow@example.com", "password": "password123"}
        )
        tokens = login_response.json()
        auth_headers = {"Authorization": f"Bearer {tokens['access_token']}"}

        # Step 2: Add items to cart
        add_response = await client.post(
            "/cart/items",
            headers=auth_headers,
            json={"book_id": sample_book.id, "quantity": 3}
        )
        assert add_response.status_code == 201

        # Step 3: Verify cart subtotal
        cart_response = await client.get("/cart", headers=auth_headers)
        cart_data = cart_response.json()
        assert cart_data["total_items"] == 3
        expected_subtotal = float(sample_book.price) * 3
        assert float(cart_data["subtotal"]) == expected_subtotal

        # Step 4: Create order
        order_response = await client.post(
            "/orders",
            headers=auth_headers,
            json={"shipping_address": "123 Test Street, Test City, TC 12345"}
        )
        assert order_response.status_code == 201
        order_data = order_response.json()
        assert order_data["status"] == "pending"

        # Step 5: Verify cart is cleared
        cart_response = await client.get("/cart", headers=auth_headers)
        cart_data = cart_response.json()
        assert cart_data["total_items"] == 0
        assert cart_data["subtotal"] == "0.00"

        # Step 6: Get order details
        order_detail_response = await client.get(
            f"/orders/{order_data['id']}",
            headers=auth_headers
        )
        assert order_detail_response.status_code == 200
        order_detail = order_detail_response.json()
        assert len(order_detail["items"]) == 1
        assert order_detail["items"][0]["quantity"] == 3

    async def test_order_flow_with_multiple_items(self, client, db_session, sample_category):
        # Create additional books
        from app.models.book import Book
        from decimal import Decimal

        book1 = Book(
            title="Book One",
            author="Author One",
            description="Description One",
            isbn="1111111111111",
            price=Decimal("10.00"),
            stock_quantity=10,
            rating=Decimal("4.0"),
            review_count=1
        )
        book1.categories.append(sample_category)

        book2 = Book(
            title="Book Two",
            author="Author Two",
            description="Description Two",
            isbn="2222222222222",
            price=Decimal("20.00"),
            stock_quantity=5,
            rating=Decimal("4.5"),
            review_count=2
        )
        book2.categories.append(sample_category)

        db_session.add_all([book1, book2])
        await db_session.commit()
        await db_session.refresh(book1)
        await db_session.refresh(book2)

        # Register and login
        await client.post(
            "/auth/register",
            json={
                "email": "multiorder@example.com",
                "password": "password123",
                "full_name": "Multi Order User"
            }
        )
        login_response = await client.post(
            "/auth/login",
            json={"email": "multiorder@example.com", "password": "password123"}
        )
        tokens = login_response.json()
        auth_headers = {"Authorization": f"Bearer {tokens['access_token']}"}

        # Add multiple items to cart
        await client.post(
            "/cart/items",
            headers=auth_headers,
            json={"book_id": book1.id, "quantity": 2}
        )
        await client.post(
            "/cart/items",
            headers=auth_headers,
            json={"book_id": book2.id, "quantity": 1}
        )

        # Create order
        order_response = await client.post(
            "/orders",
            headers=auth_headers,
            json={"shipping_address": "456 Another Street, Test City, TC 12345"}
        )
        assert order_response.status_code == 201
        order_data = order_response.json()

        # Verify order has both items
        order_detail_response = await client.get(
            f"/orders/{order_data['id']}",
            headers=auth_headers
        )
        order_detail = order_detail_response.json()
        assert len(order_detail["items"]) == 2

        # Calculate expected total
        expected_total = (10.00 * 2) + (20.00 * 1)
        assert float(order_detail["total_amount"]) == expected_total

    async def test_insufficient_stock_prevents_order(self, client, db_session):
        # Create a book with low stock
        from app.models.book import Book
        from decimal import Decimal

        book = Book(
            title="Low Stock Book",
            author="Low Stock Author",
            description="Low stock book",
            isbn="9999999999999",
            price=Decimal("10.00"),
            stock_quantity=2,
            rating=Decimal("4.0"),
            review_count=1
        )
        db_session.add(book)
        await db_session.commit()
        await db_session.refresh(book)

        # Register and login
        await client.post(
            "/auth/register",
            json={
                "email": "stockorder@example.com",
                "password": "password123",
                "full_name": "Stock Order User"
            }
        )
        login_response = await client.post(
            "/auth/login",
            json={"email": "stockorder@example.com", "password": "password123"}
        )
        tokens = login_response.json()
        auth_headers = {"Authorization": f"Bearer {tokens['access_token']}"}

        # Try to add more than available
        add_response = await client.post(
            "/cart/items",
            headers=auth_headers,
            json={"book_id": book.id, "quantity": 5}
        )
        assert add_response.status_code == 400
