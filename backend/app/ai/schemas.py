from pydantic import BaseModel


class AIRecommendationRequest(BaseModel):
    question: str
    lat: float | None = None
    lng: float | None = None


class RecommendedDestination(BaseModel):
    type: str
    name: str


class AIRecommendationResponse(BaseModel):
    riskLevel: str
    summary: str
    recommendedDestination: RecommendedDestination | None = None
    reason: str
    actions: list[str]
