from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database.connection import get_db
from app.schemas.hospital import HospitalCreate, HospitalResponse
from app.services.hospital import HospitalService
from app.utils.dependencies import require_admin

router = APIRouter(prefix="/api/hospitals", tags=["Hospitals"])


@router.get("", response_model=List[HospitalResponse])
async def get_hospitals(db: AsyncSession = Depends(get_db)):
    service = HospitalService(db)
    return await service.get_all()


@router.post("", response_model=HospitalResponse, status_code=201)
async def create_hospital(data: HospitalCreate, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    service = HospitalService(db)
    return await service.create(data)
