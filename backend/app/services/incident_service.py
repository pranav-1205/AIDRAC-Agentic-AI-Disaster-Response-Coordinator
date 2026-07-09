from app.langgraph.state import AgentState
from app.langgraph.models import LocationState
from app.langgraph.graph import graph, checkpointed_graph
from app.ai.schemas import AIRecommendationResponse, RecommendedDestination


class IncidentService:
    """Owns all incident checkpoint logic — restore, run, save — keeping the
    router completely agnostic of LangGraph or MemorySaver internals."""

    def __init__(self):
        self._graph = graph
        self._checkpointed_graph = checkpointed_graph

    async def get_recommendation(
        self,
        question: str,
        lat: float | None = None,
        lng: float | None = None,
        incident_id: str | None = None,
    ) -> AIRecommendationResponse:
        location = None
        if lat is not None and lng is not None:
            location = LocationState(latitude=lat, longitude=lng)

        if incident_id:
            state_dict = await self._restore_or_create(incident_id, question, location)
            config = {"configurable": {"thread_id": incident_id}}
            result = await self._checkpointed_graph.ainvoke(state_dict, config)
            print("[Memory] Checkpoint saved")
        else:
            print("[Memory] Using stateless graph")
            initial = AgentState(user_question=question, location=location)
            result = await self._graph.ainvoke(initial.model_dump())

        return self._to_response(result)

    async def get_state(self, incident_id: str) -> dict | None:
        """Return the raw state dict for an incident, or None if unknown."""
        config = {"configurable": {"thread_id": incident_id}}
        snapshot = await self._checkpointed_graph.aget_state(config)
        if snapshot and snapshot.values:
            return dict(snapshot.values)
        return None

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    async def _restore_or_create(
        self,
        incident_id: str,
        question: str,
        location: LocationState | None,
    ) -> dict:
        config = {"configurable": {"thread_id": incident_id}}
        snapshot = await self._checkpointed_graph.aget_state(config)

        if snapshot and snapshot.values:
            print(f"[Memory] Restored incident {incident_id}")
            state_dict = dict(snapshot.values)
        else:
            print(f"[Memory] New incident {incident_id}")
            state_dict = AgentState(
                user_question=question,
                location=location,
            ).model_dump()
            # Fresh state already has question and location; no merge needed
            return state_dict

        state_dict["user_question"] = question
        state_dict["location"] = location
        return state_dict

    @staticmethod
    def _to_response(result: dict) -> AIRecommendationResponse:
        recommendation = result["recommendation"]
        destination = result.get("destination")

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
