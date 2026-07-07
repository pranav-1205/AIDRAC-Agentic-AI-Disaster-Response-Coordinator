from fastapi import APIRouter, Query
from app.services.weather import WeatherService

router = APIRouter(prefix="/api/weather", tags=["Weather"])


@router.get("")
async def get_weather(lat: float = Query(28.6139), lng: float = Query(77.2090)):
    service = WeatherService()
    return await service.get_current_weather(lat, lng)
