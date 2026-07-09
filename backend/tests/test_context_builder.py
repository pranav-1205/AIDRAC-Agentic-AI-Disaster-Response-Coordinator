"""Unit tests for StateContextBuilder AgentState-based context formatting."""
from app.ai.state_context_builder import StateContextBuilder
from app.langgraph.state import AgentState
from app.langgraph.models import RecommendationState


def test_previous_context_excluded_when_no_recommendation():
    state = AgentState(user_question="test")
    ctx = StateContextBuilder.build(state)
    assert "PREVIOUS INCIDENT STATE" not in ctx
    assert "CURRENT INCIDENT STATE" in ctx
    print("[test] No recommendation → no previous context")


def test_previous_context_excluded_when_empty_recommendation():
    state = AgentState(
        user_question="test",
        recommendation=RecommendationState(),
    )
    ctx = StateContextBuilder.build(state)
    assert "PREVIOUS INCIDENT STATE" not in ctx
    print("[test] Empty recommendation → no previous context")


def test_previous_context_included_when_populated():
    state = AgentState(
        user_question="test",
        recommendation=RecommendationState(
            summary="Evacuate to nearest shelter",
            risk_level="high",
            actions=["Go to shelter", "Avoid roads"],
        ),
    )
    ctx = StateContextBuilder.build(state)
    assert "PREVIOUS INCIDENT STATE" in ctx
    assert "Evacuate to nearest shelter" in ctx
    assert "high" in ctx
    assert "Go to shelter" in ctx
    assert "Avoid roads" in ctx
    assert "CURRENT INCIDENT STATE" in ctx
    print("[test] Populated recommendation → previous context included")


def test_previous_context_contains_destination():
    state = AgentState(
        user_question="test",
        recommendation=RecommendationState(
            summary="Go to City Shelter",
            risk_level="critical",
            actions=["Proceed to City Shelter", "Bring emergency kit"],
            recommended_destination="shelter: City Shelter",
            reasoning="Flood risk imminent",
            source="gemini",
        ),
    )
    ctx = StateContextBuilder.build(state)
    assert "PREVIOUS INCIDENT STATE" in ctx
    assert "City Shelter" in ctx
    assert "critical" in ctx
    assert "Proceed to City Shelter" in ctx
    assert "Bring emergency kit" in ctx
    print(f"[test] Previous context with destination:\n{ctx}")


def test_current_context_contains_all_sections():
    state = AgentState(user_question="test")
    ctx = StateContextBuilder.build(state)
    assert "CURRENT INCIDENT STATE" in ctx
    assert "Weather" in ctx
    assert "Alerts" in ctx
    assert "Infrastructure" in ctx
    assert "Route" in ctx
    print(f"[test] Current context sections present:\n{ctx[:200]}")


def test_current_context_with_weather():
    from app.langgraph.models import WeatherState, LocationState

    state = AgentState(
        user_question="test",
        location=LocationState(latitude=28.6139, longitude=77.209),
        weather=WeatherState(
            temperature=32.0,
            feels_like=35.0,
            humidity=60,
            wind_speed=5.0,
            rain=2.5,
            description="partly cloudy",
            risk_level="moderate",
        ),
    )
    ctx = StateContextBuilder.build(state)
    assert "32.0°C" in ctx
    assert "35.0°C" in ctx
    assert "60.0%" in ctx
    assert "5.0 m/s" in ctx
    assert "2.5 mm/h" in ctx
    assert "partly cloudy" in ctx
    assert "moderate" in ctx
    print("[test] Weather data correctly formatted")


def test_current_context_with_alerts():
    from app.langgraph.models import AlertState, AlertItem

    state = AgentState(
        user_question="test",
        alerts=AlertState(
            total_alerts=2,
            highest_severity="critical",
            alerts=[
                AlertItem(id="1", event="Flood", severity="critical", headline="Flood Warning", description="Evacuate now"),
                AlertItem(id="2", event="Storm", severity="severe", headline="Storm Alert", description="Take cover"),
            ],
        ),
    )
    ctx = StateContextBuilder.build(state)
    assert "Total Active Alerts: 2" in ctx
    assert "critical" in ctx
    assert "Flood Warning" in ctx
    assert "Storm Alert" in ctx
    print("[test] Alert data correctly formatted")


def test_current_context_with_infrastructure():
    from app.langgraph.models import InfrastructureState, InfrastructureItem

    state = AgentState(
        user_question="test",
        infrastructure=InfrastructureState(
            hospitals=[InfrastructureItem(name="City Hospital", latitude=28.61, longitude=77.21, distance=1.5)],
            shelters=[InfrastructureItem(name="School Shelter", latitude=28.62, longitude=77.22, distance=0.8)],
        ),
    )
    ctx = StateContextBuilder.build(state)
    assert "Hospitals: 1 found" in ctx
    assert "City Hospital" in ctx
    assert "1.5 km" in ctx
    assert "Shelters: 1 found" in ctx
    assert "School Shelter" in ctx
    assert "0.8 km" in ctx
    print("[test] Infrastructure data correctly formatted")


def test_current_context_with_route():
    from app.langgraph.models import RouteState, DestinationState, InfrastructureItem

    state = AgentState(
        user_question="test",
        route=RouteState(
            distance_km=2.5,
            duration_min=30.0,
            provider="osrm",
            directions=["Head north", "Turn left at Main St"],
        ),
        destination=DestinationState(
            destination_type="shelter",
            destination=InfrastructureItem(name="Central Shelter", latitude=28.62, longitude=77.22, distance=2.5),
        ),
    )
    ctx = StateContextBuilder.build(state)
    assert "2.5 km" in ctx
    assert "30 min" in ctx
    assert "osrm" in ctx
    assert "Head north" in ctx
    assert "Turn left at Main St" in ctx
    assert "Central Shelter" in ctx
    print("[test] Route data correctly formatted")


def test_previous_context_matches_exact_format():
    state = AgentState(
        user_question="test",
        recommendation=RecommendationState(
            summary="Evacuate to nearest hospital",
            risk_level="high",
            actions=["Call emergency services", "Proceed to City Hospital"],
            recommended_destination="hospital: City Hospital",
        ),
    )
    ctx = StateContextBuilder.build(state)

    assert ctx.startswith("======================\nPREVIOUS INCIDENT STATE\n======================\n")
    assert "Previous Risk Level: high" in ctx
    assert "Previous Recommendation Summary: Evacuate to nearest hospital" in ctx
    assert "Previous Recommended Destination: hospital: City Hospital" in ctx
    assert "Previous Recommended Actions:" in ctx
    assert "  1. Call emergency services" in ctx
    assert "  2. Proceed to City Hospital" in ctx
    print("[test] Previous context matches exact format specification")


if __name__ == "__main__":
    test_previous_context_excluded_when_no_recommendation()
    test_previous_context_excluded_when_empty_recommendation()
    test_previous_context_included_when_populated()
    test_previous_context_contains_destination()
    test_current_context_contains_all_sections()
    test_current_context_with_weather()
    test_current_context_with_alerts()
    test_current_context_with_infrastructure()
    test_current_context_with_route()
    test_previous_context_matches_exact_format()
    print("\nAll context builder tests passed!")
