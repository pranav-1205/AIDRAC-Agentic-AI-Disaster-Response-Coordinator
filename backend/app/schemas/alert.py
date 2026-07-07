from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class AlertCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    message: str = Field(..., min_length=1)
    disaster_id: Optional[int] = None
    severity: str = "info"


class AlertResponse(BaseModel):
    id: int
    title: str
    message: str
    disaster_id: Optional[int] = None
    severity: str
    created_at: datetime

    class Config:
        from_attributes = True
