from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime, func
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

    disaster = relationship("Disaster", backref="alerts")
