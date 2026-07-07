from sqlalchemy import Column, Integer, String, Float, Boolean
from app.database.connection import Base


class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    emergency_available = Column(Boolean, default=True)
    phone = Column(String(20), nullable=True)
    address = Column(String(500), nullable=True)
