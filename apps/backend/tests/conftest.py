import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from decimal import Decimal
from datetime import datetime

from app.database import Base
from app.models.user import User, UserRole, TokenBlacklist
from app.models.book import Book
from app.models.cart import CartItem
from app.models.category import Category
from app.repositories.user import UserRepository
from app.repositories.book import BookRepository
from app.repositories.cart import CartRepository


@pytest.fixture(scope="function")
async def db_engine():
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        future=True
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.fixture(scope="function")
async def db_session(db_engine):
    async_session = async_sessionmaker(
        db_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False
    )
    async with async_session() as session:
        yield session


@pytest.fixture
def user_repository(db_session):
    return UserRepository(db_session)


@pytest.fixture
def book_repository(db_session):
    return BookRepository(db_session)


@pytest.fixture
def cart_repository(db_session):
    return CartRepository(db_session)


@pytest.fixture
async def sample_user(db_session):
    from app.utils.security import get_password_hash
    user = User(
        email="test@example.com",
        hashed_password=get_password_hash("password123"),
        full_name="Test User",
        role=UserRole.USER,
        is_active=True
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def sample_category(db_session):
    category = Category(name="Fiction", description="Fiction books")
    db_session.add(category)
    await db_session.commit()
    await db_session.refresh(category)
    return category


@pytest.fixture
async def sample_book(db_session, sample_category):
    book = Book(
        title="Test Book",
        author="Test Author",
        description="Test description",
        isbn="1234567890123",
        price=Decimal("19.99"),
        stock_quantity=10,
        cover_image=None,
        rating=Decimal("4.5"),
        review_count=5,
        is_deleted=False
    )
    book.categories.append(sample_category)
    db_session.add(book)
    await db_session.commit()
    await db_session.refresh(book)
    return book


@pytest.fixture
async def sample_cart_item(db_session, sample_user, sample_book):
    cart_item = CartItem(
        user_id=sample_user.id,
        book_id=sample_book.id,
        quantity=2
    )
    db_session.add(cart_item)
    await db_session.commit()
    await db_session.refresh(cart_item)
    return cart_item
