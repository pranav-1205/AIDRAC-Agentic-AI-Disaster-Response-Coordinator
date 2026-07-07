from fastapi import APIRouter, Depends
from app.schemas.user import UserResponse
from app.utils.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)
