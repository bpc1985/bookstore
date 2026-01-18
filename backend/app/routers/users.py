from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate
from app.dependencies import get_current_active_user
from app.repositories.user import UserRepository
from app.utils.security import get_password_hash

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_active_user),
):
    """Get current user's profile."""
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_current_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Update current user's profile."""
    user_repo = UserRepository(db)
    update_data = {}

    if user_update.full_name is not None:
        update_data["full_name"] = user_update.full_name

    if user_update.password is not None:
        update_data["hashed_password"] = get_password_hash(user_update.password)

    if update_data:
        current_user = await user_repo.update(current_user, update_data)

    return current_user
