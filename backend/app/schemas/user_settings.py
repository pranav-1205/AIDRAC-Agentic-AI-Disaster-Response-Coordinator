from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class UserSettingsResponse(BaseModel):
    id: int
    user_id: int
    theme: str = "dark"
    accent_color: str = "sapphire"
    notifications_enabled: bool = True
    email_notifications: bool = True
    push_notifications: bool = True
    sound_alerts: bool = True
    emergency_radius: int = 25
    min_alert_severity: str = "info"
    default_map_type: str = "standard"
    auto_locate: bool = True
    show_gov_alerts: bool = True
    show_user_disasters: bool = True
    larger_text: bool = False
    reduced_motion: bool = False

    class Config:
        from_attributes = True


class UserSettingsUpdate(BaseModel):
    theme: Optional[str] = None
    accent_color: Optional[str] = None
    notifications_enabled: Optional[bool] = None
    email_notifications: Optional[bool] = None
    push_notifications: Optional[bool] = None
    sound_alerts: Optional[bool] = None
    emergency_radius: Optional[int] = None
    min_alert_severity: Optional[str] = None
    default_map_type: Optional[str] = None
    auto_locate: Optional[bool] = None
    show_gov_alerts: Optional[bool] = None
    show_user_disasters: Optional[bool] = None
    larger_text: Optional[bool] = None
    reduced_motion: Optional[bool] = None
