from fastapi import APIRouter
from app.ai.schemas import AIRecommendationRequest
from app.services.incident_service import IncidentService

# NOTE: ContextBuilder and AIService are no longer invoked directly by the router.
# The production recommendation flow now routes through IncidentService, which
# delegates to the LangGraph multi-agent graph (weather -> alert -> infrastructure
# -> route -> coordinator). AIService lives inside the coordinator_node in nodes.py.
# from app.ai.context_builder import ContextBuilder   # unused - kept for compatibility
# from app.ai.ai_service import AIService              # unused - kept for compatibility
# from app.config.settings import settings

router = APIRouter(prefix="/api/ai", tags=["AI"])
_incident_service = IncidentService()


@router.post("/recommendation")
async def get_recommendation(req: AIRecommendationRequest) -> dict:
    response = await _incident_service.get_recommendation(
        question=req.question,
        lat=req.lat,
        lng=req.lng,
        incident_id=req.incident_id,
    )
    return response.model_dump()
