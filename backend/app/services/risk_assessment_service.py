import math
from typing import Any

from app.schemas.risk import RiskAssessmentResponse, RiskComponentBreakdown

EARTH_RADIUS_KM = 6371
NEARBY_RADIUS_KM = 50

SEVERITY_RANK: dict[str, int] = {
    "critical": 0, "severe": 1, "extreme": 2, "high": 3,
    "warning": 4, "moderate": 5, "advisory": 6, "info": 7,
}

EVACUATION_KW = {"evacuation", "evacuate", "mandatory evacuation", "evacuation order"}


def _haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    )
    return 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)) * EARTH_RADIUS_KM


def _point_in_polygon(lat: float, lng: float, polygon: list[tuple[float, float]]) -> bool:
    inside = False
    n = len(polygon)
    j = n - 1
    for i in range(n):
        yi, xi = polygon[i]
        yj, xj = polygon[j]
        if ((xi > lng) != (xj > lng)) and (lat < (yj - yi) * (lng - xi) / (xj - xi) + yi):
            inside = not inside
        j = i
    return inside


def _parse_polygon(text: str) -> list[tuple[float, float]]:
    parts = text.strip().replace(",", " ").split()
    coords: list[tuple[float, float]] = []
    for i in range(0, len(parts), 2):
        lat = float(parts[i])
        lng = float(parts[i + 1])
        coords.append((lat, lng))
    return coords


def _is_nationwide(area: str | None) -> bool:
    if not area:
        return False
    kw = {"all india", "entire india", "whole india", "nationwide", "all over india"}
    return area.lower().strip() in kw


def _polygon_centroid(polygon: list[tuple[float, float]]) -> tuple[float, float]:
    lat_sum = sum(p[0] for p in polygon)
    lng_sum = sum(p[1] for p in polygon)
    n = len(polygon)
    return (lat_sum / n, lng_sum / n)


def _parse_polygons_from_alert(alert: Any) -> list[list[tuple[float, float]]]:
    polygons_text = getattr(alert, "polygons", None) or ""
    polygons: list[list[tuple[float, float]]] = []
    for poly_str in polygons_text.split(";"):
        poly_str = poly_str.strip()
        if not poly_str:
            continue
        try:
            polygon = _parse_polygon(poly_str)
            if len(polygon) >= 3:
                polygons.append(polygon)
        except (ValueError, IndexError):
            continue
    return polygons


def _alert_event_matches(alert: Any, keywords: set[str]) -> bool:
    event = (getattr(alert, "event", None) or "").lower()
    headline = (getattr(alert, "title", None) or getattr(alert, "headline", None) or "").lower()
    msg = (getattr(alert, "message", None) or getattr(alert, "description", None) or "").lower()
    text = f"{event} {headline} {msg}"
    return any(k in text for k in keywords)


def _classify_weather_risk(weather: dict[str, Any] | None) -> tuple[str, int]:
    if not weather:
        return ("NONE", 0)

    temp = weather.get("temperature")
    desc = (weather.get("description") or "").lower()

    if temp is not None:
        if temp >= 45:
            return ("EXTREME", 45)
        if temp <= 0:
            return ("HIGH", 30)
        if temp >= 40:
            return ("HIGH", 30)

    if any(k in desc for k in ("thunderstorm", "cyclone", "hurricane", "typhoon", "tornado")):
        return ("EXTREME", 40)
    if any(k in desc for k in ("heavy", "extreme", "torrential", "flood")):
        return ("HIGH", 30)
    if "rain" in desc or "drizzle" in desc:
        return ("LOW", 15)

    return ("NONE", 0)


def _classify_weather_label(weather: dict[str, Any] | None) -> str:
    label, _ = _classify_weather_risk(weather)
    return label


def _highest_alert_severity(alerts: list[Any] | None) -> str:
    if not alerts:
        return "NONE"
    best_rank = 999
    best_label = "NONE"
    for a in alerts:
        severity = (getattr(a, "severity", None) or "").lower()
        rank = SEVERITY_RANK.get(severity, 99)
        if rank < best_rank:
            best_rank = rank
            best_label = severity.upper()
    return best_label


def _evaluate_user_alert_risk(
    alerts: list[Any], lat: float, lng: float
) -> tuple[int, int, bool, bool]:
    score = 0
    nearby_count = 0
    inside_polygon = False
    evacuation_order = False

    for alert in alerts:
        severity = (getattr(alert, "severity", None) or "").lower()
        rank = SEVERITY_RANK.get(severity, 99)
        polygons = _parse_polygons_from_alert(alert)
        nationwide = _is_nationwide(getattr(alert, "area", None) or "")

        user_inside = False
        for poly in polygons:
            if _point_in_polygon(lat, lng, poly):
                user_inside = True
                inside_polygon = True
                break

        if nationwide or user_inside:
            nearby_count += 1
            if rank <= 1:
                if _alert_event_matches(alert, EVACUATION_KW):
                    evacuation_order = True
                score += 25
            elif rank <= 3:
                score += 15
            else:
                score += 8
        elif polygons:
            all_vertices: list[tuple[float, float]] = []
            for poly in polygons:
                all_vertices.extend(poly)
            if all_vertices:
                centroid = _polygon_centroid(all_vertices)
                dist = _haversine(lat, lng, centroid[0], centroid[1])
                if dist <= NEARBY_RADIUS_KM:
                    nearby_count += 1
                    if rank <= 1:
                        score += 12
                    elif rank <= 3:
                        score += 8
                    else:
                        score += 4

    return (score, nearby_count, inside_polygon, evacuation_order)


def _evaluate_disaster_risk(disasters: list[Any], lat: float, lng: float) -> tuple[int, int]:
    score = 0
    nearby_count = 0
    for disaster in disasters:
        dlat = getattr(disaster, "latitude", None)
        dlng = getattr(disaster, "longitude", None)
        if dlat is None or dlng is None:
            continue
        dist = _haversine(lat, lng, dlat, dlng)
        if dist <= NEARBY_RADIUS_KM:
            nearby_count += 1
            severity = (getattr(disaster, "severity", None) or "").lower()
            rank = SEVERITY_RANK.get(severity, 99)
            if rank <= 1:
                score += 25
            elif rank <= 3:
                score += 15
            elif rank <= 5:
                score += 5
            else:
                score += 2
    return (score, nearby_count)


def _evaluate_infrastructure_risk(infrastructure: Any | None) -> int:
    if infrastructure is None:
        return 10
    score = 0
    shelters = getattr(infrastructure, "shelters", None) or []
    hospitals = getattr(infrastructure, "hospitals", None) or []
    if not shelters:
        score += 5
    if not hospitals:
        score += 5
    return score


def _classify_user_risk(total_score: int, inside_polygon: bool, evacuation_order: bool) -> str:
    if evacuation_order:
        return "EXTREME"
    if inside_polygon and total_score >= 15:
        return "EXTREME"
    if total_score >= 71:
        return "EXTREME"
    if total_score >= 46:
        return "HIGH"
    if total_score >= 26:
        return "MODERATE"
    if total_score >= 11:
        return "LOW"
    return "SAFE"


def _build_reason(
    user_risk: str,
    regional_severity: str,
    weather_label: str,
    inside_polygon: bool,
    evacuation_order: bool,
    nearby_alerts: int,
    regional_count: int,
    nearby_threats: int,
) -> str:
    parts: list[str] = []

    if evacuation_order:
        parts.append("An evacuation order is in effect for your location.")
    elif inside_polygon:
        parts.append("Your location is inside an active alert polygon.")

    if user_risk != "SAFE" and user_risk != "LOW" and evacuation_order is False:
        if nearby_alerts > 0:
            parts.append(f"{nearby_alerts} alert(s) affect your immediate area.")

    if regional_count > 0 and regional_count > nearby_alerts:
        extra = regional_count - nearby_alerts
        parts.append(f"{extra} additional regional alert(s) exist in nearby districts but do not affect your location.")

    if weather_label in ("HIGH", "EXTREME"):
        parts.append(f"Weather at your location is {weather_label.lower()}.")
    elif weather_label == "LOW":
        parts.append("Light precipitation in your area.")

    if nearby_threats > 0:
        parts.append(f"{nearby_threats} nearby disaster event(s) reported.")

    if not parts:
        parts.append("No significant threats detected at your location.")

    return " ".join(parts)


class RiskAssessmentService:
    def evaluate(
        self,
        lat: float,
        lng: float,
        weather: dict[str, Any] | None = None,
        alerts: list[Any] | None = None,
        disasters: list[Any] | None = None,
        infrastructure: Any | None = None,
    ) -> RiskAssessmentResponse:
        alerts = alerts or []
        disasters = disasters or []

        weather_label, weather_score = _classify_weather_risk(weather)
        alert_score, nearby_alerts, inside_polygon, evacuation_order = (
            _evaluate_user_alert_risk(alerts, lat, lng)
        )
        disaster_score, nearby_threats = _evaluate_disaster_risk(disasters, lat, lng)
        infrastructure_score = _evaluate_infrastructure_risk(infrastructure)

        total_score = weather_score + alert_score + disaster_score + infrastructure_score
        user_risk = _classify_user_risk(total_score, inside_polygon, evacuation_order)
        regional_severity = _highest_alert_severity(alerts)

        reason = _build_reason(
            user_risk, regional_severity, weather_label,
            inside_polygon, evacuation_order,
            nearby_alerts, len(alerts), nearby_threats,
        )

        return RiskAssessmentResponse(
            user_risk=user_risk,
            regional_alert_severity=regional_severity,
            reason=reason,
            evacuation_required=evacuation_order,
            inside_alert_polygon=inside_polygon,
            nearby_alerts=nearby_alerts,
            regional_alert_count=len(alerts),
            components=RiskComponentBreakdown(
                weather_score=weather_score,
                alert_score=alert_score,
                disaster_score=disaster_score,
                infrastructure_score=infrastructure_score,
            ),
        )
