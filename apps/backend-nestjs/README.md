# Bookstore Backend (NestJS)

NestJS backend for the Bookstore e-commerce application.

## Tech Stack

- **Framework**: NestJS 10
- **ORM**: Prisma
- **Database**: SQLite
- **Validation**: class-validator + class-transformer
- **Auth**: Passport.js with JWT strategy
- **API Docs**: Swagger (OpenAPI)

## Getting Started

### From Monorepo Root

```bash
pnpm backend-nestjs:dev       # Start dev server
pnpm backend-nestjs:seed      # Seed database
pnpm backend-nestjs:migrate   # Apply Prisma schema
```

### From This Directory

```bash
pnpm dev               # Start dev server with hot reload
pnpm build             # Compile TypeScript
pnpm start             # Run production build
pnpm seed              # Seed sample data
pnpm migrate           # Apply Prisma schema to database
```

## Project Structure

```
prisma/
├── schema.prisma       # Database schema
├── seed.ts             # Seeding script
└── bookstore.db        # SQLite database file

src/
├── main.ts             # App entry point, Swagger setup
├── app.module.ts       # Root module
├── app.controller.ts   # Health check endpoint
├── prisma/             # PrismaService wrapper
├── common/
│   ├── decorators/     # @Public(), @CurrentUser(), @Roles()
│   ├── guards/         # JwtAuthGuard, RolesGuard
│   ├── filters/        # Global exception filter
│   └── dto/            # PaginatedResponse
├── auth/               # Authentication module
├── users/              # User profile module
├── categories/         # Categories CRUD
├── books/              # Books CRUD + recommendations
├── cart/               # Shopping cart
├── orders/             # Order management
├── payments/           # Payment processing
├── reviews/            # Book reviews
└── admin/              # Admin operations
```

## API Documentation

When the server is running:
- **Swagger UI**: http://localhost:8001/docs

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check |
| `POST /auth/register` | Register new user |
| `POST /auth/login` | Login and get tokens |
| `POST /auth/refresh` | Refresh access token |
| `POST /auth/logout` | Logout (blacklist token) |
| `GET /users/me` | Get current user |
| `PUT /users/me` | Update current user |
| `GET /categories` | List categories |
| `GET /books` | List books with filters |
| `GET /books/{id}` | Get book details |
| `GET /books/{id}/recommendations` | Get similar books |
| `GET /cart` | Get shopping cart |
| `POST /cart/items` | Add item to cart |
| `POST /orders` | Create order from cart |
| `GET /orders` | List user orders |
| `POST /payments/checkout` | Process payment |
| `POST /books/{id}/reviews` | Add book review |
| `GET /admin/analytics` | Admin dashboard stats |

## Prisma Commands

```bash
# Generate Prisma client after schema changes
npx prisma generate

# Apply schema to database (dev)
npx prisma db push

# Create and apply migration
npx prisma migrate dev

# Open database GUI
npx prisma studio
```

## Authentication

- JWT with access tokens (15 min) and refresh tokens (7 days)
- All routes protected by default via global `JwtAuthGuard`
- Use `@Public()` decorator for public routes
- Use `@Roles('admin')` for admin-only routes
- Use `@CurrentUser()` to inject authenticated user

## Environment Variables

```env
DATABASE_URL="file:./bookstore.db"
JWT_SECRET="your-secret-key"
JWT_ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
```

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@bookstore.com` | `admin123456` |
| User | `user@bookstore.com` | `user123456` |
