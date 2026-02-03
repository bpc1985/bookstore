import pytest
from app.utils.pagination import PaginationParams, PaginatedResponse


class TestPaginationParams:
    def test_default_values(self):
        params = PaginationParams()
        assert params.page == 1
        assert params.size == 20

    def test_custom_values(self):
        params = PaginationParams(page=3, size=50)
        assert params.page == 3
        assert params.size == 50

    def test_offset_first_page(self):
        params = PaginationParams(page=1, size=20)
        assert params.offset == 0

    def test_offset_second_page(self):
        params = PaginationParams(page=2, size=20)
        assert params.offset == 20

    def test_offset_third_page(self):
        params = PaginationParams(page=3, size=10)
        assert params.offset == 20

    def test_offset_custom_page_size(self):
        params = PaginationParams(page=5, size=100)
        assert params.offset == 400


class TestPaginatedResponse:
    def test_create_empty_response(self):
        response = PaginatedResponse.create(items=[], total=0, page=1, size=20)
        assert response.items == []
        assert response.total == 0
        assert response.page == 1
        assert response.size == 20
        assert response.pages == 0

    def test_create_response_with_items(self):
        items = ["item1", "item2", "item3"]
        response = PaginatedResponse.create(items=items, total=10, page=1, size=20)
        assert response.items == items
        assert response.total == 10
        assert response.page == 1
        assert response.size == 20
        assert response.pages == 1

    def test_pages_calculation_exactly_one_page(self):
        response = PaginatedResponse.create(items=[1, 2], total=2, page=1, size=2)
        assert response.pages == 1

    def test_pages_calculation_exactly_full_pages(self):
        response = PaginatedResponse.create(items=[1, 2], total=10, page=1, size=5)
        assert response.pages == 2

    def test_pages_calculation_partial_last_page(self):
        response = PaginatedResponse.create(items=[1, 2, 3], total=23, page=1, size=10)
        assert response.pages == 3

    def test_pages_calculation_single_item(self):
        response = PaginatedResponse.create(items=[1], total=1, page=1, size=20)
        assert response.pages == 1

    def test_pages_calculation_large_total(self):
        response = PaginatedResponse.create(items=[], total=1000, page=1, size=25)
        assert response.pages == 40

    def test_create_preserves_page_info(self):
        response = PaginatedResponse.create(items=[1], total=50, page=3, size=10)
        assert response.page == 3
        assert response.size == 10

    def test_create_with_zero_size(self):
        response = PaginatedResponse.create(items=[1, 2], total=10, page=1, size=0)
        assert response.pages == 0
