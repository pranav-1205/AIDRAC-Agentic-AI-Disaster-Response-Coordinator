"""Converts an AgentState into LLM prompt text.

Never calls external services — only formats pre-collected data.
Automatically prepends the previous recommendation context when a
restored incident checkpoint contains one.
"""


class StateContextBuilder:
    """Builds LLM context entirely from an AgentState (LangGraph path)."""

    @staticmethod
    def build(state, assessment=None) -> str:
        rec = state.recommendation

        parts = []

        if assessment is not None:
            parts.append(StateContextBuilder._format_risk_assessment(assessment))
            print(f"[Memory] Risk assessment injected: user_risk={assessment.user_risk}, regional_severity={assessment.regional_alert_severity}")

        if rec is not None and bool(rec.summary):
            parts.append(StateContextBuilder._format_previous_context(rec))
            print("[Memory] Previous recommendation injected into LLM context")
        else:
            print("[Memory] No previous incident context")

        parts.append(StateContextBuilder._format_current_context(state))
        return "".join(parts)

    @staticmethod
    def _format_risk_assessment(assessment) -> str:
        c = assessment.components
        return (
            "======================\n"
            "SYSTEM RISK ASSESSMENT\n"
            "======================\n"
            f"Current User Risk: {assessment.user_risk}\n"
            f"Regional Alert Severity: {assessment.regional_alert_severity}\n"
            f"Evacuation Required: {'YES' if assessment.evacuation_required else 'NO'}\n"
            f"Inside Alert Polygon: {'YES' if assessment.inside_alert_polygon else 'NO'}\n"
            f"Nearby Alerts (affecting user): {assessment.nearby_alerts}\n"
            f"Total Regional Alerts: {assessment.regional_alert_count}\n"
            "Component Scores:\n"
            f"  - Weather: {c.weather_score}\n"
            f"  - Alerts affecting user: {c.alert_score}\n"
            f"  - Disasters: {c.disaster_score}\n"
            f"  - Infrastructure: {c.infrastructure_score}\n"
            f"Assessment Reason: {assessment.reason}\n\n"
        )

    # ------------------------------------------------------------------
    # Previous context
    # ------------------------------------------------------------------

    @staticmethod
    def _format_previous_context(rec) -> str:
        lines = [
            "======================\n"
            "PREVIOUS INCIDENT STATE\n"
            "======================\n",
            f"Previous Risk Level: {rec.risk_level or 'unknown'}\n",
            f"Previous Recommendation Summary: {rec.summary}\n",
        ]
        if rec.recommended_destination:
            lines.append(f"Previous Recommended Destination: {rec.recommended_destination}\n")
        if rec.actions:
            lines.append("Previous Recommended Actions:\n")
            for i, action in enumerate(rec.actions, 1):
                lines.append(f"  {i}. {action}\n")
        return "".join(lines)

    # ------------------------------------------------------------------
    # Current context
    # ------------------------------------------------------------------

    @staticmethod
    def _format_current_context(state) -> str:
        parts = [
            "======================\n"
            "CURRENT INCIDENT STATE\n"
            "======================\n"
        ]
        StateContextBuilder._append_weather(parts, state)
        StateContextBuilder._append_alerts(parts, state)
        StateContextBuilder._append_infrastructure(parts, state)
        StateContextBuilder._append_route(parts, state)
        return "".join(parts)

    @staticmethod
    def _append_weather(parts: list[str], state) -> None:
        w = state.weather
        parts.append("\n--- Weather ---\n")
        if w is not None and w.temperature is not None:
            parts.append(f"Temperature: {w.temperature}°C\n")
            if w.feels_like is not None:
                parts.append(f"Feels Like: {w.feels_like}°C\n")
            if w.humidity is not None:
                parts.append(f"Humidity: {w.humidity}%\n")
            if w.wind_speed is not None:
                parts.append(f"Wind Speed: {w.wind_speed} m/s\n")
            if w.rain is not None:
                parts.append(f"Rain: {w.rain} mm/h\n")
            if w.description:
                parts.append(f"Conditions: {w.description}\n")
            if w.risk_level:
                parts.append(f"Weather Risk Level: {w.risk_level}\n")
        else:
            parts.append("Weather data: unavailable\n")

    @staticmethod
    def _append_alerts(parts: list[str], state) -> None:
        a = state.alerts
        parts.append("\n--- Alerts ---\n")
        if a is not None and a.alerts:
            parts.append(f"Total Active Alerts: {a.total_alerts}\n")
            parts.append(f"Highest Severity: {a.highest_severity or 'unknown'}\n")
            for alert in a.alerts:
                parts.append(
                    f"- [{alert.severity}] {alert.headline or alert.event or 'Unknown'}: "
                    f"{alert.description or ''}\n"
                )
        else:
            parts.append("No active alerts\n")

    @staticmethod
    def _append_infrastructure(parts: list[str], state) -> None:
        i = state.infrastructure
        parts.append("\n--- Nearby Infrastructure ---\n")
        if i is None:
            parts.append("Infrastructure data: unavailable\n")
            return

        categories = (
            ("Hospitals", i.hospitals),
            ("Shelters", i.shelters),
            ("Community Centres", i.community_centres),
            ("Schools", i.schools),
            ("Police Stations", i.police),
            ("Fire Stations", i.firestations),
            ("Pharmacies", i.pharmacies),
        )
        found_any = False
        for label, items in categories:
            if items:
                found_any = True
            parts.append(f"  {label}: {len(items)} found")
            if items:
                nearest = items[0]
                dist = f"{nearest.distance:.1f} km" if nearest.distance is not None else "unknown distance"
                parts.append(f", nearest: {nearest.name} ({dist})")
            parts.append("\n")

        if not found_any:
            parts.append("  No nearby facilities found\n")

    @staticmethod
    def _append_route(parts: list[str], state) -> None:
        r = state.route
        dest = state.destination
        parts.append("\n--- Route ---\n")
        if r is not None and r.distance_km:
            parts.append(f"Distance to destination: {r.distance_km:.1f} km\n")
            if r.duration_min is not None:
                parts.append(f"Estimated duration: {r.duration_min:.0f} min\n")
            parts.append(f"Routing provider: {r.provider or 'unknown'}\n")
            if r.directions:
                parts.append("Directions:\n")
                for step in r.directions:
                    parts.append(f"  - {step}\n")
            if dest is not None and dest.destination_type and dest.destination:
                parts.append(f"Destination: {dest.destination_type} - {dest.destination.name}\n")
        else:
            parts.append("Route: not computed or unavailable\n")
