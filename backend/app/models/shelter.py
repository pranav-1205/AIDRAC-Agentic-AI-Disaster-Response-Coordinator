from sqlalchemy import Column, Integer, String, Float
from app.database.connection import Base


class Shelter(Base):
    __tablename__ = "shelters"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    capacity = Column(Integer, nullable=False)
    occupancy = Column(Integer, default=0)
    phone = Column(String(20), nullable=True)
    address = Column(String(500), nullable=True)
