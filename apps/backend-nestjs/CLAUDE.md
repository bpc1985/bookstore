# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

NestJS backend for the bookstore e-commerce application. Uses Prisma ORM with SQLite. Runs on **port 8001**.

## Commands

```bash
pnpm dev          # Start dev server with hot reload (nest start --watch)
pnpm build        # Compile TypeScript (nest build)
pnpm start        # Run production build (node dist/main)
pnpm seed         # Seed sample data (ts-node prisma/seed.ts)
pnpm migrate      # Apply schema changes to database (prisma db push)
pnpm clean        # Remove dist/ and node_modules/
```

**Prisma commands (run from this directory):**
```bash
npx prisma studio          # Open database GUI
npx prisma generate        # Regenerate Prisma client after schema changes
npx prisma migrate dev     # Create a new migration
```

## Architecture

```
src/
├── main.ts                 # Entry point, configures Swagger at /docs
├── app.module.ts           # Root module, registers global guards/filters
├── prisma/                 # PrismaService wrapper for database access
├── common/
│   ├── decorators/         # @Public(), @CurrentUser(), @Roles()
│   ├── guards/             # JwtAuthGuard (global), RolesGuard (global)
│   ├── filters/            # Global HTTP exception filter
│   └── dto/                # PaginatedResponse<T>
└── [feature]/              # auth, users, books, categories, cart, orders, payments, reviews, admin
    ├── [feature].module.ts
    ├── [feature].controller.ts
    ├── [feature].service.ts
    └── dto/
```

**Request flow:** HTTP → Guards → Controller → Service → PrismaService → SQLite

## Key Patterns

### Authentication
- JWT with access tokens (15 min) and refresh tokens (7 days)
- All routes protected by default via global `JwtAuthGuard`
- Use `@Public()` decorator to make routes accessible without auth
- Use `@Roles('admin')` for admin-only endpoints
- Use `@CurrentUser()` to inject authenticated user into handler

### Database
- Prisma schema: `prisma/schema.prisma`
- Database file: `prisma/bookstore.db`
- Models: User, TokenBlacklist, Category, Book, BookCategory, CartItem, Order, OrderItem, OrderStatusHistory, Review
- Books use soft delete (`is_deleted` flag)

### DTOs & Validation
- All input validated via class-validator decorators on DTOs
- All DTOs documented with `@ApiProperty()` for Swagger
- Use `PaginatedResponse.create()` for paginated endpoints

### Transactions
- Order creation uses `prisma.$transaction()` for atomic stock deduction

## Environment Variables

```
DATABASE_URL="file:./bookstore.db"
JWT_SECRET="your-secret-key"
JWT_ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
```

## Test Credentials

- Admin: `admin@bookstore.com` / `admin123456`
- User: `user@bookstore.com` / `user123456`

## API Documentation

Swagger UI available at http://localhost:8001/docs when server is running.
