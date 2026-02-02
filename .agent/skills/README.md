# AI Skills for Bookstore Project

This directory contains AI skills specifically tailored for the bookstore e-commerce application. Each skill provides comprehensive guidance for specific aspects of the project.

## Available Skills

### 🎨 [ui-design.md](./ui-design.md)
**Trigger:** `ui_design`

Design and implement UI components using Next.js 16, shadcn/ui, and Tailwind CSS with accessibility and responsive best practices.

**Covers:**
- Component patterns (Server vs Client Components)
- shadcn/ui component usage and customization
- Responsive design (mobile-first approach)
- Typography and color systems
- Accessibility standards (WCAG AA)
- Form patterns with React Hook Form + Zod
- Loading and error states
- Navigation patterns (navbar, admin dashboard)
- Design system checklist

**Use when:** Designing new UI components, pages, layouts, or improving existing UI.

---

### 🔧 [backend-api.md](./backend-api.md)
**Trigger:** `backend_api`

Design and implement FastAPI backend endpoints following the layered architecture pattern with async SQLAlchemy.

**Covers:**
- Layered architecture (Router → Service → Repository → Model)
- Pydantic schema definitions
- SQLAlchemy async models and relationships
- Repository patterns and base repository
- Service layer business logic
- FastAPI router setup and dependencies
- Authentication and authorization
- Error handling with custom exceptions
- Async database operations
- Migration workflow with Alembic
- Endpoint checklist

**Use when:** Creating new API endpoints, modifying backend logic, or working with database operations.

---

### 📘 [typescript-standards.md](./typescript-standards.md)
**Trigger:** `typescript_standards`

Follow TypeScript best practices, type safety rules, and project-specific conventions.

**Covers:**
- Type safety rules (no implicit any, proper typing)
- Shared types package (@bookstore/types)
- Component typing (props, generics, children)
- API client typing
- Zustand store typing
- Form typing (React Hook Form + Zod)
- Server Components typing
- Utility types and type guards
- Error handling typing
- Type safety checklist

**Use when:** Writing TypeScript code, defining types, or ensuring type safety across the project.

---

### 🗄️ [database-migrations.md](./database-migrations.md)
**Trigger:** `database_migrations`

Design database models, create migrations, and manage database operations with SQLAlchemy.

**Covers:**
- Database configuration and connection setup
- Model design patterns (base model, relationships)
- Book, Category, User, Cart, Order, Review models
- Alembic migration setup and configuration
- Migration workflow (create, apply, rollback)
- Advanced migration patterns (constraints, indexes, data seeding)
- Query patterns (simple, filtered, join, complex, pagination, aggregation)
- Best practices for async operations
- Database checklist

**Use when:** Creating database models, writing migrations, or performing database queries.

---

### 🧪 [testing.md](./testing.md)
**Trigger:** `testing`

Write tests for frontend and backend components, API endpoints, and database operations.

**Covers:**
- Frontend testing (Jest + React Testing Library)
- Component testing patterns
- Server Components testing
- Zustand store testing
- Form testing
- E2E testing with Playwright
- Backend testing (pytest + pytest-asyncio)
- Test setup and fixtures
- API endpoint testing
- Service layer testing
- Repository layer testing
- Authentication testing
- Database integration testing
- Test commands and coverage goals

**Use when:** Writing tests for any part of the application, setting up test infrastructure, or improving test coverage.

---

### 📦 [monorepo-operations.md](./monorepo-operations.md)
**Trigger:** `monorepo_operations`

Manage the Turborepo monorepo, add dependencies to specific packages, and run commands across the workspace.

**Covers:**
- Monorepo structure and configuration
- Adding dependencies to specific packages (frontend, backend, shared types)
- Running commands across all apps or specific packages
- Working with shared types package
- Turborepo caching and performance
- Task dependencies
- Monorepo best practices
- Troubleshooting common issues
- Performance tips

**Use when:** Managing the monorepo, adding dependencies, running commands across packages, or troubleshooting monorepo issues.

---

## How to Use These Skills

### For AI Assistants

When working on the bookstore project, reference these skills based on the task at hand:

1. **UI/UX work** → Use `ui-design.md`
2. **Backend API work** → Use `backend-api.md`
3. **TypeScript implementation** → Use `typescript-standards.md`
4. **Database work** → Use `database-migrations.md`
5. **Testing** → Use `testing.md`
6. **Monorepo operations** → Use `monorepo-operations.md`

### For Developers

These skills serve as comprehensive guides for best practices in each area. Each skill includes:

- ✅ Technology stack and tools
- 📝 Code examples and patterns
- 🔍 Checklists for verification
- 🚀 Commands and workflows
- ⚠️ Common pitfalls and solutions

## Project Overview

The bookstore is a full-stack e-commerce application with:

- **Frontend:** Next.js 16 with shadcn/ui, Zustand, Tailwind CSS
- **Backend:** FastAPI with async SQLAlchemy
- **Database:** SQLite (dev) / PostgreSQL (prod)
- **Architecture:** Turborepo monorepo with pnpm workspaces
- **Shared Code:** TypeScript types package

## Quick Reference

### Running Commands

```bash
# All apps
pnpm dev                    # Start all apps
pnpm build                  # Build all apps
pnpm typecheck              # Type check all apps
pnpm test                   # Test all apps

# Frontend only
pnpm frontend:dev           # Next.js dev server
pnpm frontend:build         # Build Next.js app
pnpm frontend:typecheck     # Type check frontend

# Backend only
pnpm backend:dev            # FastAPI server (requires venv)
pnpm backend:seed           # Seed database
pnpm backend:migrate        # Run migrations
```

### Adding Dependencies

```bash
# Frontend
pnpm --filter @bookstore/frontend add <package>

# Backend (Python)
cd apps/backend
pip install <package>
pip freeze > requirements.txt

# Shared types
pnpm --filter @bookstore/types add <package>
```

### Type Checking

Always run `pnpm typecheck` before committing. Zero errors expected.

### Database Migrations

```bash
cd apps/backend
alembic revision --autogenerate -m "description"
alembic upgrade head
```

## Contributing to Skills

When updating project practices or adding new patterns:

1. Update the relevant skill file with new information
2. Include code examples and explanations
3. Update checklists and verification steps
4. Test the patterns work correctly
5. Document any breaking changes

## Support

For questions or issues with these skills:

1. Check the specific skill file for detailed guidance
2. Review the project CLAUDE.md for general guidance
3. Reference the official documentation for each technology stack

---

**Last Updated:** 2024
**Project:** Bookstore E-Commerce Application
**Tech Stack:** Next.js 16, FastAPI, SQLAlchemy, shadcn/ui, Zustand, Turborepo
