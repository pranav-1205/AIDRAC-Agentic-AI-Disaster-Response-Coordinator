from typing import Any
from app.services.weather import WeatherService
from app.services.location_service import LocationService
from app.database.connection import async_session_factory
from app.models import Disaster, Alert


class ContextBuilder:
    def __init__(self):
        self._weather = WeatherService()
        self._location = LocationService()

    async def build(
        self,
        question: str,
        lat: float | None = None,
        lng: float | None = None,
    ) -> str:
        parts: list[str] = []
        parts.append(f"User Question: {question}\n")

        if lat is not None and lng is not None:
            parts.append(f"User Location: {lat:.4f}, {lng:.4f}\n")

            try:
                weather = await self._weather.get_current_weather(lat, lng)
                parts.append(
                    f"Weather: {weather.get('temperature', 'N/A')}°C, "
                    f"{weather.get('description', 'N/A')}, "
                    f"humidity {weather.get('humidity', 'N/A')}%, "
                    f"wind {weather.get('wind_speed', 'N/A')} m/s, "
                    f"rain {weather.get('rain', 0)} mm/h\n"
                )
            except Exception:
                parts.append("Weather: unavailable\n")

            try:
                nearby = await self._location.get_nearby_hospitals(lat, lng)
                nearby += await self._location.get_nearby_shelters(lat, lng)
                nearby += await self._location.get_nearby_community_centres(lat, lng)
                nearby += await self._location.get_nearby_schools(lat, lng)
                nearby += await self._location.get_nearby_police(lat, lng)
                nearby += await self._location.get_nearby_firestations(lat, lng)
                nearby += await self._location.get_nearby_pharmacies(lat, lng)
                nearby = sorted(nearby, key=lambda x: x.get("distance", 9999))

                cats = {
                    "hospitals": await self._location.get_nearby_hospitals(lat, lng),
                    "shelters": await self._location.get_nearby_shelters(lat, lng),
                    "community_centres": await self._location.get_nearby_community_centres(lat, lng),
                    "schools": await self._location.get_nearby_schools(lat, lng),
                    "police": await self._location.get_nearby_police(lat, lng),
                    "firestations": await self._location.get_nearby_firestations(lat, lng),
                    "pharmacies": await self._location.get_nearby_pharmacies(lat, lng),
                }
                nearby_lines = ["Nearby Infrastructure:"]
                for cat_name, items in cats.items():
                    if items:
                        nearest = items[0]
                        nearby_lines.append(
                            f"  - {cat_name}: {len(items)} found, "
                            f"nearest: {nearest.get('name', 'Unknown')} "
                            f"({nearest.get('distance', '?')} km)"
                        )
                    else:
                        nearby_lines.append(f"  - {cat_name}: none found")
                parts.append("\n".join(nearby_lines) + "\n")
            except Exception:
                parts.append("Nearby Infrastructure: unavailable\n")
        else:
            parts.append("User Location: not provided\n")

        try:
            async with async_session_factory() as session:
                from sqlalchemy import select

                result = await session.execute(select(Disaster).where(Disaster.status == "active"))
                disasters = result.scalars().all()
                if disasters:
                    parts.append(f"Active Disasters ({len(disasters)}):\n")
                    for d in disasters:
                        parts.append(
                            f"  - {d.type} (severity: {d.severity}, "
                            f"lat: {d.latitude:.4f}, lng: {d.longitude:.4f})\n"
                        )
                else:
                    parts.append("Active Disasters: none\n")

                result = await session.execute(
                    select(Alert).order_by(Alert.created_at.desc()).limit(10)
                )
                alerts = result.scalars().all()
                if alerts:
                    parts.append(f"Recent Alerts ({len(alerts)}):\n")
                    for a in alerts:
                        parts.append(
                            f"  - [{a.severity}] {a.title}: {a.message[:100]}\n"
                        )
                else:
                    parts.append("Alerts: none\n")
        except Exception:
            parts.append("Disasters/Alerts: unavailable\n")

        return "".join(parts)
