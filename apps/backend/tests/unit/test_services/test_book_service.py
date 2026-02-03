import pytest
from decimal import Decimal

from app.services.book import BookService
from app.schemas.book import BookCreate, BookUpdate, BookSearchParams
from app.exceptions import ConflictException, NotFoundException


@pytest.mark.asyncio
class TestBookService:
    async def test_create_book_success(self, db_session, sample_category):
        service = BookService(db_session)
        book_data = BookCreate(
            title="New Book",
            author="New Author",
            description="New description",
            isbn="9876543210123",
            price=Decimal("29.99"),
            stock_quantity=15,
            category_ids=[sample_category.id]
        )
        book = await service.create_book(book_data)
        assert book.id is not None
        assert book.title == "New Book"
        assert book.author == "New Author"
        assert len(book.categories) == 1
        assert book.categories[0].id == sample_category.id

    async def test_create_book_duplicate_isbn(self, db_session, sample_book):
        service = BookService(db_session)
        book_data = BookCreate(
            title="Different Title",
            author="Different Author",
            description="Different description",
            isbn=sample_book.isbn,
            price=Decimal("39.99"),
            stock_quantity=20
        )
        with pytest.raises(ConflictException) as exc_info:
            await service.create_book(book_data)
        assert "Book with this ISBN already exists" in str(exc_info.value.detail)

    async def test_get_book_success(self, db_session, sample_book):
        service = BookService(db_session)
        book = await service.get_book(sample_book.id)
        assert book.id == sample_book.id
        assert book.title == sample_book.title

    async def test_get_book_not_found(self, db_session):
        service = BookService(db_session)
        with pytest.raises(NotFoundException) as exc_info:
            await service.get_book(99999)
        assert "Book" in str(exc_info.value.detail)

    async def test_update_book_success(self, db_session, sample_book):
        service = BookService(db_session)
        update_data = BookUpdate(
            title="Updated Title",
            price=Decimal("49.99")
        )
        book = await service.update_book(sample_book.id, update_data)
        assert book.title == "Updated Title"
        assert book.price == Decimal("49.99")
        assert book.author == sample_book.author

    async def test_update_book_not_found(self, db_session):
        service = BookService(db_session)
        update_data = BookUpdate(title="New Title")
        with pytest.raises(NotFoundException) as exc_info:
            await service.update_book(99999, update_data)
        assert "Book" in str(exc_info.value.detail)

    async def test_update_book_with_categories(self, db_session, sample_book, sample_category):
        service = BookService(db_session)
        new_category = await service.category_repo.create({
            "name": "New Category",
            "description": "New category description"
        })

        update_data = BookUpdate(category_ids=[new_category.id])
        book = await service.update_book(sample_book.id, update_data)
        assert len(book.categories) == 1
        assert book.categories[0].id == new_category.id

    async def test_delete_book(self, db_session, sample_book):
        service = BookService(db_session)
        await service.delete_book(sample_book.id)

        with pytest.raises(NotFoundException):
            await service.get_book(sample_book.id)

    async def test_delete_book_not_found(self, db_session):
        service = BookService(db_session)
        with pytest.raises(NotFoundException) as exc_info:
            await service.delete_book(99999)
        assert "Book" in str(exc_info.value.detail)

    async def test_search_books_no_filters(self, db_session, sample_book):
        service = BookService(db_session)
        params = BookSearchParams()
        result = await service.search_books(params, page=1, size=20)
        assert result.total >= 1
        assert len(result.items) >= 1
        assert any(book.id == sample_book.id for book in result.items)

    async def test_search_books_with_search_term(self, db_session, sample_book):
        service = BookService(db_session)
        params = BookSearchParams(search="Test Book")
        result = await service.search_books(params, page=1, size=20)
        assert result.total >= 1
        assert len(result.items) >= 1

    async def test_search_books_with_category(self, db_session, sample_book, sample_category):
        service = BookService(db_session)
        params = BookSearchParams(category_id=sample_category.id)
        result = await service.search_books(params, page=1, size=20)
        assert result.total >= 1
        assert any(book.id == sample_book.id for book in result.items)

    async def test_search_books_with_price_range(self, db_session, sample_book):
        service = BookService(db_session)
        params = BookSearchParams(min_price=Decimal("10.00"), max_price=Decimal("30.00"))
        result = await service.search_books(params, page=1, size=20)
        assert result.total >= 1

    async def test_search_books_in_stock(self, db_session, sample_book):
        service = BookService(db_session)
        params = BookSearchParams(in_stock=True)
        result = await service.search_books(params, page=1, size=20)
        assert result.total >= 1
        assert all(book.stock_quantity > 0 for book in result.items)

    async def test_search_books_pagination(self, db_session, sample_book):
        service = BookService(db_session)
        params = BookSearchParams()
        result = await service.search_books(params, page=1, size=5)
        assert result.page == 1
        assert result.size == 5
        assert len(result.items) <= 5

    async def test_search_books_sorting(self, db_session, sample_book):
        service = BookService(db_session)
        params = BookSearchParams(sort_by="price", sort_order="asc")
        result = await service.search_books(params, page=1, size=20)
        assert len(result.items) >= 1
        if len(result.items) > 1:
            for i in range(len(result.items) - 1):
                assert result.items[i].price <= result.items[i + 1].price
