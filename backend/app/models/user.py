from sqlalchemy import Column, Integer, String, Enum as SAEnum, Float, DateTime, Boolean, func, BigInteger, text
from app.database.connection import Base
import enum


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    USER = "user"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), default=UserRole.USER, nullable=False)
    last_latitude = Column(Float, nullable=True)
    last_longitude = Column(Float, nullable=True)
    location_accuracy = Column(Float, nullable=True)
    last_location_update = Column(DateTime(timezone=True), nullable=True)
    location_timestamp = Column(BigInteger, nullable=True)
    location_visibility = Column(Boolean, default=True, server_default=text("true"), nullable=False)
    is_online = Column(Boolean, default=False, server_default=text("false"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
