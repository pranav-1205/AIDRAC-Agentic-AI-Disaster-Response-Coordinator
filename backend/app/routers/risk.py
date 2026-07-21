from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import async_session_factory
from app.schemas.risk import RiskAssessmentResponse
from app.services.risk_assessment_service import RiskAssessmentService
from app.services.weather import WeatherService
from app.services.alert import AlertService
from app.services.disaster import DisasterService

router = APIRouter(prefix="/api/risk", tags=["Risk"])
_risk_service = RiskAssessmentService()
_weather_service = WeatherService()


@router.get("")
async def get_risk(
    lat: float = Query(...),
    lng: float = Query(...),
) -> RiskAssessmentResponse:
    weather = None
    try:
        weather = await _weather_service.get_current_weather(lat, lng)
    except Exception:
        pass

    async with async_session_factory() as db:
        alert_service = AlertService(db)
        disaster_service = DisasterService(db)
        alerts = await alert_service.get_all(lat=lat, lng=lng, all_alerts=False)
        disasters = await disaster_service.get_active()

    return _risk_service.evaluate(
        lat=lat,
        lng=lng,
        weather=weather,
        alerts=alerts,
        disasters=disasters,
    )
