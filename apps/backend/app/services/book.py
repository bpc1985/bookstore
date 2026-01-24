from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.book import Book
from app.schemas.book import BookCreate, BookUpdate, BookSearchParams
from app.repositories.book import BookRepository
from app.repositories.category import CategoryRepository
from app.exceptions import NotFoundException, ConflictException
from app.utils.pagination import PaginatedResponse


class BookService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.book_repo = BookRepository(db)
        self.category_repo = CategoryRepository(db)

    async def create_book(self, book_data: BookCreate) -> Book:
        existing = await self.book_repo.get_by_isbn(book_data.isbn)
        if existing:
            raise ConflictException("Book with this ISBN already exists")

        categories = await self.category_repo.get_by_ids(book_data.category_ids)

        book_dict = book_data.model_dump(exclude={"category_ids"})
        book = Book(**book_dict)
        book.categories = categories

        self.db.add(book)
        await self.db.commit()
        await self.db.refresh(book)

        return await self.book_repo.get_with_categories(book.id)

    async def get_book(self, book_id: int) -> Book:
        book = await self.book_repo.get_with_categories(book_id)
        if not book:
            raise NotFoundException("Book")
        return book

    async def update_book(self, book_id: int, book_data: BookUpdate) -> Book:
        book = await self.book_repo.get_with_categories(book_id)
        if not book:
            raise NotFoundException("Book")

        update_data = book_data.model_dump(exclude_unset=True, exclude={"category_ids"})
        for field, value in update_data.items():
            setattr(book, field, value)

        if book_data.category_ids is not None:
            categories = await self.category_repo.get_by_ids(book_data.category_ids)
            book.categories = categories

        await self.db.commit()
        await self.db.refresh(book)

        return await self.book_repo.get_with_categories(book.id)

    async def delete_book(self, book_id: int) -> None:
        book = await self.book_repo.get_with_categories(book_id)
        if not book:
            raise NotFoundException("Book")
        await self.book_repo.soft_delete(book)

    async def search_books(
        self,
        params: BookSearchParams,
        page: int = 1,
        size: int = 20,
    ) -> PaginatedResponse:
        offset = (page - 1) * size
        books, total = await self.book_repo.search(
            search=params.search,
            category_id=params.category_id,
            min_price=params.min_price,
            max_price=params.max_price,
            in_stock=params.in_stock,
            sort_by=params.sort_by,
            sort_order=params.sort_order,
            offset=offset,
            limit=size,
        )
        return PaginatedResponse.create(items=list(books), total=total, page=page, size=size)
