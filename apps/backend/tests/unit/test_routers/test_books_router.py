import pytest
from decimal import Decimal


@pytest.mark.asyncio
class TestBooksRouter:
    async def test_get_books_list(self, client, sample_book_for_router):
        response = await client.get("/books")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert data["total"] >= 1
        assert len(data["items"]) >= 1

    async def test_get_book_by_id(self, client, sample_book_for_router):
        response = await client.get(f"/books/{sample_book_for_router.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == sample_book_for_router.id
        assert data["title"] == sample_book_for_router.title

    async def test_get_book_not_found(self, client):
        response = await client.get("/books/99999")
        assert response.status_code == 404

    async def test_search_books_by_title(self, client, sample_book_for_router):
        response = await client.get(f"/books?search=Router Test Book")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1

    async def test_search_books_by_author(self, client, sample_book_for_router):
        response = await client.get(f"/books?search=Router Test Author")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1

    async def test_search_books_by_category(self, client, sample_book_for_router, sample_category):
        response = await client.get(f"/books?category_id={sample_category.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1

    async def test_search_books_by_price_range(self, client):
        response = await client.get("/books?min_price=10.00&max_price=30.00")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 0

    async def test_search_books_in_stock(self, client):
        response = await client.get("/books?in_stock=true")
        assert response.status_code == 200
        data = response.json()
        assert all(item["stock_quantity"] > 0 for item in data["items"])

    async def test_pagination(self, client, sample_book_for_router):
        response = await client.get("/books?page=1&size=5")
        assert response.status_code == 200
        data = response.json()
        assert data["page"] == 1
        assert data["size"] == 5
        assert len(data["items"]) <= 5

    async def test_create_book_unauthorized(self, client):
        response = await client.post(
            "/books",
            json={
                "title": "Unauthorized Book",
                "author": "Test Author",
                "isbn": "1111111111111",
                "price": 19.99
            }
        )
        assert response.status_code == 403

    async def test_create_book_as_user(self, client, auth_headers):
        response = await client.post(
            "/books",
            headers=auth_headers,
            json={
                "title": "User Created Book",
                "author": "Test Author",
                "isbn": "2222222222222",
                "price": 19.99
            }
        )
        assert response.status_code == 403

    async def test_update_book_unauthorized(self, client, sample_book_for_router):
        response = await client.put(
            f"/books/{sample_book_for_router.id}",
            json={"title": "Updated Title"}
        )
        assert response.status_code == 403

    async def test_delete_book_unauthorized(self, client, sample_book_for_router):
        response = await client.delete(f"/books/{sample_book_for_router.id}")
        assert response.status_code == 403
