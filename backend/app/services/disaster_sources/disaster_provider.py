from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any


@dataclass
class DisasterData:
    type: str
    severity: str
    latitude: float
    longitude: float
    description: str | None = None
    status: str = "active"


class DisasterProvider(ABC):
    @abstractmethod
    async def get_disasters(self) -> list[DisasterData]:
        ...


class StaticDisasterProvider(DisasterProvider):
    """Development-only provider using manually seeded disaster records."""

    async def get_disasters(self) -> list[DisasterData]:
        return [
            DisasterData(type="Flood", severity="critical", latitude=28.6000, longitude=77.1900, description="Severe flooding in low-lying areas of South Delhi. Water levels rising rapidly.", status="active"),
            DisasterData(type="Cyclone", severity="severe", latitude=28.6300, longitude=77.2700, description="Cyclone approaching Eastern Delhi. High-speed winds expected.", status="active"),
            DisasterData(type="Earthquake", severity="moderate", latitude=28.5800, longitude=77.2400, description="Moderate earthquake tremors felt across the region. Aftershocks possible.", status="active"),
            DisasterData(type="Flood", severity="high", latitude=28.6200, longitude=77.2100, description="Flooding in Yamuna river basin areas. Evacuation recommended.", status="active"),
            DisasterData(type="Fire", severity="critical", latitude=28.6100, longitude=77.2500, description="Major fire in industrial area. Toxic smoke spreading.", status="contained"),
        ]
