from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.alert import Alert
from app.schemas.alert import AlertCreate


class AlertService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self) -> list[Alert]:
        result = await self.db.execute(select(Alert).order_by(Alert.created_at.desc()))
        return list(result.scalars().all())

    async def get_active(self) -> list[Alert]:
        result = await self.db.execute(
            select(Alert)
            .join(Alert.disaster, isouter=True)
            .order_by(Alert.created_at.desc())
        )
        return list(result.scalars().all())

    async def create(self, data: AlertCreate) -> Alert:
        alert = Alert(**data.model_dump())
        self.db.add(alert)
        await self.db.flush()
        await self.db.refresh(alert)
        return alert
