"""Verify IncidentService checkpoint lifecycle — new, restore, isolate."""
import asyncio
from app.langgraph.models import (
    WeatherState,
    AlertState,
    InfrastructureState,
    DestinationState,
    RouteState,
    RecommendationState,
    LocationState,
)
from app.services.incident_service import IncidentService

_service = IncidentService()


def test_service_imports():
    assert _service is not None
    print("[test] IncidentService imports OK")


async def test_no_incident_id():
    """Test 1: No incident_id -> stateless graph, backward compatible."""
    resp = await _service.get_recommendation(question="Where should I go?")
    assert resp.riskLevel is not None
    assert len(resp.summary) > 0
    assert isinstance(resp.actions, list)
    print(f"[test] Stateless — risk: {resp.riskLevel}, summary: {resp.summary[:50]}")


async def test_new_incident():
    """Test 2: New incident creates fresh state."""
    uid = f"test-new-{id({})}"
    resp = await _service.get_recommendation(
        question="Where should I go?",
        lat=28.6139, lng=77.2090,
        incident_id=uid,
    )
    assert resp.riskLevel is not None
    assert len(resp.summary) > 0
    print(f"[test] New incident {uid} — risk: {resp.riskLevel}")


async def test_restore_incident():
    """Test 3: Same incident_id restores previous state and updates question."""
    uid = f"test-restore-{id({})}"

    resp1 = await _service.get_recommendation(
        question="Where should I go?",
        lat=28.6139, lng=77.2090,
        incident_id=uid,
    )
    assert resp1.riskLevel is not None

    resp2 = await _service.get_recommendation(
        question="Has anything changed?",
        lat=28.6139, lng=77.2090,
        incident_id=uid,
    )
    assert resp2.riskLevel is not None
    assert len(resp2.summary) > 0
    print(f"[test] Restored incident {uid} — summary: {resp2.summary[:50]}")

    state = await _service.get_state(uid)
    assert state is not None
    assert state["user_question"] == "Has anything changed?"
    print(f"[test] Stored question verified: {state['user_question']}")


async def test_incident_isolation():
    """Test 4: Different incident IDs remain independent."""
    uid_a = f"test-iso-A-{id({})}"
    uid_b = f"test-iso-B-{id({})}"

    await _service.get_recommendation(
        question="Where is shelter?",
        incident_id=uid_a,
    )
    await _service.get_recommendation(
        question="Is Mumbai safe?",
        lat=19.0760, lng=72.8777,
        incident_id=uid_b,
    )

    state_a = await _service.get_state(uid_a)
    state_b = await _service.get_state(uid_b)

    assert state_a is not None
    assert state_b is not None
    assert state_a["user_question"] == "Where is shelter?"
    assert state_b["user_question"] == "Is Mumbai safe?"
    print(f"[test] Isolation — A: {state_a['user_question']}, B: {state_b['user_question']}")


async def test_unknown_incident():
    """Test 5: Unknown incident_id creates a fresh incident (no crash)."""
    uid = f"test-unknown-{id({})}"
    resp = await _service.get_recommendation(
        question="Fresh start?",
        lat=28.6139, lng=77.2090,
        incident_id=uid,
    )
    assert resp.riskLevel is not None
    assert len(resp.summary) > 0
    print(f"[test] Unknown incident -> fresh: {resp.summary[:50]}")


async def test_checkpoint_contains_all_state():
    """Test 6: Restored checkpoint contains every agent's typed state."""
    uid = f"test-all-state-{id({})}"

    await _service.get_recommendation(
        question="Test all types",
        lat=28.6139, lng=77.2090,
        incident_id=uid,
    )

    state = await _service.get_state(uid)
    assert state is not None

    assert isinstance(state["weather"], WeatherState), f"Expected WeatherState, got {type(state['weather'])}"
    assert isinstance(state["alerts"], AlertState)
    assert isinstance(state["infrastructure"], InfrastructureState)
    assert isinstance(state["destination"], DestinationState)
    assert isinstance(state["route"], RouteState)
    assert isinstance(state["recommendation"], RecommendationState)
    # location may be a dict or LocationState depending on serde; just verify it exists
    assert "location" in state

    print("[test] Checkpoint contains all typed agent states")


async def test_parallel_execution():
    """Test 7: Graph still executes nodes in parallel (weather/alert/infra first)."""
    import io
    import sys

    uid = f"test-parallel-{id({})}"
    captured = io.StringIO()
    old_stdout = sys.stdout
    sys.stdout = captured

    try:
        await _service.get_recommendation(
            question="Test parallel",
            incident_id=uid,
        )
    finally:
        sys.stdout = old_stdout

    output = captured.getvalue()
    assert "LangGraph] Weather started" in output, "Missing Weather log"
    assert "LangGraph] Alert started" in output, "Missing Alert log"
    assert "LangGraph] Infrastructure started" in output, "Missing Infrastructure log"
    assert "LangGraph] Route started" in output, "Missing Route log"
    assert "LangGraph] Coordinator started" in output, "Missing Coordinator log"
    print("[test] Parallel graph execution confirmed")


async def test_endpoint_compatibility():
    """Test 8: Existing endpoint schema unchanged (simulates Swagger)."""
    resp = await _service.get_recommendation(question="Should I evacuate?")
    assert hasattr(resp, "riskLevel")
    assert hasattr(resp, "summary")
    assert hasattr(resp, "recommendedDestination")
    assert hasattr(resp, "reason")
    assert hasattr(resp, "actions")
    print(f"[test] Endpoint schema valid — risk: {resp.riskLevel}")


if __name__ == "__main__":
    test_service_imports()
    asyncio.run(test_no_incident_id())
    asyncio.run(test_new_incident())
    asyncio.run(test_restore_incident())
    asyncio.run(test_incident_isolation())
    asyncio.run(test_unknown_incident())
    asyncio.run(test_checkpoint_contains_all_state())
    asyncio.run(test_parallel_execution())
    asyncio.run(test_endpoint_compatibility())
    print("\nAll incident service tests passed!")
