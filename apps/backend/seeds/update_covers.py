"""Script to update book cover images in existing database."""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import update
from app.database import AsyncSessionLocal
from app.models.book import Book

# Mapping of ISBN to new cover image URL
COVER_UPDATES = {
    "9780743273565": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop",  # The Great Gatsby
    "9780451524935": "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop",  # 1984
    "9780441172719": "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=600&fit=crop",  # Dune
    "9780547928227": "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=600&fit=crop",  # The Hobbit
    "9780062693662": "https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=400&h=600&fit=crop",  # Murder on the Orient Express
    "9780141439518": "https://images.unsplash.com/photo-1589998059171-988d887df646?w=400&h=600&fit=crop",  # Pride and Prejudice
    "9780307474278": "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=400&h=600&fit=crop",  # The Da Vinci Code
    "9781451648539": "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400&h=600&fit=crop",  # Steve Jobs
    "9780735211292": "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=600&fit=crop",  # Atomic Habits
    "9780132350884": "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&h=600&fit=crop",  # Clean Code
}


async def update_cover_images():
    async with AsyncSessionLocal() as db:
        updated_count = 0
        for isbn, cover_url in COVER_UPDATES.items():
            stmt = (
                update(Book)
                .where(Book.isbn == isbn)
                .values(cover_image=cover_url)
            )
            result = await db.execute(stmt)
            if result.rowcount > 0:
                updated_count += result.rowcount
                print(f"Updated cover for ISBN {isbn}")

        await db.commit()
        print(f"\nTotal books updated: {updated_count}")


if __name__ == "__main__":
    asyncio.run(update_cover_images())
