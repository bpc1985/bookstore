import pytest


@pytest.mark.asyncio
class TestAuthFlow:
    async def test_complete_authentication_flow(self, client, sample_book):
        # Step 1: Register new user
        register_response = await client.post(
            "/auth/register",
            json={
                "email": "integration@example.com",
                "password": "password123",
                "full_name": "Integration Test User"
            }
        )
        assert register_response.status_code == 201
        user_data = register_response.json()
        assert user_data["email"] == "integration@example.com"

        # Step 2: Login
        login_response = await client.post(
            "/auth/login",
            json={"email": "integration@example.com", "password": "password123"}
        )
        assert login_response.status_code == 200
        tokens = login_response.json()
        assert "access_token" in tokens
        assert "refresh_token" in tokens

        access_token = tokens["access_token"]
        refresh_token = tokens["refresh_token"]
        auth_headers = {"Authorization": f"Bearer {access_token}"}

        # Step 3: Access protected endpoint
        cart_response = await client.get("/cart", headers=auth_headers)
        assert cart_response.status_code == 200
        cart_data = cart_response.json()
        assert cart_data["total_items"] == 0

        # Step 4: Add item to cart
        add_response = await client.post(
            "/cart/items",
            headers=auth_headers,
            json={"book_id": sample_book.id, "quantity": 2}
        )
        assert add_response.status_code == 201

        # Step 5: Verify cart has items
        cart_response = await client.get("/cart", headers=auth_headers)
        assert cart_response.status_code == 200
        cart_data = cart_response.json()
        assert cart_data["total_items"] == 2
        assert float(cart_data["subtotal"]) > 0

        # Step 6: Refresh token
        refresh_response = await client.post(
            "/auth/refresh",
            json={"refresh_token": refresh_token}
        )
        assert refresh_response.status_code == 200
        new_tokens = refresh_response.json()
        assert "access_token" in new_tokens

        new_auth_headers = {"Authorization": f"Bearer {new_tokens['access_token']}"}

        # Step 7: Access protected endpoint with new token
        cart_response = await client.get("/cart", headers=new_auth_headers)
        assert cart_response.status_code == 200
        cart_data = cart_response.json()
        assert cart_data["total_items"] == 2

    async def test_login_after_registration(self, client):
        # Register
        await client.post(
            "/auth/register",
            json={
                "email": "loginflow@example.com",
                "password": "password123",
                "full_name": "Login Flow User"
            }
        )

        # Login immediately after
        login_response = await client.post(
            "/auth/login",
            json={"email": "loginflow@example.com", "password": "password123"}
        )
        assert login_response.status_code == 200
        tokens = login_response.json()
        assert "access_token" in tokens

    async def test_logout_prevents_token_refresh(self, client):
        # Register and login
        await client.post(
            "/auth/register",
            json={
                "email": "logoutflow@example.com",
                "password": "password123",
                "full_name": "Logout Flow User"
            }
        )

        login_response = await client.post(
            "/auth/login",
            json={"email": "logoutflow@example.com", "password": "password123"}
        )
        tokens = login_response.json()

        # Logout
        auth_headers = {"Authorization": f"Bearer {tokens['access_token']}"}
        await client.post(
            "/auth/logout",
            headers=auth_headers,
            json={"refresh_token": tokens["refresh_token"]}
        )

        # Try to refresh - should fail
        refresh_response = await client.post(
            "/auth/refresh",
            json={"refresh_token": tokens["refresh_token"]}
        )
        assert refresh_response.status_code == 401
