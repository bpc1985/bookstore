import pytest
from decimal import Decimal

from app.models.book import Book
from app.repositories.book import BookRepository


@pytest.mark.asyncio
class TestBookRepository:
    async def test_get_with_categories(self, db_session, sample_book, sample_category):
        repo = BookRepository(db_session)
        book = await repo.get_with_categories(sample_book.id)
        assert book is not None
        assert book.id == sample_book.id
        assert len(book.categories) > 0
        assert book.categories[0].id == sample_category.id

    async def test_get_with_categories_not_found(self, db_session):
        repo = BookRepository(db_session)
        book = await repo.get_with_categories(99999)
        assert book is None

    async def test_get_with_categories_deleted(self, db_session, sample_book):
        repo = BookRepository(db_session)
        await repo.soft_delete(sample_book)
        book = await repo.get_with_categories(sample_book.id)
        assert book is None

    async def test_get_by_isbn(self, db_session, sample_book):
        repo = BookRepository(db_session)
        book = await repo.get_by_isbn(sample_book.isbn)
        assert book is not None
        assert book.id == sample_book.id

    async def test_get_by_isbn_not_found(self, db_session):
        repo = BookRepository(db_session)
        book = await repo.get_by_isbn("9999999999999")
        assert book is None

    async def test_search_no_filters(self, db_session, sample_book):
        repo = BookRepository(db_session)
        books, total = await repo.search()
        assert total >= 1
        assert len(books) >= 1
        assert any(b.id == sample_book.id for b in books)

    async def test_search_by_title(self, db_session, sample_book):
        repo = BookRepository(db_session)
        books, total = await repo.search(search="Test Book")
        assert total >= 1
        assert len(books) >= 1
        assert books[0].id == sample_book.id

    async def test_search_by_author(self, db_session, sample_book):
        repo = BookRepository(db_session)
        books, total = await repo.search(search="Test Author")
        assert total >= 1
        assert books[0].id == sample_book.id

    async def test_search_by_category(self, db_session, sample_book, sample_category):
        repo = BookRepository(db_session)
        books, total = await repo.search(category_id=sample_category.id)
        assert total >= 1
        assert any(b.id == sample_book.id for b in books)

    async def test_search_by_min_price(self, db_session, sample_book):
        repo = BookRepository(db_session)
        books, total = await repo.search(min_price=Decimal("10.00"))
        assert total >= 1
        assert any(b.id == sample_book.id for b in books)

    async def test_search_by_max_price(self, db_session, sample_book):
        repo = BookRepository(db_session)
        books, total = await repo.search(max_price=Decimal("30.00"))
        assert total >= 1
        assert any(b.id == sample_book.id for b in books)

    async def test_search_in_stock(self, db_session, sample_book):
        repo = BookRepository(db_session)
        books, total = await repo.search(in_stock=True)
        assert total >= 1
        assert all(b.stock_quantity > 0 for b in books)

    async def test_search_out_of_stock(self, db_session, sample_book):
        repo = BookRepository(db_session)
        sample_book.stock_quantity = 0
        await db_session.commit()

        books, total = await repo.search(in_stock=True)
        assert sample_book.id not in [b.id for b in books]

    async def test_sort_by_price_asc(self, db_session, sample_book):
        repo = BookRepository(db_session)
        books, total = await repo.search(sort_by="price", sort_order="asc")
        assert len(books) >= 1
        if len(books) > 1:
            for i in range(len(books) - 1):
                assert books[i].price <= books[i + 1].price

    async def test_sort_by_price_desc(self, db_session, sample_book):
        repo = BookRepository(db_session)
        books, total = await repo.search(sort_by="price", sort_order="desc")
        assert len(books) >= 1
        if len(books) > 1:
            for i in range(len(books) - 1):
                assert books[i].price >= books[i + 1].price

    async def test_pagination_offset_limit(self, db_session, sample_book):
        repo = BookRepository(db_session)
        books, total = await repo.search(offset=0, limit=1)
        assert len(books) <= 1

    async def test_update_stock_increase(self, db_session, sample_book):
        repo = BookRepository(db_session)
        initial_stock = sample_book.stock_quantity
        updated_book = await repo.update_stock(sample_book.id, 5)
        assert updated_book.stock_quantity == initial_stock + 5

    async def test_update_stock_decrease(self, db_session, sample_book):
        repo = BookRepository(db_session)
        initial_stock = sample_book.stock_quantity
        updated_book = await repo.update_stock(sample_book.id, -3)
        assert updated_book.stock_quantity == initial_stock - 3

    async def test_update_stock_not_found(self, db_session):
        repo = BookRepository(db_session)
        updated_book = await repo.update_stock(99999, 10)
        assert updated_book is None

    async def test_soft_delete(self, db_session, sample_book):
        repo = BookRepository(db_session)
        deleted_book = await repo.soft_delete(sample_book)
        assert deleted_book.is_deleted is True

        found_book = await repo.get(sample_book.id)
        assert found_book.is_deleted is True

    async def test_soft_delete_excludes_from_search(self, db_session, sample_book):
        repo = BookRepository(db_session)
        await repo.soft_delete(sample_book)

        books, total = await repo.search()
        assert sample_book.id not in [b.id for b in books]
