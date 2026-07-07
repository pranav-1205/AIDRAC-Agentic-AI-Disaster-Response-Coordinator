from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.database.connection import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    message = Column(String(2000), nullable=False)
    disaster_id = Column(Integer, ForeignKey("disasters.id"), nullable=True)
    severity = Column(String(50), default="info")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    disaster = relationship("Disaster", backref="alerts")
