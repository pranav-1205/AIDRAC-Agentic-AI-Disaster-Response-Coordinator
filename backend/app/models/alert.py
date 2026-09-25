from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime, func, Float, BigInteger
from sqlalchemy.orm import relationship
from app.database.connection import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    disaster_id = Column(Integer, ForeignKey("disasters.id"), nullable=True)
    severity = Column(String(50), default="info")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    external_id = Column(String(255), unique=True, nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    event = Column(String(255), nullable=True)
    urgency = Column(String(50), nullable=True)
    certainty = Column(String(50), nullable=True)
    area = Column(String(500), nullable=True)

    is_active = Column(Boolean, default=True, nullable=False)
    expired_at = Column(DateTime(timezone=True), nullable=True)
    polygons = Column(Text, nullable=True)
    source = Column(String(50), nullable=True)

    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    accuracy = Column(Float, nullable=True)
    timestamp = Column(BigInteger, nullable=True)
    location_source = Column(String(30), nullable=True)

    disaster = relationship("Disaster", backref="alerts")
    locations = relationship(
        "AlertLocation",
        back_populates="alert",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
