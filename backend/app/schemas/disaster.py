from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class DisasterCreate(BaseModel):
    type: str = Field(..., min_length=1, max_length=100)
    severity: str = Field(..., min_length=1, max_length=50)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    description: Optional[str] = None
    status: str = "active"


class DisasterResponse(BaseModel):
    id: int
    type: str
    severity: str
    latitude: float
    longitude: float
    description: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
