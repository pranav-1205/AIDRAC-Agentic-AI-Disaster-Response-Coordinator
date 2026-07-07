from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.connection import get_db
from app.schemas.user import UserCreate, UserLogin, UserResponse, TokenResponse
from app.services.auth import AuthService
from app.utils.security import create_access_token

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    user = await service.register(data)
    token = create_access_token({"sub": str(user.id), "role": user.role.value if hasattr(user.role, 'value') else user.role})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    user = await service.login(data.email, data.password)
    token = create_access_token({"sub": str(user.id), "role": user.role.value if hasattr(user.role, 'value') else user.role})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))
