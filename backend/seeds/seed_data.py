import asyncio
import sys
from decimal import Decimal
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal, create_tables
from app.models.user import User, UserRole
from app.models.category import Category
from app.models.book import Book
from app.utils.security import get_password_hash


CATEGORIES = [
    {"name": "Fiction", "description": "Fictional literature including novels and short stories"},
    {"name": "Non-Fiction", "description": "Factual books including biographies, history, and science"},
    {"name": "Science Fiction", "description": "Speculative fiction dealing with imaginative concepts"},
    {"name": "Fantasy", "description": "Fiction set in imaginary universes with magical elements"},
    {"name": "Mystery", "description": "Fiction dealing with the solution of a crime or puzzle"},
    {"name": "Romance", "description": "Fiction focused on romantic relationships"},
    {"name": "Thriller", "description": "Fiction characterized by suspense, excitement, and tension"},
    {"name": "Biography", "description": "Accounts of real people's lives"},
    {"name": "Self-Help", "description": "Books aimed at personal improvement"},
    {"name": "Technology", "description": "Books about computers, programming, and technology"},
]

BOOKS = [
    {
        "title": "The Great Gatsby",
        "author": "F. Scott Fitzgerald",
        "description": "A story of decadence and excess in the Jazz Age.",
        "isbn": "9780743273565",
        "price": Decimal("14.99"),
        "stock_quantity": 50,
        "cover_image": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop",
        "categories": ["Fiction"],
    },
    {
        "title": "1984",
        "author": "George Orwell",
        "description": "A dystopian social science fiction novel.",
        "isbn": "9780451524935",
        "price": Decimal("12.99"),
        "stock_quantity": 75,
        "cover_image": "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop",
        "categories": ["Fiction", "Science Fiction"],
    },
    {
        "title": "Dune",
        "author": "Frank Herbert",
        "description": "An epic science fiction novel set in the distant future.",
        "isbn": "9780441172719",
        "price": Decimal("18.99"),
        "stock_quantity": 40,
        "cover_image": "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=600&fit=crop",
        "categories": ["Science Fiction", "Fantasy"],
    },
    {
        "title": "The Hobbit",
        "author": "J.R.R. Tolkien",
        "description": "A fantasy novel about the adventures of Bilbo Baggins.",
        "isbn": "9780547928227",
        "price": Decimal("15.99"),
        "stock_quantity": 60,
        "cover_image": "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=600&fit=crop",
        "categories": ["Fantasy", "Fiction"],
    },
    {
        "title": "Murder on the Orient Express",
        "author": "Agatha Christie",
        "description": "A detective novel featuring Hercule Poirot.",
        "isbn": "9780062693662",
        "price": Decimal("13.99"),
        "stock_quantity": 45,
        "cover_image": "https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=400&h=600&fit=crop",
        "categories": ["Mystery", "Fiction"],
    },
    {
        "title": "Pride and Prejudice",
        "author": "Jane Austen",
        "description": "A romantic novel of manners.",
        "isbn": "9780141439518",
        "price": Decimal("11.99"),
        "stock_quantity": 55,
        "cover_image": "https://images.unsplash.com/photo-1589998059171-988d887df646?w=400&h=600&fit=crop",
        "categories": ["Romance", "Fiction"],
    },
    {
        "title": "The Da Vinci Code",
        "author": "Dan Brown",
        "description": "A mystery thriller novel.",
        "isbn": "9780307474278",
        "price": Decimal("16.99"),
        "stock_quantity": 70,
        "cover_image": "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=400&h=600&fit=crop",
        "categories": ["Thriller", "Mystery"],
    },
    {
        "title": "Steve Jobs",
        "author": "Walter Isaacson",
        "description": "The biography of Apple's legendary co-founder.",
        "isbn": "9781451648539",
        "price": Decimal("19.99"),
        "stock_quantity": 35,
        "cover_image": "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400&h=600&fit=crop",
        "categories": ["Biography", "Non-Fiction"],
    },
    {
        "title": "Atomic Habits",
        "author": "James Clear",
        "description": "An easy and proven way to build good habits.",
        "isbn": "9780735211292",
        "price": Decimal("17.99"),
        "stock_quantity": 80,
        "cover_image": "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=600&fit=crop",
        "categories": ["Self-Help", "Non-Fiction"],
    },
    {
        "title": "Clean Code",
        "author": "Robert C. Martin",
        "description": "A handbook of agile software craftsmanship.",
        "isbn": "9780132350884",
        "price": Decimal("39.99"),
        "stock_quantity": 25,
        "cover_image": "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&h=600&fit=crop",
        "categories": ["Technology", "Non-Fiction"],
    },
]

USERS = [
    {
        "email": "admin@bookstore.com",
        "password": "admin123456",
        "full_name": "Admin User",
        "role": UserRole.ADMIN,
    },
    {
        "email": "user@bookstore.com",
        "password": "user123456",
        "full_name": "Regular User",
        "role": UserRole.USER,
    },
    {
        "email": "john@example.com",
        "password": "password123",
        "full_name": "John Doe",
        "role": UserRole.USER,
    },
]


async def seed_database():
    await create_tables()

    async with AsyncSessionLocal() as db:
        print("Seeding categories...")
        categories_map = {}
        for cat_data in CATEGORIES:
            category = Category(**cat_data)
            db.add(category)
            await db.flush()
            categories_map[cat_data["name"]] = category

        print("Seeding books...")
        for book_data in BOOKS:
            cat_names = book_data.pop("categories")
            book = Book(**book_data)
            book.categories = [categories_map[name] for name in cat_names]
            db.add(book)

        print("Seeding users...")
        for user_data in USERS:
            password = user_data.pop("password")
            user = User(
                **user_data,
                hashed_password=get_password_hash(password)
            )
            db.add(user)

        await db.commit()
        print("Database seeded successfully!")
        print("\nAdmin credentials:")
        print("  Email: admin@bookstore.com")
        print("  Password: admin123456")
        print("\nUser credentials:")
        print("  Email: user@bookstore.com")
        print("  Password: user123456")


if __name__ == "__main__":
    asyncio.run(seed_database())
