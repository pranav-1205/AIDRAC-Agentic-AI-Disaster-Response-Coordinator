from app.langgraph.state import AgentState


def build_llm_context(state: AgentState) -> str:
    parts: list[str] = []

    if state.user_question:
        parts.append(f"User Question: {state.user_question}\n")

    if state.location and state.location.latitude is not None:
        parts.append(
            f"User Location: {state.location.latitude:.4f}, {state.location.longitude:.4f}\n"
        )

    w = state.weather
    if w and w.temperature is not None:
        parts.append(
            f"Weather: {w.temperature}\u00b0C, {w.description or 'N/A'}, "
            f"risk level: {w.risk_level or 'unknown'}\n"
        )
    else:
        parts.append("Weather: unavailable\n")

    a = state.alerts
    if a and a.total_alerts > 0:
        parts.append(
            f"Alerts: {a.total_alerts} active, "
            f"highest severity: {a.highest_severity or 'unknown'}\n"
        )
        for item in a.alerts[:5]:
            label = item.event or item.headline or "N/A"
            parts.append(f"  - [{item.severity}] {label}\n")
    else:
        parts.append("Alerts: none\n")

    infra = state.infrastructure
    if infra:
        slots = [
            ("hospitals", infra.hospitals, 3),
            ("shelters", infra.shelters, 3),
            ("community_centres", infra.community_centres, 2),
            ("schools", infra.schools, 2),
            ("police", infra.police, 2),
            ("firestations", infra.firestations, 2),
            ("pharmacies", infra.pharmacies, 2),
        ]
        infra_lines = ["Nearby Infrastructure:"]
        for name, items, limit in slots:
            if items:
                for item in items[:limit]:
                    d = f"{item.distance:.1f} km" if item.distance is not None else "N/A"
                    infra_lines.append(f"  - {name}: {item.name} ({d})")
            else:
                infra_lines.append(f"  - {name}: none found")
        parts.append("\n".join(infra_lines) + "\n")
    else:
        parts.append("Nearby Infrastructure: unavailable\n")

    dest = state.destination
    route = state.route
    if dest and dest.destination:
        parts.append(
            f"Destination: {dest.destination_type} \u2014 {dest.destination.name}\n"
        )
        if route and route.distance_km is not None:
            parts.append(
                f"Distance: {route.distance_km:.2f} km "
                f"(ETA: {route.duration_min:.0f} min)\n"
            )
    else:
        parts.append("Destination: none selected\n")

    return "".join(parts)
