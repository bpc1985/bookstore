import pytest

from app.schemas.user import UserCreate


@pytest.mark.asyncio
class TestAuthRouter:
    async def test_register_success(self, client):
        response = await client.post(
            "/auth/register",
            json={
                "email": "newuser@test.com",
                "password": "password123",
                "full_name": "New User"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "newuser@test.com"
        assert data["full_name"] == "New User"
        assert data["role"] == "user"
        assert "id" in data
        assert "hashed_password" not in data

    async def test_register_duplicate_email(self, client, sample_user_with_password):
        response = await client.post(
            "/auth/register",
            json={
                "email": sample_user_with_password.email,
                "password": "password123",
                "full_name": "Duplicate User"
            }
        )
        assert response.status_code == 409
        data = response.json()
        assert "already registered" in data["detail"].lower()

    async def test_register_invalid_email_format(self, client):
        response = await client.post(
            "/auth/register",
            json={
                "email": "invalid-email",
                "password": "password123",
                "full_name": "Test User"
            }
        )
        assert response.status_code == 422

    async def test_register_weak_password(self, client):
        response = await client.post(
            "/auth/register",
            json={
                "email": "test@example.com",
                "password": "123",
                "full_name": "Test User"
            }
        )
        assert response.status_code == 422

    async def test_login_success(self, client, sample_user_with_password):
        response = await client.post(
            "/auth/login",
            json={
                "email": sample_user_with_password.email,
                "password": "password123"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    async def test_login_invalid_email(self, client):
        response = await client.post(
            "/auth/login",
            json={
                "email": "nonexistent@test.com",
                "password": "password123"
            }
        )
        assert response.status_code == 401
        data = response.json()
        assert "Invalid email or password" in data["detail"]

    async def test_login_invalid_password(self, client, sample_user_with_password):
        response = await client.post(
            "/auth/login",
            json={
                "email": sample_user_with_password.email,
                "password": "wrongpassword"
            }
        )
        assert response.status_code == 401
        data = response.json()
        assert "Invalid email or password" in data["detail"]

    async def test_refresh_token_success(self, client, sample_user_with_password):
        login_response = await client.post(
            "/auth/login",
            json={
                "email": sample_user_with_password.email,
                "password": "password123"
            }
        )
        tokens = login_response.json()

        refresh_response = await client.post(
            "/auth/refresh",
            json={"refresh_token": tokens["refresh_token"]}
        )
        assert refresh_response.status_code == 200
        data = refresh_response.json()
        assert "access_token" in data
        assert "refresh_token" in data

    async def test_refresh_token_invalid(self, client):
        response = await client.post(
            "/auth/refresh",
            json={"refresh_token": "invalid.token.here"}
        )
        assert response.status_code == 401

    async def test_logout_success(self, client, sample_user_with_password):
        login_response = await client.post(
            "/auth/login",
            json={
                "email": sample_user_with_password.email,
                "password": "password123"
            }
        )
        tokens = login_response.json()

        logout_response = await client.post(
            "/auth/logout",
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
            json={"refresh_token": tokens["refresh_token"]}
        )
        assert logout_response.status_code == 204

    async def test_logout_invalid_token(self, client):
        # HTTPBearer accepts the header format validation succeeds at header level
        # Token validation happens later but logout succeeds even for invalid tokens
        response = await client.post(
            "/auth/logout",
            headers={"Authorization": "Bearer invalid.token"}
        )
        assert response.status_code == 204

    async def test_logout_without_auth(self, client):
        response = await client.post("/auth/logout")
        assert response.status_code == 403

    async def test_refresh_after_logout(self, client, sample_user_with_password):
        login_response = await client.post(
            "/auth/login",
            json={
                "email": sample_user_with_password.email,
                "password": "password123"
            }
        )
        tokens = login_response.json()

        await client.post(
            "/auth/logout",
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
            json={"refresh_token": tokens["refresh_token"]}
        )

        refresh_response = await client.post(
            "/auth/refresh",
            json={"refresh_token": tokens["refresh_token"]}
        )
        assert refresh_response.status_code == 401

    async def test_register_missing_fields(self, client):
        response = await client.post(
            "/auth/register",
            json={
                "email": "test@example.com",
                "password": "password123"
            }
        )
        assert response.status_code == 422
        data = response.json()
        assert "full_name" in str(data)

    async def test_google_auth_not_configured(self, client, monkeypatch):
        def mock_not_configured():
            return False
        
        monkeypatch.setattr(
            "app.services.oauth.OAuthService.is_oauth_configured",
            lambda self: False
        )
        
        response = await client.get("/auth/google")
        assert response.status_code == 503
        data = response.json()
        assert "not configured" in data["detail"].lower()
        response = await client.get("/auth/google")
        assert response.status_code == 503
        data = response.json()
        assert "not configured" in data["detail"].lower()

    async def test_oauth_only_user_cannot_login_with_password(self, client, db_session):
        from app.models.user import User
        
        # Create OAuth-only user
        user = User(
            email="oauthuser@test.com",
            full_name="OAuth User",
            hashed_password=None,
            google_id="google_123",
            role="user"
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        
        # Try to login with password
        response = await client.post(
            "/auth/login",
            json={
                "email": "oauthuser@test.com",
                "password": "password123"
            }
        )
        assert response.status_code == 401
        data = response.json()
        assert "OAuth authentication only" in data["detail"]
