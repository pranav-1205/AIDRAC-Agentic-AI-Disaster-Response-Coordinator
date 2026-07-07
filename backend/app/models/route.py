from sqlalchemy import Column, Integer, Float
from app.database.connection import Base


class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    source_lat = Column(Float, nullable=False)
    source_lng = Column(Float, nullable=False)
    destination_lat = Column(Float, nullable=False)
    destination_lng = Column(Float, nullable=False)
    estimated_time = Column(Float, nullable=True)
    distance_km = Column(Float, nullable=True)
