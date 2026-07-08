from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.database.connection import get_db
from app.schemas.alert import AlertCreate, AlertResponse
from app.services.alert import AlertService
from app.utils.dependencies import require_admin

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])


@router.get("", response_model=List[AlertResponse])
async def get_alerts(
    lat: Optional[float] = Query(None),
    lng: Optional[float] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    service = AlertService(db)
    return await service.get_all(lat=lat, lng=lng)


@router.post("", response_model=AlertResponse, status_code=201)
async def create_alert(data: AlertCreate, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    service = AlertService(db)
    return await service.create(data)


@router.get("/history", response_model=List[AlertResponse])
async def get_alert_history(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    service = AlertService(db)
    return await service.get_history(limit=limit, offset=offset)
