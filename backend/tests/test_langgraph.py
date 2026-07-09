"""Verify all LangGraph agents return properly typed state after execution."""
import asyncio
from app.langgraph.state import AgentState
from app.langgraph.models import (
    LocationState,
    WeatherState,
    AlertState,
    InfrastructureState,
    DestinationState,
    RouteState,
    RecommendationState,
)
from app.langgraph.graph import build_graph


def test_graph_builds():
    graph = build_graph()
    assert graph is not None
    node_names = [n for n in graph.nodes.keys() if not n.startswith("__")]
    assert node_names == ["weather", "alert", "infrastructure", "route", "coordinator"]
    print("[test] Graph builds with correct nodes")


async def test_graph_executes_without_crashing():
    graph = build_graph()
    initial = AgentState(user_question="Where should I go during the flood?")
    result = await graph.ainvoke(initial.model_dump())

    assert result["user_question"] == initial.user_question
    assert isinstance(result["weather"], WeatherState)
    assert isinstance(result["alerts"], AlertState)
    assert isinstance(result["infrastructure"], InfrastructureState)
    assert isinstance(result["destination"], DestinationState)
    assert isinstance(result["route"], RouteState)
    assert isinstance(result["recommendation"], RecommendationState)
    assert len(result["recommendation"].summary) > 0

    src = result["recommendation"].source
    print(f"[test] Graph executes — Recommendation Source: {src.capitalize()}")


async def test_graph_with_gps_coordinates():
    graph = build_graph()
    initial = AgentState(
        user_question="Where should I go?",
        location=LocationState(latitude=28.6139, longitude=77.2090),
    )
    result = await graph.ainvoke(initial.model_dump())

    assert isinstance(result["weather"], WeatherState)
    assert isinstance(result["alerts"], AlertState)
    assert isinstance(result["infrastructure"], InfrastructureState)
    assert isinstance(result["destination"], DestinationState)
    assert isinstance(result["route"], RouteState)
    assert isinstance(result["recommendation"], RecommendationState)

    src = result["recommendation"].source
    print(f"[test] Graph with GPS — Recommendation Source: {src.capitalize()}")


async def test_coordinator_populates_summary():
    graph = build_graph()
    initial = AgentState(user_question="test")
    result = await graph.ainvoke(initial.model_dump())

    rec = result["recommendation"]
    assert isinstance(rec, RecommendationState)
    assert rec.summary is not None
    assert len(rec.summary) > 0
    assert isinstance(rec.actions, list)
    assert rec.source in ("gemini", "fallback")
    print(f"[test] Coordinator populates summary — Source: {rec.source.capitalize()}")


if __name__ == "__main__":
    test_graph_builds()
    asyncio.run(test_graph_executes_without_crashing())
    asyncio.run(test_graph_with_gps_coordinates())
    asyncio.run(test_coordinator_populates_summary())
    print("\nAll tests passed!")
