---
trigger: database_migrations
description: Design database models, create migrations, and manage database operations with SQLAlchemy
---

# Database & Migrations Skill

## Technology Stack
- **ORM**: SQLAlchemy 2.0 (async)
- **Database**: SQLite (development), PostgreSQL (production)
- **Migrations**: Alembic
- **Connection Pooling**: asyncpg (PostgreSQL)

## Database Configuration

### Connection Setup

```python
# apps/backend/app/database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base

DATABASE_URL = "sqlite+aiosqlite:///./bookstore.db"

engine = create_async_engine(
    DATABASE_URL,
    echo=False,  # Set to True for SQL query logging
    future=True,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()

# Dependency for FastAPI
async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
```

## Model Design Patterns

### 1. Base Model with Common Fields

```python
# apps/backend/app/models/base.py
from datetime import datetime
from sqlalchemy import Column, Integer, DateTime
from sqlalchemy.orm import declared_attr
from sqlalchemy.sql import func

class BaseModel:
    @declared_attr
    def __tablename__(cls) -> str:
        return cls.__name__.lower() + 's'

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
```

### 2. Book Model

```python
# apps/backend/app/models/book.py
from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import BaseModel

class Book(Base, BaseModel):
    __tablename__ = "books"

    title = Column(String(255), nullable=False, index=True)
    author = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    stock = Column(Integer, nullable=False, default=0, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    cover_image = Column(String(500), nullable=True)

    # Relationships
    category = relationship("Category", back_populates="books", lazy="selectin")
    reviews = relationship("Review", back_populates="book", cascade="all, delete-orphan", lazy="selectin")
    cart_items = relationship("CartItem", back_populates="book", lazy="selectin")
    order_items = relationship("OrderItem", back_populates="book", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Book(id={self.id}, title='{self.title}')>"
```

### 3. Category Model

```python
# apps/backend/app/models/category.py
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import BaseModel

class Category(Base, BaseModel):
    __tablename__ = "categories"

    name = Column(String(255), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)

    # Relationships
    books = relationship("Book", back_populates="category", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Category(id={self.id}, name='{self.name}')>"
```

### 4. User Model

```python
# apps/backend/app/models/user.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from enum import Enum as PyEnum
from app.database import Base
from app.models.base import BaseModel

class UserRole(PyEnum):
    USER = "user"
    ADMIN = "admin"

class User(Base, BaseModel):
    __tablename__ = "users"

    email = Column(String(255), nullable=False, unique=True, index=True)
    username = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.USER, nullable=False)

    # Relationships
    cart = relationship("Cart", back_populates="user", uselist=False, lazy="selectin")
    orders = relationship("Order", back_populates="user", lazy="selectin")
    reviews = relationship("Review", back_populates="user", lazy="selectin")

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email='{self.email}')>"
```

### 5. Cart and Order Models

```python
# apps/backend/app/models/cart.py
from sqlalchemy import Column, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import BaseModel

class Cart(Base, BaseModel):
    __tablename__ = "carts"

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)

    # Relationships
    user = relationship("User", back_populates="cart")
    items = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan", lazy="selectin")

class CartItem(Base, BaseModel):
    __tablename__ = "cart_items"

    cart_id = Column(Integer, ForeignKey("carts.id"), nullable=False)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)

    # Relationships
    cart = relationship("Cart", back_populates="items")
    book = relationship("Book", back_populates="cart_items")

    __table_args__ = (
        # Prevent duplicate book in same cart
        # Add migration script to create this index
        # Index('uq_cart_book', 'cart_id', 'book_id', unique=True),
    )

# apps/backend/app/models/order.py
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import BaseModel

class OrderStatus(PyEnum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class Order(Base, BaseModel):
    __tablename__ = "orders"

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.PENDING, nullable=False, index=True)
    total_amount = Column(Float, nullable=False)
    shipping_address = Column(String(500), nullable=True)

    # Relationships
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan", lazy="selectin")

class OrderItem(Base, BaseModel):
    __tablename__ = "order_items"

    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)  # Price at time of order

    # Relationships
    order = relationship("Order", back_populates="items")
    book = relationship("Book", back_populates="order_items")
```

### 6. Review Model

```python
# apps/backend/app/models/review.py
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Float, CheckConstraint
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import BaseModel

class Review(Base, BaseModel):
    __tablename__ = "reviews"

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    rating = Column(Float, nullable=False)  # 1-5 stars
    comment = Column(Text, nullable=True)

    # Relationships
    user = relationship("User", back_populates="reviews")
    book = relationship("Book", back_populates="reviews")

    __table_args__ = (
        CheckConstraint('rating >= 1 AND rating <= 5', name='check_rating_range'),
        # Add migration script to create unique constraint
        # UniqueConstraint('user_id', 'book_id', name='uq_user_book_review'),
    )
```

## Alembic Migration Setup

### 1. Initialize Alembic (if not done)

```bash
cd apps/backend
alembic init alembic
```

### 2. Configure Alembic

```python
# apps/backend/alembic/env.py
from asyncio import run
from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context
from app.database import Base
from app.models import user, book, category, cart, order, review  # Import all models

# this is the Alembic Config object
config = context.config

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here for 'autogenerate' support
target_metadata = Base.metadata

def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,  # Detect type changes
    )

    with context.begin_transaction():
        context.run_migrations()

def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
    )

    context.run_migrations()

async def run_async_migrations() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()

def run_migrations_online() -> None:
    run(run_async_migrations())

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

### 3. Create Database URL in alembic.ini

```ini
# apps/backend/alembic.ini
[alembic]
sqlalchemy.url = sqlite+aiosqlite:///./bookstore.db

# For PostgreSQL:
# sqlalchemy.url = postgresql+asyncpg://user:password@localhost:5432/bookstore
```

## Migration Workflow

### Create Initial Migration

```bash
cd apps/backend
alembic revision --autogenerate -m "Initial migration"
```

### Apply Migration

```bash
alembic upgrade head
```

### Rollback One Migration

```bash
alembic downgrade -1
```

### Rollback to Specific Revision

```bash
alembic downgrade <revision_id>
```

### View Current Version

```bash
alembic current
```

### View Migration History

```bash
alembic history
```

### Specific Migration Example

```bash
# Create migration for new book cover_image field
alembic revision -m "Add cover_image to books"

# Manually edit the migration file to add the column
# alembic/versions/001_add_cover_image.py

from alembic import op
import sqlalchemy as sa

def upgrade() -> None:
    op.add_column('books', sa.Column('cover_image', sa.String(500), nullable=True))

def downgrade() -> None:
    op.drop_column('books', 'cover_image')
```

## Advanced Migration Patterns

### 1. Adding Unique Constraints

```python
def upgrade() -> None:
    # Add unique constraint to prevent duplicate reviews from same user on same book
    op.create_unique_constraint(
        'uq_user_book_review',
        'reviews',
        ['user_id', 'book_id']
    )

def downgrade() -> None:
    op.drop_constraint('uq_user_book_review', 'reviews')
```

### 2. Adding Foreign Keys

```python
def upgrade() -> None:
    op.create_foreign_key(
        'fk_books_category',
        'books',
        'category',
        ['category_id'],
        ['id']
    )

def downgrade() -> None:
    op.drop_constraint('fk_books_category', 'books', type_='foreignkey')
```

### 3. Data Migration (Seeding)

```python
def upgrade() -> None:
    # Insert default categories
    from sqlalchemy.orm import Session

    session = Session(bind=op.get_bind())

    categories = [
        Category(name='Fiction'),
        Category(name='Non-Fiction'),
        Category(name='Science'),
        Category(name='History'),
        Category(name='Technology'),
    ]

    for category in categories:
        session.add(category)

    session.commit()
    session.close()

def downgrade() -> None:
    op.execute("DELETE FROM categories WHERE name IN ('Fiction', 'Non-Fiction', 'Science', 'History', 'Technology')")
```

### 4. Index Creation

```python
def upgrade() -> None:
    # Add composite index for faster search queries
    op.create_index(
        'idx_books_title_author',
        'books',
        ['title', 'author']
    )

    # Add index for price range queries
    op.create_index(
        'idx_books_price_stock',
        'books',
        ['price', 'stock']
    )

def downgrade() -> None:
    op.drop_index('idx_books_title_author', 'books')
    op.drop_index('idx_books_price_stock', 'books')
```

### 5. Column Modification (SQLite Limitation)

SQLite has limited ALTER TABLE support. Use batch mode:

```python
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

def upgrade() -> None:
    # SQLite doesn't support ALTER COLUMN, so we need batch mode
    with op.batch_alter_table('books', recreate="auto") as batch_op:
        batch_op.alter_column(
            'price',
            type_=sa.Float(),
            nullable=False,
            existing_nullable=True
        )

def downgrade() -> None:
    with op.batch_alter_table('books', recreate="auto") as batch_op:
        batch_op.alter_column(
            'price',
            type_=sa.Float(),
            nullable=True,
            existing_nullable=False
        )
```

## Query Patterns

### 1. Simple Query

```python
async def get_all_books(session: AsyncSession) -> list[Book]:
    result = await session.execute(select(Book))
    return result.scalars().all()
```

### 2. Filtered Query

```python
async def get_books_by_category(session: AsyncSession, category_id: int) -> list[Book]:
    result = await session.execute(
        select(Book).where(Book.category_id == category_id)
    )
    return result.scalars().all()
```

### 3. Join Query

```python
async def get_books_with_categories(session: AsyncSession) -> list[tuple[Book, Category]]:
    result = await session.execute(
        select(Book, Category)
        .join(Category)
        .order_by(Book.created_at.desc())
    )
    return result.all()  # Returns list of tuples
```

### 4. Complex Filter

```python
async def search_books(
    session: AsyncSession,
    query: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    in_stock: bool = True
) -> list[Book]:
    stmt = select(Book)

    conditions = []

    if query:
        conditions.append(
            or_(
                Book.title.ilike(f"%{query}%"),
                Book.author.ilike(f"%{query}%")
            )
        )

    if min_price is not None:
        conditions.append(Book.price >= min_price)

    if max_price is not None:
        conditions.append(Book.price <= max_price)

    if in_stock:
        conditions.append(Book.stock > 0)

    if conditions:
        stmt = stmt.where(and_(*conditions))

    result = await session.execute(stmt)
    return result.scalars().all()
```

### 5. Pagination

```python
async def get_books_paginated(
    session: AsyncSession,
    page: int = 1,
    page_size: int = 20
) -> tuple[list[Book], int]:
    offset = (page - 1) * page_size

    # Get paginated results
    result = await session.execute(
        select(Book)
        .order_by(Book.created_at.desc())
        .limit(page_size)
        .offset(offset)
    )
    books = result.scalars().all()

    # Get total count
    count_result = await session.execute(
        select(func.count()).select_from(Book)
    )
    total = count_result.scalar()

    return books, total
```

### 6. Aggregation

```python
async def get_category_stats(session: AsyncSession) -> list[dict]:
    result = await session.execute(
        select(
            Category.name,
            func.count(Book.id).label('book_count'),
            func.avg(Book.price).label('avg_price')
        )
        .outerjoin(Book, Category.id == Book.category_id)
        .group_by(Category.id, Category.name)
    )

    stats = []
    for row in result:
        stats.append({
            'category': row.name,
            'book_count': row.book_count,
            'avg_price': float(row.avg_price) if row.avg_price else 0.0
        })

    return stats
```

## Best Practices

### 1. Always Use Async

```python
# ❌ Wrong - Synchronous
books = session.query(Book).all()

# ✅ Correct - Asynchronous
result = await session.execute(select(Book))
books = result.scalars().all()
```

### 2. Use Session Context Manager

```python
# ✅ Correct
async with AsyncSessionLocal() as session:
    books = await get_all_books(session)

# ❌ Wrong - Don't forget to close
session = AsyncSessionLocal()
books = await get_all_books(session)
await session.close()
```

### 3. Lazy Loading Strategy

```python
# Use selectin for relationships to avoid N+1 queries
class Book(Base):
    # ...
    reviews = relationship("Review", back_populates="book", lazy="selectin")
```

### 4. Transaction Management

```python
async def place_order(session: AsyncSession, user_id: int, items: list[dict]) -> Order:
    async with session.begin():
        order = Order(user_id=user_id, total_amount=0)
        session.add(order)
        await session.flush()  # Get order.id

        total = 0
        for item in items:
            book = await session.get(Book, item['book_id'])
            if not book or book.stock < item['quantity']:
                raise Exception(f"Insufficient stock for book {book.title}")

            order_item = OrderItem(
                order_id=order.id,
                book_id=book.id,
                quantity=item['quantity'],
                price=book.price
            )
            session.add(order_item)

            book.stock -= item['quantity']
            total += book.price * item['quantity']

        order.total_amount = total

    await session.refresh(order)
    return order
```

## Database Checklist

Before committing database changes:

- [ ] Models inherit from BaseModel for consistent fields
- [ ] All relationships are properly defined with back_populates
- [ ] Foreign key constraints are added
- [ ] Indexes are added for frequently queried columns
- [ ] Unique constraints are added where needed
- [ ] Check constraints are added for validation
- [ ] Migration file created with descriptive message
- [ ] Migration tested in both upgrade and downgrade
- [ ] All queries use async/await
- [ ] Session context manager is used
- [ ] Lazy loading strategy configured for relationships
- [ ] Transaction management for complex operations
