from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.models.disaster import Disaster
from app.schemas.disaster import DisasterCreate


class DisasterService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self) -> list[Disaster]:
        result = await self.db.execute(select(Disaster).order_by(Disaster.created_at.desc()))
        return list(result.scalars().all())

    async def get_active(self) -> list[Disaster]:
        result = await self.db.execute(
            select(Disaster).where(Disaster.status == "active").order_by(Disaster.created_at.desc())
        )
        return list(result.scalars().all())

    async def create(self, data: DisasterCreate) -> Disaster:
        disaster = Disaster(**data.model_dump())
        self.db.add(disaster)
        await self.db.flush()
        await self.db.refresh(disaster)
        return disaster
