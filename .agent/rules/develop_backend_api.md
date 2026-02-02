---
trigger: model_decision
description: Design and implement FastAPI backend endpoints following the layered architecture pattern
---

# FastAPI Backend Development

## Architecture Pattern

Follow the layered architecture: **Router → Service → Repository → Model**

```
routers/     # HTTP layer - validate input, call services, return responses
services/    # Business logic - orchestrate operations, enforce rules
repositories/# Data access - SQLAlchemy async queries
models/      # ORM definitions - SQLAlchemy models
schemas/     # Pydantic models - request/response validation
```

## Creating a New Endpoint

### 1. Define Pydantic Schemas (`schemas/`)

```python
# schemas/item.py
from pydantic import BaseModel

class ItemCreate(BaseModel):
    name: str
    description: str | None = None

class ItemUpdate(BaseModel):
    name: str | None = None
    description: str | None = None

class ItemResponse(BaseModel):
    id: int
    name: str
    description: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

**Naming convention**: `{Resource}Create`, `{Resource}Update`, `{Resource}Response`

### 2. Create Repository (`repositories/`)

```python
# repositories/item.py
from app.repositories.base import BaseRepository
from app.models.item import Item

class ItemRepository(BaseRepository[Item]):
    def __init__(self, session: AsyncSession):
        super().__init__(Item, session)

    async def find_by_name(self, name: str) -> Item | None:
        result = await self.session.execute(
            select(Item).where(Item.name == name)
        )
        return result.scalar_one_or_none()
```

### 3. Create Service (`services/`)

```python
# services/item.py
from app.exceptions import NotFoundException, ConflictException

class ItemService:
    def __init__(self, session: AsyncSession):
        self.repository = ItemRepository(session)

    async def create(self, data: ItemCreate) -> Item:
        existing = await self.repository.find_by_name(data.name)
        if existing:
            raise ConflictException("Item with this name already exists")
        return await self.repository.create(data.model_dump())

    async def get_by_id(self, item_id: int) -> Item:
        item = await self.repository.get(item_id)
        if not item:
            raise NotFoundException("Item not found")
        return item
```

### 4. Create Router (`routers/`)

```python
# routers/item.py
from fastapi import APIRouter, Depends, status
from app.dependencies import get_db, get_current_active_user

router = APIRouter(prefix="/items", tags=["items"])

@router.post("/", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
async def create_item(
    data: ItemCreate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = ItemService(session)
    return await service.create(data)

@router.get("/{item_id}", response_model=ItemResponse)
async def get_item(
    item_id: int,
    session: AsyncSession = Depends(get_db),
):
    service = ItemService(session)
    return await service.get_by_id(item_id)
```

### 5. Register Router (`main.py`)

```python
from app.routers import item
app.include_router(item.router)
```

## Authentication Dependencies

Use the appropriate auth dependency from `dependencies.py`:

| Dependency | Use Case |
|------------|----------|
| `get_current_user` | Any authenticated user |
| `get_current_active_user` | Active (non-disabled) user |
| `get_admin_user` | Admin-only endpoints |
| `get_optional_user` | Public endpoint with optional auth |

## Error Handling

Use exceptions from `exceptions.py`:

```python
from app.exceptions import (
    NotFoundException,      # 404 - Resource not found
    ConflictException,      # 409 - Already exists
    BadRequestException,    # 400 - Invalid input
    UnauthorizedException,  # 401 - Not authenticated
    ForbiddenException,     # 403 - Not authorized
)

# Example
if not item:
    raise NotFoundException(f"Item {item_id} not found")
```

## Database Patterns

### Async Operations

All database operations must be async:

```python
# Correct
result = await self.session.execute(select(Item))
items = result.scalars().all()

# After modifications
await self.session.commit()
await self.session.refresh(item)
```

### Pagination

Use the pagination helper:

```python
from app.utils.pagination import paginate

@router.get("/", response_model=PaginatedResponse[ItemResponse])
async def list_items(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    session: AsyncSession = Depends(get_db),
):
    query = select(Item).order_by(Item.created_at.desc())
    return await paginate(session, query, page, size)
```

## Checklist

Before completing a new endpoint:

- [ ] Pydantic schemas defined with proper validation
- [ ] Repository extends `BaseRepository` or implements custom queries
- [ ] Service handles business logic and raises appropriate exceptions
- [ ] Router uses correct HTTP methods and status codes
- [ ] Auth dependency applied if endpoint requires authentication
- [ ] Router registered in `main.py`
- [ ] Endpoint documented (FastAPI auto-generates from type hints)
