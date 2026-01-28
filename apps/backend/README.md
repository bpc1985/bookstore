# Bookstore Backend (FastAPI)

FastAPI backend for the Bookstore e-commerce application.

## Tech Stack

- **Framework**: FastAPI
- **ORM**: SQLAlchemy 2.0 (async)
- **Database**: SQLite with aiosqlite
- **Migrations**: Alembic
- **Validation**: Pydantic v2
- **Auth**: JWT (python-jose) + bcrypt

## Getting Started

### Prerequisites

- Python 3.10+
- Virtual environment

### Setup

```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate     # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### From Monorepo Root

```bash
pnpm backend:dev       # Start dev server (requires venv activated)
pnpm backend:seed      # Seed database
pnpm backend:migrate   # Run migrations
```

### From This Directory

```bash
# Start development server
pnpm dev
# or
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Database operations
pnpm seed              # Seed sample data
pnpm migrate           # Apply migrations
```

## Project Structure

```
app/
├── main.py             # FastAPI app entry point
├── dependencies.py     # Dependency injection (auth, DB session)
├── exceptions.py       # Custom exception classes
├── routers/            # API endpoints
│   ├── auth.py         # /auth - register, login, logout, refresh
│   ├── users.py        # /users - profile management
│   ├── categories.py   # /categories - CRUD
│   ├── books.py        # /books - CRUD with search
│   ├── cart.py         # /cart - shopping cart
│   ├── orders.py       # /orders - order management
│   ├── payments.py     # /payments - checkout
│   ├── reviews.py      # /reviews - book reviews
│   └── admin.py        # /admin - admin operations
├── services/           # Business logic layer
├── repositories/       # Data access layer
├── models/             # SQLAlchemy ORM models
├── schemas/            # Pydantic request/response models
└── utils/
    ├── security.py     # JWT and password hashing
    └── pagination.py   # Pagination helpers

seeds/
└── seed_data.py        # Database seeding script

alembic/                # Database migrations
```

## API Documentation

When the server is running:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /auth/register` | Register new user |
| `POST /auth/login` | Login and get tokens |
| `POST /auth/refresh` | Refresh access token |
| `POST /auth/logout` | Logout (blacklist token) |
| `GET /users/me` | Get current user |
| `PUT /users/me` | Update current user |
| `GET /categories` | List categories |
| `GET /books` | List books with filters |
| `GET /books/{id}` | Get book details |
| `GET /cart` | Get shopping cart |
| `POST /cart/items` | Add item to cart |
| `POST /orders` | Create order from cart |
| `GET /orders` | List user orders |
| `POST /payments/checkout` | Process payment |
| `POST /books/{id}/reviews` | Add book review |
| `GET /admin/analytics` | Admin dashboard stats |

## Database Migrations

```bash
# Apply all migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Create new migration
alembic revision --autogenerate -m "description"
```

## Authentication

- JWT-based with access tokens (15 min) and refresh tokens (7 days)
- Token blacklisting for logout
- Role-based access control (USER, ADMIN)

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@bookstore.com` | `admin123456` |
| User | `user@bookstore.com` | `user123456` |
