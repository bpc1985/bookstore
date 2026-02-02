---
trigger: testing
description: Write tests for frontend and backend components, API endpoints, and database operations
---

# Testing Skill

## Technology Stack

### Frontend Testing
- **Framework**: Jest + React Testing Library
- **E2E Testing**: Playwright
- **Test Runner**: Vitest (if configured)

### Backend Testing
- **Framework**: pytest + pytest-asyncio
- **HTTP Testing**: httpx (async client)
- **Database Testing**: pytest fixtures with test database

## Frontend Testing

### 1. Component Testing Setup

```typescript
// apps/frontend/src/components/__tests__/BookCard.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BookCard } from '../BookCard';
import { Book } from '@bookstore/types';

const mockBook: Book = {
  id: 1,
  title: 'Test Book',
  author: 'Test Author',
  description: 'Test description',
  price: 29.99,
  stock: 10,
  cover_image: '/test-cover.jpg',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('BookCard', () => {
  it('renders book information correctly', () => {
    render(<BookCard book={mockBook} />);

    expect(screen.getByText('Test Book')).toBeInTheDocument();
    expect(screen.getByText('Test Author')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();
  });

  it('links to book detail page', () => {
    render(<BookCard book={mockBook} />);

    const link = screen.getByRole('link', { name: /test book/i });
    expect(link).toHaveAttribute('href', '/books/1');
  });

  it('calls onAddToCart when add button is clicked', async () => {
    const onAddToCart = jest.fn();
    render(<BookCard book={mockBook} onAddToCart={onAddToCart} />);

    const addButton = screen.getByRole('button', { name: /add to cart/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(onAddToCart).toHaveBeenCalledWith(1);
    });
  });
});
```

### 2. Testing Server Components

```typescript
// apps/frontend/src/app/books/__tests__/page.test.tsx
import { render, screen } from '@testing-library/react';
import BooksPage from '../page';

// Mock the API client
jest.mock('@/lib/api', () => ({
  api: {
    getBooks: jest.fn(),
  },
}));

describe('BooksPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders book list', async () => {
    const mockBooks: Book[] = [
      { id: 1, title: 'Book 1', author: 'Author 1', price: 10, stock: 5 },
      { id: 2, title: 'Book 2', author: 'Author 2', price: 20, stock: 3 },
    ];

    (api.getBooks as jest.Mock).mockResolvedValue(mockBooks);

    const { container } = await render(await BooksPage());

    expect(screen.getByText('Book 1')).toBeInTheDocument();
    expect(screen.getByText('Book 2')).toBeInTheDocument();
  });

  it('shows loading state while fetching', async () => {
    (api.getBooks as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(await BooksPage());

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
```

### 3. Testing Hooks (Zustand)

```typescript
// apps/frontend/src/stores/__tests__/auth.test.ts
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuthStore } from '../auth';

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('initial state is empty', () => {
    const { result } = renderHook(() => useAuthStore());

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('sets user correctly', () => {
    const { result } = renderHook(() => useAuthStore());
    const mockUser = { id: 1, email: 'test@example.com' };

    act(() => {
      result.current.setUser(mockUser);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('clears auth state', () => {
    const { result } = renderHook(() => useAuthStore());
    const mockUser = { id: 1, email: 'test@example.com' };

    act(() => {
      result.current.setUser(mockUser);
      result.current.clearAuth();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
```

### 4. Testing Forms

```typescript
// apps/frontend/src/components/__tests__/BookForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookForm } from '../BookForm';

describe('BookForm', () => {
  it('validates required fields', async () => {
    render(<BookForm />);

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      expect(screen.getByText(/author is required/i)).toBeInTheDocument();
    });
  });

  it('submits valid form data', async () => {
    const onSubmit = jest.fn();
    render(<BookForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/title/i), 'Test Book');
    await userEvent.type(screen.getByLabelText(/author/i), 'Test Author');
    await userEvent.type(screen.getByLabelText(/price/i), '29.99');

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        title: 'Test Book',
        author: 'Test Author',
        price: 29.99,
        stock: 0,
      });
    });
  });
});
```

### 5. E2E Testing with Playwright

```typescript
// apps/frontend/e2e/book-shopping.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Book Shopping Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('user can browse books', async ({ page }) => {
    await page.click('text=Books');

    await expect(page).toHaveURL(/.*\/books/);
    await expect(page.locator('.book-card')).toHaveCount(8);
  });

  test('user can add book to cart', async ({ page }) => {
    await page.goto('/books/1');

    await page.click('button:has-text("Add to Cart")');
    await expect(page.locator('text=Added to cart')).toBeVisible();
  });

  test('user can complete checkout', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'user@bookstore.com');
    await page.fill('input[name="password"]', 'user123456');
    await page.click('button[type="submit"]');

    // Add to cart
    await page.goto('/books/1');
    await page.click('button:has-text("Add to Cart")');

    // Go to cart
    await page.click('text=Cart');

    // Checkout
    await page.click('button:has-text("Checkout")');
    await page.fill('input[name="address"]', '123 Test Street');
    await page.click('button:has-text("Place Order")');

    await expect(page.locator('text=Order placed successfully')).toBeVisible();
  });
});
```

## Backend Testing

### 1. Test Setup and Fixtures

```python
# apps/backend/tests/conftest.py
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.main import app
from app.database import get_db, Base

# Test database URL
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test_bookstore.db"

# Create test engine
test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

@pytest.fixture(scope="function")
async def db_session():
    # Create tables
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Create session
    async with TestSessionLocal() as session:
        yield session

    # Clean up
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture
async def client(db_session: AsyncSession):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()

@pytest.fixture
async def test_user(db_session: AsyncSession):
    from app.models.user import User
    from app.auth import get_password_hash

    user = User(
        email="test@example.com",
        username="testuser",
        hashed_password=get_password_hash("testpass"),
        is_active=True,
        is_admin=False
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user

@pytest.fixture
async def auth_headers(client: AsyncClient, test_user: User):
    # Get access token
    response = await client.post(
        "/auth/login",
        json={"email": "test@example.com", "password": "testpass"}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
```

### 2. API Endpoint Testing

```python
# apps/backend/tests/test_books.py
import pytest
from httpx import AsyncResponse

@pytest.mark.asyncio
async def test_create_book(client: AsyncClient, auth_headers: dict, test_category):
    book_data = {
        "title": "Test Book",
        "author": "Test Author",
        "description": "Test description",
        "price": 29.99,
        "stock": 10,
        "category_id": test_category.id
    }

    response: AsyncResponse = await client.post(
        "/books/",
        json=book_data,
        headers=auth_headers
    )

    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Book"
    assert data["author"] == "Test Author"
    assert data["price"] == 29.99
    assert "id" in data

@pytest.mark.asyncio
async def test_get_books(client: AsyncClient):
    response = await client.get("/books/")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

@pytest.mark.asyncio
async def test_get_book_by_id(client: AsyncClient, db_session, test_book):
    response = await client.get(f"/books/{test_book.id}")

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_book.id
    assert data["title"] == test_book.title

@pytest.mark.asyncio
async def test_get_book_not_found(client: AsyncClient):
    response = await client.get("/books/99999")

    assert response.status_code == 404

@pytest.mark.asyncio
async def test_update_book(client: AsyncClient, auth_headers: dict, test_book):
    update_data = {
        "price": 19.99,
        "stock": 5
    }

    response = await client.put(
        f"/books/{test_book.id}",
        json=update_data,
        headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()
    assert data["price"] == 19.99
    assert data["stock"] == 5

@pytest.mark.asyncio
async def test_delete_book(client: AsyncClient, auth_headers: dict, test_book):
    response = await client.delete(
        f"/books/{test_book.id}",
        headers=auth_headers
    )

    assert response.status_code == 204

    # Verify deletion
    response = await client.get(f"/books/{test_book.id}")
    assert response.status_code == 404
```

### 3. Service Layer Testing

```python
# apps/backend/tests/test_book_service.py
import pytest
from app.services.book import BookService
from app.schemas.book import BookCreate, BookUpdate
from app.exceptions import NotFoundException, ConflictException

@pytest.mark.asyncio
async def test_create_book_service(db_session: AsyncSession, test_category):
    service = BookService(db_session)

    book_data = BookCreate(
        title="Test Book",
        author="Test Author",
        price=29.99,
        stock=10,
        category_id=test_category.id
    )

    book = await service.create(book_data)

    assert book.title == "Test Book"
    assert book.author == "Test Author"
    assert book.price == 29.99

@pytest.mark.asyncio
async def test_create_duplicate_book(db_session: AsyncSession, test_book):
    service = BookService(db_session)

    book_data = BookCreate(
        title=test_book.title,
        author="Different Author",
        price=19.99,
        stock=5
    )

    with pytest.raises(ConflictException) as exc_info:
        await service.create(book_data)

    assert "already exists" in str(exc_info.value)

@pytest.mark.asyncio
async def test_get_book_by_id(db_session: AsyncSession, test_book):
    service = BookService(db_session)

    book = await service.get_by_id(test_book.id)

    assert book.id == test_book.id
    assert book.title == test_book.title

@pytest.mark.asyncio
async def test_get_book_not_found(db_session: AsyncSession):
    service = BookService(db_session)

    with pytest.raises(NotFoundException) as exc_info:
        await service.get_by_id(99999)

    assert "not found" in str(exc_info.value)

@pytest.mark.asyncio
async def test_update_book(db_session: AsyncSession, test_book):
    service = BookService(db_session)

    update_data = BookUpdate(price=19.99, stock=5)
    book = await service.update(test_book.id, update_data)

    assert book.price == 19.99
    assert book.stock == 5

@pytest.mark.asyncio
async def test_delete_book(db_session: AsyncSession, test_book):
    service = BookService(db_session)

    await service.delete(test_book.id)

    with pytest.raises(NotFoundException):
        await service.get_by_id(test_book.id)
```

### 4. Repository Layer Testing

```python
# apps/backend/tests/test_book_repository.py
import pytest
from app.repositories.book import BookRepository

@pytest.mark.asyncio
async def test_find_by_title(db_session: AsyncSession, test_book):
    repo = BookRepository(db_session)

    book = await repo.find_by_title(test_book.title)

    assert book is not None
    assert book.id == test_book.id

@pytest.mark.asyncio
async def test_search_books(db_session: AsyncSession, test_book, test_category):
    repo = BookRepository(db_session)

    books = await repo.search_books(
        query=test_book.title,
        category_id=test_category.id
    )

    assert len(books) > 0
    assert test_book in books

@pytest.mark.asyncio
async def test_get_in_stock(db_session: AsyncSession, test_book):
    repo = BookRepository(db_session)

    books = await repo.get_in_stock([test_book.id])

    assert test_book in books

    # Update stock to 0
    test_book.stock = 0
    await db_session.commit()

    books = await repo.get_in_stock([test_book.id])
    assert test_book not in books
```

### 5. Authentication Testing

```python
# apps/backend/tests/test_auth.py
import pytest
from app.exceptions import UnauthorizedException

@pytest.mark.asyncio
async def test_register(client: AsyncClient):
    user_data = {
        "email": "newuser@example.com",
        "password": "password123",
        "username": "newuser"
    }

    response = await client.post("/auth/register", json=user_data)

    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert "id" in data

@pytest.mark.asyncio
async def test_login(client: AsyncClient, test_user):
    login_data = {
        "email": "test@example.com",
        "password": "testpass"
    }

    response = await client.post("/auth/login", json=login_data)

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data

@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient, test_user):
    login_data = {
        "email": "test@example.com",
        "password": "wrongpassword"
    }

    response = await client.post("/auth/login", json=login_data)

    assert response.status_code == 401

@pytest.mark.asyncio
async def test_protected_endpoint_without_token(client: AsyncClient):
    response = await client.get("/orders/")

    assert response.status_code == 401

@pytest.mark.asyncio
async def test_protected_endpoint_with_token(client: AsyncClient, auth_headers: dict):
    response = await client.get("/orders/", headers=auth_headers)

    assert response.status_code == 200
```

### 6. Database Integration Testing

```python
# apps/backend/tests/test_database.py
import pytest
from sqlalchemy import select

@pytest.mark.asyncio
async def test_create_book_in_db(db_session: AsyncSession):
    from app.models.book import Book

    book = Book(
        title="DB Test Book",
        author="DB Test Author",
        price=19.99,
        stock=5
    )

    db_session.add(book)
    await db_session.commit()
    await db_session.refresh(book)

    assert book.id is not None
    assert book.title == "DB Test Book"

    # Verify it was actually saved
    result = await db_session.execute(
        select(Book).where(Book.id == book.id)
    )
    saved_book = result.scalar_one()

    assert saved_book.title == "DB Test Book"

@pytest.mark.asyncio
async def test_relationships(db_session: AsyncSession, test_category, test_book):
    await db_session.refresh(test_book)

    assert test_book.category is not None
    assert test_book.category.id == test_category.id
    assert test_book.category.name == test_category.name
```

## Test Commands

### Frontend Tests

```bash
# Run all tests
pnpm frontend:test

# Run in watch mode
pnpm frontend:test --watch

# Run with coverage
pnpm frontend:test --coverage

# Run specific test file
pnpm frontend:test BookCard.test.tsx

# Run E2E tests
pnpm playwright test

# Run E2E tests in headed mode
pnpm playwright test --headed
```

### Backend Tests

```bash
# Run all tests
cd apps/backend
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_books.py

# Run specific test
pytest tests/test_books.py::test_create_book

# Run with verbose output
pytest -v

# Run with async support
pytest -xvs
```

## Testing Best Practices

### Frontend

1. **Test user behavior, not implementation details**
   - Test what the user sees and does
   - Don't test internal state or component structure

2. **Use descriptive test names**
   - ✅ Good: "user can add book to cart"
   - ❌ Bad: "test1"

3. **Keep tests isolated**
   - Each test should be independent
   - Clean up after each test

4. **Mock external dependencies**
   - Mock API calls
   - Mock third-party libraries

### Backend

1. **Test at multiple layers**
   - Repository: Data access
   - Service: Business logic
   - Router: HTTP endpoints

2. **Use test database**
   - Never use production database
   - Clean up after each test

3. **Test edge cases**
   - Empty results
   - Invalid input
   - Permission errors

4. **Test authentication/authorization**
   - Verify protected endpoints require auth
   - Verify admin-only endpoints require admin role

## Test Coverage Goals

- **Frontend**: > 80% code coverage
- **Backend**: > 90% code coverage
- **Critical paths**: 100% coverage (auth, payment, orders)
