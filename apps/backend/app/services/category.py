from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate
from app.repositories.category import CategoryRepository
from app.exceptions import NotFoundException, ConflictException


class CategoryService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.category_repo = CategoryRepository(db)

    async def create_category(self, category_data: CategoryCreate) -> Category:
        existing = await self.category_repo.get_by_name(category_data.name)
        if existing:
            raise ConflictException("Category with this name already exists")

        return await self.category_repo.create(category_data.model_dump())

    async def get_category(self, category_id: int) -> Category:
        category = await self.category_repo.get(category_id)
        if not category:
            raise NotFoundException("Category")
        return category

    async def get_all_categories(self) -> list[Category]:
        return list(await self.category_repo.get_all(limit=1000))

    async def update_category(self, category_id: int, category_data: CategoryUpdate) -> Category:
        category = await self.category_repo.get(category_id)
        if not category:
            raise NotFoundException("Category")

        if category_data.name:
            existing = await self.category_repo.get_by_name(category_data.name)
            if existing and existing.id != category_id:
                raise ConflictException("Category with this name already exists")

        update_data = category_data.model_dump(exclude_unset=True)
        return await self.category_repo.update(category, update_data)

    async def delete_category(self, category_id: int) -> None:
        category = await self.category_repo.get(category_id)
        if not category:
            raise NotFoundException("Category")
        await self.category_repo.delete(category)
