from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.database import create_tables
from app.routers import auth_router, users_router, categories_router, books_router, cart_router, orders_router, payments_router, reviews_router, admin_router
from app.exceptions import BookStoreException


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
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
    return {"status": "healthy"}
