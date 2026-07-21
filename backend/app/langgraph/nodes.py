import asyncio

from app.langgraph.state import AgentState
from app.langgraph.models import (
    LocationState,
    WeatherState,
    AlertItem,
    AlertState,
    InfrastructureItem,
    InfrastructureState,
    DestinationState,
    RouteState,
    RecommendationState,
)
from app.ai.state_context_builder import StateContextBuilder
from app.services.weather import WeatherService
from app.services.alert import AlertService
from app.services.location_service import LocationService
from app.services.routing_service import RoutingService
from app.services.risk_assessment_service import RiskAssessmentService
from app.database.connection import async_session_factory
from app.ai.ai_service import AIService
from app.ai.schemas import AIRecommendationResponse
from app.config.settings import settings

_weather_service = WeatherService()
_location_service = LocationService()
_ai_service = AIService(api_key=settings.GEMINI_API_KEY)
_routing_service = RoutingService()
_risk_service = RiskAssessmentService()

SEVERITY_RANK = {"critical": 0, "severe": 1, "high": 2, "warning": 3, "advisory": 4, "info": 5}

_DEGRADED_INDICATORS = (
    "not configured",
    "temporarily unavailable",
    "quota exceeded",
    "unexpected",
    "authentication failed",
    "not available",
)


async def weather_node(state: AgentState) -> dict:
    print("[LangGraph] Weather started")
    lat = state.location.latitude if state.location else None
    lng = state.location.longitude if state.location else None

    if lat is not None and lng is not None:
        try:
            data = await _weather_service.get_current_weather(lat, lng)
            risk = _infer_weather_risk(data)
            return {
                "weather": WeatherState(
                    temperature=data.get("temperature"),
                    feels_like=data.get("feels_like"),
                    humidity=data.get("humidity"),
                    wind_speed=data.get("wind_speed"),
                    rain=data.get("rain"),
                    description=data.get("description"),
                    city=data.get("city"),
                    risk_level=risk,
                )
            }
        except Exception:
            pass

    return {"weather": WeatherState()}


async def alert_node(state: AgentState) -> dict:
    print("[LangGraph] Alert started")
    lat = state.location.latitude if state.location else None
    lng = state.location.longitude if state.location else None

    try:
        async with async_session_factory() as db:
            service = AlertService(db)
            alerts = await service.get_all(lat=lat, lng=lng)

        if alerts:
            items = [
                AlertItem(
                    id=str(a.id),
                    event=a.event,
                    severity=a.severity,
                    headline=a.title,
                    description=a.message,
                    area=a.area,
                    source=a.source,
                )
                for a in alerts
            ]
            highest = min(alerts, key=lambda a: SEVERITY_RANK.get(a.severity, 5))
            return {
                "alerts": AlertState(
                    alerts=items,
                    total_alerts=len(alerts),
                    highest_severity=highest.severity,
                )
            }
    except Exception:
        pass

    return {"alerts": AlertState()}


async def infrastructure_node(state: AgentState) -> dict:
    print("[LangGraph] Infrastructure started")
    lat = state.location.latitude if state.location else None
    lng = state.location.longitude if state.location else None

    if lat is not None and lng is not None:
        try:
            hospitals, shelters, community_centres, schools, police, firestations, pharmacies = (
                await asyncio.gather(
                    _location_service.get_nearby_hospitals(lat, lng),
                    _location_service.get_nearby_shelters(lat, lng),
                    _location_service.get_nearby_community_centres(lat, lng),
                    _location_service.get_nearby_schools(lat, lng),
                    _location_service.get_nearby_police(lat, lng),
                    _location_service.get_nearby_firestations(lat, lng),
                    _location_service.get_nearby_pharmacies(lat, lng),
                )
            )
            return {
                "infrastructure": InfrastructureState(
                    hospitals=[InfrastructureItem(**h) for h in hospitals],
                    shelters=[InfrastructureItem(**s) for s in shelters],
                    community_centres=[InfrastructureItem(**c) for c in community_centres],
                    schools=[InfrastructureItem(**s) for s in schools],
                    police=[InfrastructureItem(**p) for p in police],
                    firestations=[InfrastructureItem(**f) for f in firestations],
                    pharmacies=[InfrastructureItem(**ph) for ph in pharmacies],
                )
            }
        except Exception:
            pass

    return {"infrastructure": InfrastructureState()}


async def route_node(state: AgentState) -> dict:
    print("[LangGraph] Route started")
    lat = state.location.latitude if state.location else None
    lng = state.location.longitude if state.location else None
    infra = state.infrastructure

    if lat is not None and lng is not None and infra is not None:
        dest_type, dest_item = _pick_nearest_destination(lat, lng, infra)

        if dest_item:
            try:
                route = await _routing_service.get_route(
                    lat, lng,
                    dest_item.latitude, dest_item.longitude,
                    destination_type=dest_type or "destination",
                )
                return {
                    "destination": DestinationState(
                        destination_type=dest_type,
                        destination=dest_item,
                    ),
                    "route": route,
                }
            except Exception:
                pass

    return {
        "destination": DestinationState(),
        "route": RouteState(),
    }


async def coordinator_node(state: AgentState) -> dict:
    print("[LangGraph] Coordinator started")
    print("[Coordinator] Building LLM context")

    lat = state.location.latitude if state.location else 0.0
    lng = state.location.longitude if state.location else 0.0

    weather_dict = None
    if state.weather and state.weather.temperature is not None:
        weather_dict = {
            "temperature": state.weather.temperature,
            "description": state.weather.description or "",
        }

    alerts_raw = state.alerts.alerts if state.alerts else []

    print("[Coordinator] Running risk assessment")
    assessment = _risk_service.evaluate(
        lat=lat,
        lng=lng,
        weather=weather_dict,
        alerts=alerts_raw,
        infrastructure=state.infrastructure,
    )
    print(f"[Coordinator] User risk: {assessment.user_risk} | Regional alert: {assessment.regional_alert_severity}")

    context = StateContextBuilder.build(state, assessment)

    try:
        print("[Coordinator] Calling AIService")
        ai_response: AIRecommendationResponse = await _ai_service.get_recommendation(
            question=state.user_question,
            context=context,
        )

        if _is_degraded(ai_response):
            print(f"[Coordinator] AI unavailable — reason: {ai_response.reason}")
            print("[Coordinator] Using deterministic fallback")
            rec = _deterministic_recommendation(state, assessment, source="fallback")
        else:
            print("[Coordinator] AI recommendation parsed")
            rec = _map_ai_response(ai_response, assessment)
    except Exception as exc:
        print(f"[Coordinator] AI exception: {exc}")
        print("[Coordinator] Using deterministic fallback")
        rec = _deterministic_recommendation(state, assessment, source="fallback")

    return {"recommendation": rec}


# ---------------------------------------------------------------------------
# Coordinator helpers
# ---------------------------------------------------------------------------


def _is_degraded(response: AIRecommendationResponse) -> bool:
    s = (response.summary or "").lower()
    r = (response.reason or "").lower()
    return any(k in s or k in r for k in _DEGRADED_INDICATORS)


def _map_ai_response(
    response: AIRecommendationResponse, assessment
) -> RecommendationState:
    dest_name = None
    if response.recommendedDestination:
        dest_name = (
            f"{response.recommendedDestination.type}: "
            f"{response.recommendedDestination.name}"
        )

    return RecommendationState(
        summary=response.summary or assessment.reason,
        actions=response.actions,
        risk_level=assessment.user_risk.lower(),
        reasoning=response.reason or assessment.reason,
        recommended_destination=dest_name,
        source="gemini",
    )


def _deterministic_recommendation(
    state: AgentState, assessment, source: str = "fallback"
) -> RecommendationState:
    weather_status = (
        "available"
        if state.weather and state.weather.temperature is not None
        else "unavailable"
    )
    alert_count = state.alerts.total_alerts if state.alerts else 0
    infra_count = _count_infrastructure(state.infrastructure)
    route_status = "available" if state.route and state.route.distance_km else "unavailable"

    summary = (
        f"Based on available data: Weather {weather_status}, "
        f"{alert_count} active alerts, "
        f"{infra_count} nearby facilities, "
        f"route {route_status}. "
        "Please follow local authority guidance."
    )

    risk = assessment.user_risk.lower()
    dest_name = None
    if state.destination and state.destination.destination:
        dest_name = (
            f"{state.destination.destination_type}: "
            f"{state.destination.destination.name}"
        )

    return RecommendationState(
        summary=summary,
        actions=_suggest_actions(state),
        risk_level=risk,
        reasoning=assessment.reason,
        recommended_destination=dest_name,
        source=source,
    )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _infer_weather_risk(data: dict) -> str:
    temp = data.get("temperature")
    if temp is not None:
        if temp >= 45:
            return "extreme"
        if temp >= 40:
            return "high"
        if temp <= 0:
            return "high"
    desc = (data.get("description") or "").lower()
    if any(k in desc for k in ("thunderstorm", "cyclone", "hurricane", "typhoon")):
        return "extreme"
    if any(k in desc for k in ("heavy", "extreme", "torrential")):
        return "high"
    return "moderate" if temp and temp >= 35 else "low"


def _pick_nearest_destination(
    lat: float, lng: float, infra: InfrastructureState
) -> tuple[str | None, InfrastructureItem | None]:
    candidates: list[tuple[str, InfrastructureItem]] = []
    for cat, items in (
        ("hospital", infra.hospitals),
        ("shelter", infra.shelters),
        ("community_centre", infra.community_centres),
        ("school", infra.schools),
        ("police", infra.police),
        ("firestation", infra.firestations),
        ("pharmacy", infra.pharmacies),
    ):
        for item in items:
            if item.distance is not None:
                candidates.append((cat, item))

    if not candidates:
        return None, None

    candidates.sort(key=lambda pair: pair[1].distance if pair[1].distance is not None else float("inf"))
    return candidates[0]


def _count_infrastructure(infra: InfrastructureState | None) -> int:
    if infra is None:
        return 0
    return (
        len(infra.hospitals)
        + len(infra.shelters)
        + len(infra.community_centres)
        + len(infra.schools)
        + len(infra.police)
        + len(infra.firestations)
        + len(infra.pharmacies)
    )


def _suggest_actions(state: AgentState) -> list[str]:
    actions: list[str] = []

    if state.alerts and state.alerts.highest_severity in ("critical", "severe", "high"):
        actions.append("Take immediate safety precautions based on active alerts")

    if state.weather and state.weather.risk_level in ("extreme", "high"):
        actions.append("Avoid outdoor movement due to severe weather conditions")

    if state.infrastructure:
        nearest = _pick_nearest_destination(
            state.location.latitude if state.location else 0,
            state.location.longitude if state.location else 0,
            state.infrastructure,
        )
        if nearest[1]:
            actions.append(f"Proceed to nearest {nearest[0]}: {nearest[1].name} ({nearest[1].distance:.1f} km)")

    if not actions:
        actions.append("No immediate action required. Monitor local updates.")

    return actions
