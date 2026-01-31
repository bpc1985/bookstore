import os
import subprocess
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from app.database import create_tables
from app.routers import auth_router, users_router, categories_router, books_router, cart_router, orders_router, payments_router, reviews_router, admin_router
from app.exceptions import BookStoreException

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def run_migrations():
    """Run Alembic migrations on startup"""
    if os.getenv("RUN_MIGRATIONS", "false").lower() == "true":
        logger.info("Running database migrations...")
        try:
            result = subprocess.run(
                ["alembic", "upgrade", "head"],
                capture_output=True,
                text=True,
                check=True
            )
            logger.info(f"Migrations completed: {result.stdout}")
        except subprocess.CalledProcessError as e:
            # If tables already exist (created by create_tables), stamp the db
            if "already exists" in e.stderr:
                logger.warning("Tables already exist, stamping database with current migration...")
                try:
                    stamp_result = subprocess.run(
                        ["alembic", "stamp", "head"],
                        capture_output=True,
                        text=True,
                        check=True
                    )
                    logger.info(f"Database stamped: {stamp_result.stdout}")
                except subprocess.CalledProcessError as stamp_error:
                    logger.error(f"Stamp failed: {stamp_error.stderr}")
                    raise
            else:
                logger.error(f"Migration failed: {e.stderr}")
                raise


def run_seed():
    """Run seed script on startup (for testing/demo)"""
    if os.getenv("AUTO_SEED", "false").lower() == "true":
        logger.info("Running database seed...")
        try:
            result = subprocess.run(
                ["python", "seeds/seed_data.py"],
                capture_output=True,
                text=True,
                check=True
            )
            logger.info(f"Seeding completed: {result.stdout}")
        except subprocess.CalledProcessError as e:
            logger.warning(f"Seeding failed (may already be seeded): {e.stderr}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    run_migrations()
    # Note: create_tables() is not needed when using Alembic migrations
    # Only call it if not running migrations (local dev with SQLite)
    if os.getenv("RUN_MIGRATIONS", "false").lower() != "true":
        await create_tables()
    run_seed()
    yield


app = FastAPI(
    title="Book Store API",
    description="Production-grade ecommerce API for a Book Store",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request: {request.method} {request.url.path}")
    response = await call_next(request)
    logger.info(f"Response: {response.status_code} for {request.method} {request.url.path}")
    return response


@app.exception_handler(BookStoreException)
async def bookstore_exception_handler(request: Request, exc: BookStoreException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


app.include_router(auth_router)
app.include_router(users_router)
app.include_router(categories_router)
app.include_router(books_router)
app.include_router(cart_router)
app.include_router(orders_router)
app.include_router(payments_router)
app.include_router(reviews_router)
app.include_router(admin_router)


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "bookstore-api"
    }
