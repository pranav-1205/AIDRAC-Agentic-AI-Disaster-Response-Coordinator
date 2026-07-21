from pydantic import BaseModel


class RiskComponentBreakdown(BaseModel):
    weather_score: int = 0
    alert_score: int = 0
    disaster_score: int = 0
    infrastructure_score: int = 0


class RiskAssessmentResponse(BaseModel):
    user_risk: str
    regional_alert_severity: str
    reason: str
    evacuation_required: bool = False
    inside_alert_polygon: bool = False
    nearby_alerts: int = 0
    regional_alert_count: int = 0
    components: RiskComponentBreakdown = RiskComponentBreakdown()
