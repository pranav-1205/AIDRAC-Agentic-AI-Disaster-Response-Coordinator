from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database.connection import get_db
from app.schemas.alert import AlertCreate, AlertResponse
from app.services.alert import AlertService
from app.utils.dependencies import require_admin

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])


@router.get("", response_model=List[AlertResponse])
async def get_alerts(db: AsyncSession = Depends(get_db)):
    service = AlertService(db)
    return await service.get_all()


@router.post("", response_model=AlertResponse, status_code=201)
async def create_alert(data: AlertCreate, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    service = AlertService(db)
    return await service.create(data)
