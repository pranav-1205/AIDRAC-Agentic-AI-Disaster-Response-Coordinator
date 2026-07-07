from sqlalchemy import Column, Integer, String, Float, DateTime, func
from app.database.connection import Base


class Disaster(Base):
    __tablename__ = "disasters"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(100), nullable=False)
    severity = Column(String(50), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    description = Column(String(1000), nullable=True)
    status = Column(String(50), default="active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
