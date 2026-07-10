from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class WeatherData:
    temperature: float
    humidity: float
    wind_speed: float
    rain: float
    clouds: int
    city: str
    lat: float
    lng: float
    description: str = ""
    icon: str = ""


@dataclass
class AlertData:
    external_id: str
    event: str
    headline: str
    description: str
    severity: str
    urgency: str
    certainty: str
    area: str
    effective: str | None = None
    expires: str | None = None
    polygons: list[str] | None = None
    source: str = "cap"


class WeatherProvider(ABC):
    @abstractmethod
    async def get_weather(self, lat: float, lng: float) -> WeatherData:
        ...


class AlertProvider(ABC):
    @abstractmethod
    async def get_alerts(self) -> list[AlertData]:
        ...
