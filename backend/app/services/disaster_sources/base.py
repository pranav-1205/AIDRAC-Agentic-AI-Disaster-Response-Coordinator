from abc import ABC, abstractmethod
from dataclasses import dataclass, field
import re
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
    # The RSS publication time (or CAP <sent> as a fallback), not the time our
    # ingestion job happened to retrieve the alert.
    published_at: str | None = None
    effective: str | None = None
    expires: str | None = None
    polygons: list[str] | None = None
    source: str = "cap"


_NDMA_IDENTIFIER_TARGET_SUFFIX = re.compile(r"^(IN-\d+)_\d+$")


def canonical_alert_id(external_id: str) -> str:
    """Return the stable identifier for CAP alerts duplicated by NDMA targets."""
    match = _NDMA_IDENTIFIER_TARGET_SUFFIX.fullmatch(external_id.strip())
    return match.group(1) if match else external_id.strip()


class WeatherProvider(ABC):
    @abstractmethod
    async def get_weather(self, lat: float, lng: float) -> WeatherData:
        ...


class AlertProvider(ABC):
    @abstractmethod
    async def get_alerts(self) -> list[AlertData]:
        ...
