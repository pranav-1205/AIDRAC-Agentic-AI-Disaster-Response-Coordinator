from datetime import datetime
from email.utils import parsedate_to_datetime
from typing import Any

from app.services.disaster_sources.base import AlertData


def alert_data_to_dict(data: AlertData) -> dict[str, Any]:
    polygons_str: str | None = None
    if data.polygons:
        polygons_str = ";".join(data.polygons)

    fields: dict[str, Any] = {
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

    # `created_at` is the timestamp displayed by the frontend. For CAP
    # alerts, retain the issuing authority's publication time instead of
    # SQLAlchemy's insertion time. Do not overwrite an existing timestamp if
    # an upstream feed supplies an unparseable value.
    published_at = _parse_datetime(data.published_at) if data.published_at else None
    if published_at is not None:
        fields["created_at"] = published_at

    return fields


def _parse_datetime(dt_str: str) -> datetime | None:
    if not dt_str:
        return None
    try:
        dt_str_clean = dt_str.strip()
        if dt_str_clean.endswith("Z"):
            dt_str_clean = dt_str_clean[:-1] + "+00:00"
        return datetime.fromisoformat(dt_str_clean)
    except (ValueError, TypeError):
        try:
            return parsedate_to_datetime(dt_str.strip())
        except (TypeError, ValueError, IndexError):
            return None
