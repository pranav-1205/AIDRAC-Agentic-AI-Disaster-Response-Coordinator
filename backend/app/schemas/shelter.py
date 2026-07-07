from pydantic import BaseModel, Field
from typing import Optional


class ShelterCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    capacity: int = Field(..., gt=0)
    occupancy: int = Field(0, ge=0)
    phone: Optional[str] = None
    address: Optional[str] = None


class ShelterUpdate(BaseModel):
    name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    capacity: Optional[int] = None
    occupancy: Optional[int] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class ShelterResponse(BaseModel):
    id: int
    name: str
    latitude: float
    longitude: float
    capacity: int
    occupancy: int
    phone: Optional[str] = None
    address: Optional[str] = None

    class Config:
        from_attributes = True
