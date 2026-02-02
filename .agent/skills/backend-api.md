---
trigger: backend_api
description: Design and implement FastAPI backend endpoints following the layered architecture pattern with async SQLAlchemy
---

# Bookstore Backend API Skill

## Technology Stack
- **Framework**: FastAPI
- **ORM**: SQLAlchemy (async)
- **Validation**: Pydantic v2
- **Database**: SQLite (development), PostgreSQL (production)
- **Migrations**: Alembic
- **Auth**: JWT (access token: 15 min, refresh token: 7 days)

## Architecture Pattern

Follow the layered architecture: **Router → Service → Repository → Model**

```
apps/backend/app/
├── routers/         # HTTP layer - validate input, call services, return responses
├── services/        # Business logic - orchestrate operations, enforce rules
├── repositories/    # Data access - SQLAlchemy async queries
├── models/          # ORM definitions - SQLAlchemy models
├── schemas/         # Pydantic models - request/response validation
├── dependencies.py  # Dependency injection (DB session, auth)
├── exceptions.py    # Custom exceptions
└── main.py          # Application entry point
```

## Creating a New Endpoint

### Step 1: Define Pydantic Schemas (`schemas/`)

```python
# apps/backend/app/schemas/book.py
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional

class BookCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    author: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    price: float = Field(..., gt=0)
    stock: int = Field(..., ge=0)
    category_id: Optional[int] = None
    cover_image: Optional[str] = None

class BookUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    author: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    stock: Optional[int] = Field(None, ge=0)
    category_id: Optional[int] = None
    cover_image: Optional[str] = None

class BookResponse(BaseModel):
    id: int
    title: str
    author: str
    description: Optional[str]
    price: float
    stock: int
    category_id: Optional[int]
    cover_image: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class BookListResponse(BaseModel):
    books: list[BookResponse]
    total: int
    page: int
    size: int
```

**Naming convention**: `{Resource}Create`, `{Resource}Update`, `{Resource}Response`

### Step 2: Create Model (`models/`)

```python
# apps/backend/app/models/book.py
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    author = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    stock = Column(Integer, nullable=False, default=0)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    cover_image = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    category = relationship("Category", back_populates="books")
    reviews = relationship("Review", back_populates="book", cascade="all, delete-orphan")
    cart_items = relationship("CartItem", back_populates="book")
```

### Step 3: Create Repository (`repositories/`)

```python
# apps/backend/app/repositories/book.py
from typing import Optional, List
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.base import BaseRepository
from app.models.book import Book

class BookRepository(BaseRepository[Book]):
    def __init__(self, session: AsyncSession):
        super().__init__(Book, session)

    async def find_by_title(self, title: str) -> Optional[Book]:
        result = await self.session.execute(
            select(Book).where(Book.title == title)
        )
        return result.scalar_one_or_none()

    async def search_books(
        self,
        query: str,
        category_id: Optional[int] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        limit: int = 50
    ) -> List[Book]:
        stmt = select(Book)

        # Build filters
        filters = []
        if query:
            filters.append(
                or_(
                    Book.title.ilike(f"%{query}%"),
                    Book.author.ilike(f"%{query}%")
                )
            )
        if category_id:
            filters.append(Book.category_id == category_id)
        if min_price is not None:
            filters.append(Book.price >= min_price)
        if max_price is not None:
            filters.append(Book.price <= max_price)

        if filters:
            stmt = stmt.where(and_(*filters))

        stmt = stmt.limit(limit)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_in_stock(self, book_ids: List[int]) -> List[Book]:
        result = await self.session.execute(
            select(Book)
            .where(Book.id.in_(book_ids))
            .where(Book.stock > 0)
        )
        return result.scalars().all()
```

### Step 4: Create Service (`services/`)

```python
# apps/backend/app/services/book.py
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.book import BookRepository
from app.models.book import Book
from app.schemas.book import BookCreate, BookUpdate
from app.exceptions import NotFoundException, ConflictException, BadRequestException

class BookService:
    def __init__(self, session: AsyncSession):
        self.repository = BookRepository(session)

    async def create(self, data: BookCreate) -> Book:
        existing = await self.repository.find_by_title(data.title)
        if existing:
            raise ConflictException("Book with this title already exists")

        book_dict = data.model_dump()
        book = await self.repository.create(book_dict)
        await self.session.refresh(book)
        return book

    async def get_by_id(self, book_id: int) -> Book:
        book = await self.repository.get(book_id)
        if not book:
            raise NotFoundException(f"Book {book_id} not found")
        return book

    async def update(self, book_id: int, data: BookUpdate) -> Book:
        book = await self.get_by_id(book_id)

        update_data = data.model_dump(exclude_unset=True)
        if not update_data:
            raise BadRequestException("No data provided for update")

        # Check for duplicate title if updating title
        if 'title' in update_data and update_data['title'] != book.title:
            existing = await self.repository.find_by_title(update_data['title'])
            if existing:
                raise ConflictException("Book with this title already exists")

        for field, value in update_data.items():
            setattr(book, field, value)

        await self.session.commit()
        await self.session.refresh(book)
        return book

    async def delete(self, book_id: int) -> None:
        book = await self.get_by_id(book_id)
        await self.repository.delete(book_id)

    async def search(self, **filters) -> List[Book]:
        return await self.repository.search_books(**filters)

    async def update_stock(self, book_id: int, quantity: int) -> Book:
        book = await self.get_by_id(book_id)
        new_stock = book.stock - quantity
        if new_stock < 0:
            raise BadRequestException(f"Insufficient stock. Available: {book.stock}")
        book.stock = new_stock
        await self.session.commit()
        await self.session.refresh(book)
        return book
```

### Step 5: Create Router (`routers/`)

```python
# apps/backend/app/routers/book.py
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies import get_db, get_current_user, get_admin_user
from app.services.book import BookService
from app.schemas.book import BookCreate, BookUpdate, BookResponse
from app.models.user import User

router = APIRouter(prefix="/books", tags=["books"])

@router.post("/", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
async def create_book(
    data: BookCreate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    service = BookService(session)
    return await service.create(data)

@router.get("/", response_model=list[BookResponse])
async def list_books(
    search: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    limit: int = Query(50, ge=1, le=100),
    session: AsyncSession = Depends(get_db),
):
    service = BookService(session)
    books = await service.search(
        query=search,
        category_id=category_id,
        min_price=min_price,
        max_price=max_price,
        limit=limit
    )
    return books

@router.get("/{book_id}", response_model=BookResponse)
async def get_book(
    book_id: int,
    session: AsyncSession = Depends(get_db),
):
    service = BookService(session)
    return await service.get_by_id(book_id)

@router.put("/{book_id}", response_model=BookResponse)
async def update_book(
    book_id: int,
    data: BookUpdate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    service = BookService(session)
    return await service.update(book_id, data)

@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_book(
    book_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    service = BookService(session)
    await service.delete(book_id)
```

### Step 6: Register Router (`main.py`)

```python
# apps/backend/app/main.py
from fastapi import FastAPI
from app.routers import book, auth, cart, order

app = FastAPI(title="Bookstore API")

app.include_router(book.router)
app.include_router(auth.router)
app.include_router(cart.router)
app.include_router(order.router)
```

## Authentication Dependencies

```python
# apps/backend/app/dependencies.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.auth import AuthService
from app.models.user import User

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: AsyncSession = Depends(get_db),
) -> User:
    token = credentials.credentials
    auth_service = AuthService(session)
    user = await auth_service.get_current_user(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )
    return current_user

async def get_admin_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user
```

## Error Handling

```python
# apps/backend/app/exceptions.py
from fastapi import HTTPException, status

class AppException(HTTPException):
    def __init__(self, status_code: int, detail: str):
        super().__init__(status_code=status_code, detail=detail)

class NotFoundException(AppException):
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)

class ConflictException(AppException):
    def __init__(self, detail: str = "Resource already exists"):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail)

class BadRequestException(AppException):
    def __init__(self, detail: str = "Bad request"):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)

class UnauthorizedException(AppException):
    def __init__(self, detail: str = "Unauthorized"):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)

class ForbiddenException(AppException):
    def __init__(self, detail: str = "Forbidden"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)
```

## Database Operations

### Base Repository

```python
# apps/backend/app/repositories/base.py
from typing import TypeVar, Generic, Optional, List, Type
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

ModelType = TypeVar("ModelType")

class BaseRepository(Generic[ModelType]):
    def __init__(self, model: Type[ModelType], session: AsyncSession):
        self.model = model
        self.session = session

    async def get(self, id: int) -> Optional[ModelType]:
        result = await self.session.execute(select(self.model).where(self.model.id == id))
        return result.scalar_one_or_none()

    async def get_all(self, limit: int = 100) -> List[ModelType]:
        result = await self.session.execute(select(self.model).limit(limit))
        return result.scalars().all()

    async def create(self, data: dict) -> ModelType:
        obj = self.model(**data)
        self.session.add(obj)
        await self.session.commit()
        await self.session.refresh(obj)
        return obj

    async def update(self, id: int, data: dict) -> Optional[ModelType]:
        obj = await self.get(id)
        if obj:
            for key, value in data.items():
                setattr(obj, key, value)
            await self.session.commit()
            await self.session.refresh(obj)
        return obj

    async def delete(self, id: int) -> bool:
        obj = await self.get(id)
        if obj:
            await self.session.delete(obj)
            await self.session.commit()
            return True
        return False
```

### Async Query Patterns

```python
# Correct async patterns
result = await session.execute(select(Book).where(Book.id == book_id))
book = result.scalar_one_or_none()

# Get multiple
result = await session.execute(select(Book).where(Book.stock > 0))
books = result.scalars().all()

# With joins
result = await session.execute(
    select(Book)
    .join(Category)
    .where(Category.name == "Fiction")
)
books = result.scalars().all()

# Pagination
offset = (page - 1) * size
result = await session.execute(
    select(Book)
    .order_by(Book.created_at.desc())
    .offset(offset)
    .limit(size)
)
books = result.scalars().all()
```

## Migration Workflow

```bash
# Create migration
cd apps/backend
alembic revision --autogenerate -m "Add book table"

# Apply migration
alembic upgrade head

# Downgrade migration
alembic downgrade -1

# Check current version
alembic current

# View migration history
alembic history
```

## Endpoint Checklist

Before completing a new endpoint:

- [ ] Pydantic schemas defined with proper validation
- [ ] Repository extends `BaseRepository` or implements custom queries
- [ ] Service handles business logic and raises appropriate exceptions
- [ ] Router uses correct HTTP methods and status codes
- [ ] Auth dependency applied if endpoint requires authentication
- [ ] Admin dependency applied for admin-only endpoints
- [ ] Router registered in `main.py`
- [ ] All database operations are async
- [ ] Response models use `from_attributes=True`
- [ ] Query parameters validated with Pydantic
- [ ] Pagination implemented for list endpoints
- [ ] Error handling with appropriate status codes
