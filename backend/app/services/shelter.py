from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.models.shelter import Shelter
from app.schemas.shelter import ShelterCreate, ShelterUpdate


class ShelterService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self) -> list[Shelter]:
        result = await self.db.execute(select(Shelter).order_by(Shelter.id))
        return list(result.scalars().all())

    async def get_by_id(self, shelter_id: int) -> Shelter:
        result = await self.db.execute(select(Shelter).where(Shelter.id == shelter_id))
        shelter = result.scalar_one_or_none()
        if not shelter:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shelter not found")
        return shelter

    async def create(self, data: ShelterCreate) -> Shelter:
        shelter = Shelter(**data.model_dump())
        self.db.add(shelter)
        await self.db.flush()
        await self.db.refresh(shelter)
        return shelter

    async def update(self, shelter_id: int, data: ShelterUpdate) -> Shelter:
        shelter = await self.get_by_id(shelter_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(shelter, field, value)
        await self.db.flush()
        await self.db.refresh(shelter)
        return shelter

    async def delete(self, shelter_id: int) -> None:
        shelter = await self.get_by_id(shelter_id)
        await self.db.delete(shelter)
        await self.db.flush()
