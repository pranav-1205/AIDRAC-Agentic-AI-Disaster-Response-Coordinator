from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database.connection import get_db
from app.schemas.disaster import DisasterCreate, DisasterResponse
from app.services.disaster import DisasterService
from app.utils.dependencies import require_admin

router = APIRouter(prefix="/api/disasters", tags=["Disasters"])


@router.get("", response_model=List[DisasterResponse])
async def get_disasters(db: AsyncSession = Depends(get_db)):
    service = DisasterService(db)
    return await service.get_all()


@router.get("/active", response_model=List[DisasterResponse])
async def get_active_disasters(db: AsyncSession = Depends(get_db)):
    service = DisasterService(db)
    return await service.get_active()


@router.post("", response_model=DisasterResponse, status_code=201)
async def create_disaster(data: DisasterCreate, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    service = DisasterService(db)
    return await service.create(data)
