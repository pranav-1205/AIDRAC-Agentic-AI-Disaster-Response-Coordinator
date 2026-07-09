from pydantic import BaseModel
from typing import Optional

from app.langgraph.models import (
    LocationState,
    WeatherState,
    AlertState,
    InfrastructureState,
    DestinationState,
    RouteState,
    RecommendationState,
)


class AgentState(BaseModel):
    user_question: str = ""
    location: Optional[LocationState] = None
    weather: Optional[WeatherState] = None
    alerts: Optional[AlertState] = None
    infrastructure: Optional[InfrastructureState] = None
    destination: Optional[DestinationState] = None
    route: Optional[RouteState] = None
    recommendation: Optional[RecommendationState] = None
