from pydantic import BaseModel, Field
from typing import Optional


class HospitalCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    emergency_available: bool = True
    phone: Optional[str] = None
    address: Optional[str] = None


class HospitalResponse(BaseModel):
    id: int
    name: str
    latitude: float
    longitude: float
    emergency_available: bool
    phone: Optional[str] = None
    address: Optional[str] = None

    class Config:
        from_attributes = True
