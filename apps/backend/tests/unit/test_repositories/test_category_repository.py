import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from decimal import Decimal
from datetime import datetime, timedelta

from app.repositories.category import CategoryRepository
from app.models.category import Category


@pytest.fixture
async def category_repository(db_session):
    return CategoryRepository(db_session)


@pytest.mark.asyncio
class TestCategoryRepository:
    async def test_create_category(self, db_session, category_repository):
        category_data = {
            "name": "New Category",
            "description": "New category description"
        }
        category = await category_repository.create(category_data)
        assert category.id is not None
        assert category.name == "New Category"
        assert category.description == "New category description"

    async def test_get_category_by_id(self, db_session, category_repository):
        category_data = {
            "name": "Get Test Category",
            "description": "Get test description"
        }
        created = await category_repository.create(category_data)

        found = await category_repository.get(created.id)
        assert found is not None
        assert found.id == created.id
        assert found.name == "Get Test Category"

    async def test_get_category_by_id_not_found(self, db_session, category_repository):
        found = await category_repository.get(99999)
        assert found is None

    async def test_get_by_name(self, db_session, category_repository):
        category_data = {
            "name": "Unique Name",
            "description": "Unique description"
        }
        await category_repository.create(category_data)

        found = await category_repository.get_by_name("Unique Name")
        assert found is not None
        assert found.name == "Unique Name"

    async def test_get_by_name_not_found(self, db_session, category_repository):
        found = await category_repository.get_by_name("NonExistent Category")
        assert found is None

    async def test_get_by_ids_single(self, db_session, category_repository, sample_category):
        categories = await category_repository.get_by_ids([sample_category.id])
        assert len(categories) == 1
        assert categories[0].id == sample_category.id

    async def test_get_by_ids_multiple(self, db_session, category_repository):
        cat1 = await category_repository.create({"name": "Cat 1", "description": "Desc 1"})
        cat2 = await category_repository.create({"name": "Cat 2", "description": "Desc 2"})

        categories = await category_repository.get_by_ids([cat1.id, cat2.id])
        assert len(categories) == 2
        ids = [cat.id for cat in categories]
        assert cat1.id in ids
        assert cat2.id in ids

    async def test_get_by_ids_empty_list(self, db_session, category_repository):
        categories = await category_repository.get_by_ids([])
        assert len(categories) == 0

    async def test_get_by_ids_nonexistent(self, db_session, category_repository):
        categories = await category_repository.get_by_ids([99999, 99998])
        assert len(categories) == 0

    async def test_get_all(self, db_session, category_repository):
        initial = await category_repository.get_all()
        initial_count = len(initial)

        await category_repository.create({"name": "Test 1", "description": "Desc 1"})
        await category_repository.create({"name": "Test 2", "description": "Desc 2"})

        all_categories = await category_repository.get_all()
        assert len(all_categories) == initial_count + 2

    async def test_update_category(self, db_session, category_repository):
        category = await category_repository.create({
            "name": "Original Name",
            "description": "Original Description"
        })

        updated = await category_repository.update(category, {"description": "Updated Description"})
        assert updated.id == category.id
        assert updated.name == "Original Name"
        assert updated.description == "Updated Description"

    async def test_update_with_none(self, db_session, category_repository):
        category = await category_repository.create({
            "name": "Test Name",
            "description": "Original Description"
        })

        updated = await category_repository.update(category, {"description": None})
        assert updated.description == "Original Description"

    async def test_delete_category(self, db_session, category_repository):
        category = await category_repository.create({
            "name": "Delete Me",
            "description": "Delete Description"
        })
        category_id = category.id

        await category_repository.delete(category)
        found = await category_repository.get(category_id)
        assert found is None

    async def test_count(self, db_session, category_repository):
        initial = await category_repository.count()

        await category_repository.create({"name": "Count Test", "description": "Count Desc"})

        new_count = await category_repository.count()
        assert new_count == initial + 1
