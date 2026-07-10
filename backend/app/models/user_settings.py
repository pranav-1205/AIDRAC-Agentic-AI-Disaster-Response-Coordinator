from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database.connection import Base


class UserSettings(Base):
    __tablename__ = "user_settings"
    __table_args__ = (UniqueConstraint("user_id", name="uq_user_settings"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    theme = Column(String(20), default="dark")
    accent_color = Column(String(20), default="sapphire")
    notifications_enabled = Column(Boolean, default=True)
    email_notifications = Column(Boolean, default=True)
    push_notifications = Column(Boolean, default=True)
    sound_alerts = Column(Boolean, default=True)
    emergency_radius = Column(Integer, default=25)
    min_alert_severity = Column(String(20), default="info")
    default_map_type = Column(String(20), default="standard")
    auto_locate = Column(Boolean, default=True)
    show_gov_alerts = Column(Boolean, default=True)
    show_user_disasters = Column(Boolean, default=True)
    larger_text = Column(Boolean, default=False)
    reduced_motion = Column(Boolean, default=False)

    user = relationship("User", backref="settings")
