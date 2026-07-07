import httpx
from typing import Optional
from app.config.settings import settings


class WeatherService:
    BASE_URL = "https://api.openweathermap.org/data/2.5"

    async def get_current_weather(self, lat: float, lng: float) -> dict:
        if not settings.OPENWEATHER_API_KEY:
            return {
                "temperature": 32,
                "feels_like": 35,
                "humidity": 75,
                "description": "Partly cloudy",
                "wind_speed": 12,
                "rain": 0,
                "icon": "04d",
                "city": "Sample City",
                "is_mock": True,
            }

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/weather",
                params={
                    "lat": lat,
                    "lon": lng,
                    "appid": settings.OPENWEATHER_API_KEY,
                    "units": "metric",
                },
            )
            response.raise_for_status()
            data = response.json()
            rain = 0
            if "rain" in data:
                rain = data["rain"].get("1h", data["rain"].get("3h", 0))
            return {
                "temperature": data["main"]["temp"],
                "feels_like": data["main"]["feels_like"],
                "humidity": data["main"]["humidity"],
                "description": data["weather"][0]["description"],
                "wind_speed": data["wind"]["speed"],
                "rain": rain,
                "icon": data["weather"][0]["icon"],
                "city": data["name"],
                "is_mock": False,
            }
