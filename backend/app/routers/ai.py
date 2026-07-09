from fastapi import APIRouter
from app.ai.schemas import AIRecommendationRequest, AIRecommendationResponse, RecommendedDestination
from app.langgraph.state import AgentState
from app.langgraph.models import LocationState
from app.langgraph.graph import graph

# NOTE: ContextBuilder and AIService are no longer invoked directly by the router.
# The production recommendation flow now routes through the LangGraph multi-agent
# graph (weather → alert → infrastructure → route → coordinator), which internally
# calls AIService inside the coordinator_node. These imports remain available for
# compatibility and are used by the LangGraph coordinator node in nodes.py.

router = APIRouter(prefix="/api/ai", tags=["AI"])


def _recommendation_to_response(
    recommendation,
    destination,
) -> AIRecommendationResponse:
    dest = None
    if destination and destination.destination_type and destination.destination:
        dest = RecommendedDestination(
            type=destination.destination_type,
            name=destination.destination.name,
        )
    if dest is None and recommendation.recommended_destination:
        parts = recommendation.recommended_destination.split(":", 1)
        if len(parts) == 2:
            dest = RecommendedDestination(type=parts[0].strip(), name=parts[1].strip())

    return AIRecommendationResponse(
        riskLevel=recommendation.risk_level or "unknown",
        summary=recommendation.summary or "",
        recommendedDestination=dest,
        reason=recommendation.reasoning or "",
        actions=recommendation.actions,
    )


@router.post("/recommendation")
async def get_recommendation(req: AIRecommendationRequest) -> dict:
    location = None
    if req.lat is not None and req.lng is not None:
        location = LocationState(latitude=req.lat, longitude=req.lng)

    initial_state = AgentState(
        user_question=req.question,
        location=location,
    )

    result = await graph.ainvoke(initial_state.model_dump())

    recommendation = result["recommendation"]
    destination = result.get("destination")

    response = _recommendation_to_response(recommendation, destination)
    return response.model_dump()
