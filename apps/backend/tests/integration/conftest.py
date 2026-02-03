import pytest
from httpx import AsyncClient, ASGITransport
from decimal import Decimal


@pytest.fixture
async def client(db_session):
    from app.main import app
    from app.database import get_db

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
async def sample_user_with_password(client):
    response = await client.post(
        "/auth/register",
        json={
            "email": "integration@example.com",
            "password": "password123",
            "full_name": "Integration Test User"
        }
    )
    return response.json()
