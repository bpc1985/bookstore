import pytest
from httpx import AsyncClient, ASGITransport
from decimal import Decimal

from app.models.user import User, UserRole
from app.models.book import Book
from app.models.category import Category
from app.utils.security import get_password_hash, create_access_token


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
async def sample_user_with_password(db_session):
    from app.schemas.user import UserCreate
    from app.services.auth import AuthService

    service = AuthService(db_session)
    user_data = UserCreate(
        email="router@example.com",
        password="password123",
        full_name="Router Test User"
    )
    user = await service.register(user_data)
    return user


@pytest.fixture
async def auth_headers(client, sample_user_with_password):
    response = await client.post(
        "/auth/login",
        json={"email": sample_user_with_password.email, "password": "password123"}
    )
    tokens = response.json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


@pytest.fixture
async def sample_book_for_router(db_session, sample_category):
    book = Book(
        title="Router Test Book",
        author="Router Test Author",
        description="For testing routers",
        isbn="5555555555555",
        price=Decimal("24.99"),
        stock_quantity=5,
        rating=Decimal("4.0"),
        review_count=2
    )
    book.categories.append(sample_category)
    db_session.add(book)
    await db_session.commit()
    await db_session.refresh(book)
    return book
