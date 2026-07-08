from datetime import datetime, timezone
from typing import Any

from app.services.disaster_sources.base import AlertData


def alert_data_to_dict(data: AlertData) -> dict[str, Any]:
    polygons_str: str | None = None
    if data.polygons:
        polygons_str = ";".join(data.polygons)

    return {
        "external_id": data.external_id,
        "event": data.event,
        "title": data.headline[:255] if data.headline else data.event[:255],
        "message": data.description,
        "severity": data.severity,
        "urgency": data.urgency,
        "certainty": data.certainty,
        "area": data.area,
        "expires_at": _parse_datetime(data.expires) if data.expires else None,
        "polygons": polygons_str,
        "source": data.source,
    }


def _parse_datetime(dt_str: str) -> datetime | None:
    if not dt_str:
        return None
    try:
        dt_str_clean = dt_str.strip()
        if dt_str_clean.endswith("Z"):
            dt_str_clean = dt_str_clean[:-1] + "+00:00"
        return datetime.fromisoformat(dt_str_clean)
    except (ValueError, TypeError):
        return None
