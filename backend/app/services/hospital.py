from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.models.hospital import Hospital
from app.schemas.hospital import HospitalCreate


class HospitalService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self) -> list[Hospital]:
        result = await self.db.execute(select(Hospital).order_by(Hospital.id))
        return list(result.scalars().all())

    async def get_by_id(self, hospital_id: int) -> Hospital:
        result = await self.db.execute(select(Hospital).where(Hospital.id == hospital_id))
        hospital = result.scalar_one_or_none()
        if not hospital:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hospital not found")
        return hospital

    async def create(self, data: HospitalCreate) -> Hospital:
        hospital = Hospital(**data.model_dump())
        self.db.add(hospital)
        await self.db.flush()
        await self.db.refresh(hospital)
        return hospital
