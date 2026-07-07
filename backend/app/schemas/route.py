from pydantic import BaseModel, Field
from typing import Optional


class RouteCreate(BaseModel):
    source_lat: float = Field(..., ge=-90, le=90)
    source_lng: float = Field(..., ge=-180, le=180)
    destination_lat: float = Field(..., ge=-90, le=90)
    destination_lng: float = Field(..., ge=-180, le=180)
    estimated_time: Optional[float] = None
    distance_km: Optional[float] = None


class RouteResponse(BaseModel):
    id: int
    source_lat: float
    source_lng: float
    destination_lat: float
    destination_lng: float
    estimated_time: Optional[float] = None
    distance_km: Optional[float] = None

    class Config:
        from_attributes = True
