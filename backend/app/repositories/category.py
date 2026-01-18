from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category
from app.repositories.base import BaseRepository


class CategoryRepository(BaseRepository[Category]):
    def __init__(self, db: AsyncSession):
        super().__init__(Category, db)

    async def get_by_name(self, name: str) -> Category | None:
        result = await self.db.execute(select(Category).where(Category.name == name))
        return result.scalar_one_or_none()

    async def get_by_ids(self, ids: list[int]) -> list[Category]:
        if not ids:
            return []
        result = await self.db.execute(select(Category).where(Category.id.in_(ids)))
        return list(result.scalars().all())
