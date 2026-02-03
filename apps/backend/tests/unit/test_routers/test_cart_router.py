import pytest
from decimal import Decimal
from app.models.user import UserRole


@pytest.fixture
async def admin_user(db_session):
    from app.schemas.user import UserCreate
    from app.services.auth import AuthService

    service = AuthService(db_session)
    user_data = UserCreate(
        email="admin@test.com",
        password="admin123456",
        full_name="Admin User"
    )
    user = await service.register(user_data)
    user.role = UserRole.ADMIN
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def admin_auth_headers(client, admin_user):
    response = await client.post(
        "/auth/login",
        json={"email": admin_user.email, "password": "admin123456"}
    )
    tokens = response.json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


@pytest.mark.asyncio
class TestCartRouter:
    async def test_get_cart_empty(self, client, auth_headers, sample_user_with_password):
        response = await client.get("/cart", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total_items"] == 0
        assert data["subtotal"] == "0.00"

    async def test_add_item_to_cart(self, client, auth_headers, sample_book_for_router):
        response = await client.post(
            "/cart/items",
            headers=auth_headers,
            json={"book_id": sample_book_for_router.id, "quantity": 2}
        )
        assert response.status_code == 201
        data = response.json()
        assert data["book_id"] == sample_book_for_router.id
        assert data["quantity"] == 2

    async def test_add_item_to_cart_unauthorized(self, client, sample_book_for_router):
        response = await client.post(
            "/cart/items",
            json={"book_id": sample_book_for_router.id, "quantity": 2}
        )
        assert response.status_code == 403

    async def test_add_item_to_cart_invalid_quantity(self, client, auth_headers, sample_book_for_router):
        response = await client.post(
            "/cart/items",
            headers=auth_headers,
            json={"book_id": sample_book_for_router.id, "quantity": 0}
        )
        assert response.status_code == 422

    async def test_get_cart_with_items(self, client, auth_headers, sample_book_for_router):
        await client.post(
            "/cart/items",
            headers=auth_headers,
            json={"book_id": sample_book_for_router.id, "quantity": 3}
        )

        response = await client.get("/cart", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total_items"] == 3
        assert Decimal(data["subtotal"]) > 0

    async def test_update_cart_item(self, client, auth_headers, sample_book_for_router):
        add_response = await client.post(
            "/cart/items",
            headers=auth_headers,
            json={"book_id": sample_book_for_router.id, "quantity": 2}
        )
        item = add_response.json()

        response = await client.put(
            f"/cart/items/{item['id']}",
            headers=auth_headers,
            json={"quantity": 5}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["quantity"] == 5

    async def test_update_cart_item_not_found(self, client, auth_headers):
        response = await client.put(
            "/cart/items/99999",
            headers=auth_headers,
            json={"quantity": 5}
        )
        assert response.status_code == 404

    async def test_remove_cart_item(self, client, auth_headers, sample_book_for_router):
        add_response = await client.post(
            "/cart/items",
            headers=auth_headers,
            json={"book_id": sample_book_for_router.id, "quantity": 2}
        )
        item = add_response.json()

        response = await client.delete(
            f"/cart/items/{item['id']}",
            headers=auth_headers
        )
        assert response.status_code == 204

    async def test_clear_cart(self, client, auth_headers, sample_book_for_router):
        await client.post(
            "/cart/items",
            headers=auth_headers,
            json={"book_id": sample_book_for_router.id, "quantity": 2}
        )

        response = await client.delete("/cart", headers=auth_headers)
        assert response.status_code == 204

        get_response = await client.get("/cart", headers=auth_headers)
        data = get_response.json()
        assert data["total_items"] == 0

    async def test_add_item_insufficient_stock(self, client, auth_headers, sample_book_for_router, db_session):
        sample_book_for_router.stock_quantity = 1
        await db_session.commit()

        response = await client.post(
            "/cart/items",
            headers=auth_headers,
            json={"book_id": sample_book_for_router.id, "quantity": 5}
        )
        assert response.status_code == 400

    async def test_add_item_book_not_found(self, client, auth_headers):
        response = await client.post(
            "/cart/items",
            headers=auth_headers,
            json={"book_id": 99999, "quantity": 1}
        )
        assert response.status_code == 404
