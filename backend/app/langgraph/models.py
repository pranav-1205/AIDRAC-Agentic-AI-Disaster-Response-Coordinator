from pydantic import BaseModel
from typing import Optional


class LocationState(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class WeatherState(BaseModel):
    temperature: Optional[float] = None
    feels_like: Optional[float] = None
    humidity: Optional[float] = None
    wind_speed: Optional[float] = None
    rain: Optional[float] = None
    description: Optional[str] = None
    city: Optional[str] = None
    risk_level: Optional[str] = None


class AlertItem(BaseModel):
    id: Optional[str] = None
    event: Optional[str] = None
    severity: Optional[str] = None
    headline: Optional[str] = None
    description: Optional[str] = None
    area: Optional[str] = None
    source: Optional[str] = None


class AlertState(BaseModel):
    alerts: list[AlertItem] = []
    total_alerts: int = 0
    highest_severity: Optional[str] = None


class InfrastructureItem(BaseModel):
    name: str = ""
    latitude: float = 0.0
    longitude: float = 0.0
    distance: Optional[float] = None
    address: Optional[str] = None


class InfrastructureState(BaseModel):
    hospitals: list[InfrastructureItem] = []
    shelters: list[InfrastructureItem] = []
    community_centres: list[InfrastructureItem] = []
    schools: list[InfrastructureItem] = []
    police: list[InfrastructureItem] = []
    firestations: list[InfrastructureItem] = []
    pharmacies: list[InfrastructureItem] = []


class DestinationState(BaseModel):
    destination_type: Optional[str] = None
    destination: Optional[InfrastructureItem] = None


class RouteState(BaseModel):
    distance_km: Optional[float] = None
    duration_min: Optional[float] = None
    provider: Optional[str] = None
    directions: list[str] = []
    coordinates: list[list[float]] = []


class RecommendationState(BaseModel):
    summary: Optional[str] = None
    actions: list[str] = []
    risk_level: Optional[str] = None
    reasoning: Optional[str] = None
    recommended_destination: Optional[str] = None
    source: str = "fallback"
