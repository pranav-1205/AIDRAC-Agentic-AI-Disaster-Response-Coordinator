from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database.connection import get_db
from app.schemas.shelter import ShelterCreate, ShelterUpdate, ShelterResponse
from app.services.shelter import ShelterService
from app.utils.dependencies import require_admin

router = APIRouter(prefix="/api/shelters", tags=["Shelters"])


@router.get("", response_model=List[ShelterResponse])
async def get_shelters(db: AsyncSession = Depends(get_db)):
    service = ShelterService(db)
    return await service.get_all()


@router.post("", response_model=ShelterResponse, status_code=201)
async def create_shelter(data: ShelterCreate, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    service = ShelterService(db)
    return await service.create(data)


@router.put("/{shelter_id}", response_model=ShelterResponse)
async def update_shelter(shelter_id: int, data: ShelterUpdate, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    service = ShelterService(db)
    return await service.update(shelter_id, data)


@router.delete("/{shelter_id}", status_code=204)
async def delete_shelter(shelter_id: int, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    service = ShelterService(db)
    await service.delete(shelter_id)
