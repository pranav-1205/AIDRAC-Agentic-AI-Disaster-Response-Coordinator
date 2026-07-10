from app.services.weather import WeatherService
from app.services.disaster_sources.base import WeatherProvider, WeatherData


class OpenWeatherProvider(WeatherProvider):
    def __init__(self) -> None:
        self._inner = WeatherService()

    async def get_weather(self, lat: float, lng: float) -> WeatherData:
        raw = await self._inner.get_current_weather(lat, lng)
        return WeatherData(
            temperature=raw.get("temperature", 0.0),
            humidity=float(raw.get("humidity", 0)),
            wind_speed=float(raw.get("wind_speed", 0)),
            rain=float(raw.get("rain", 0)),
            clouds=0,
            city=raw.get("city", ""),
            lat=lat,
            lng=lng,
            description=raw.get("description", ""),
            icon=raw.get("icon", ""),
        )
