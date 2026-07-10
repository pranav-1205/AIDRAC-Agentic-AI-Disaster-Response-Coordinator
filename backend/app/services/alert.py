import math
import logging
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.models.alert import Alert
from app.schemas.alert import AlertCreate

logger = logging.getLogger("aidrac.services.alert")

EARTH_RADIUS_KM = 6371
SEARCH_RADIUS_KM = 200


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


def _polygon_centroid(polygon: list[tuple[float, float]]) -> tuple[float, float]:
    lat_sum = sum(p[0] for p in polygon)
    lng_sum = sum(p[1] for p in polygon)
    n = len(polygon)
    return (lat_sum / n, lng_sum / n)


def _is_nationwide(area: str) -> bool:
    if not area:
        return False
    kw = {"all india", "entire india", "whole india", "nationwide", "all over india"}
    return area.lower().strip() in kw


class AlertService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(
        self,
        lat: float | None = None,
        lng: float | None = None,
        all_alerts: bool = False,
    ) -> list[Alert]:
        now = datetime.now(timezone.utc)
        result = await self.db.execute(
            select(Alert)
            .where(
                Alert.is_active.is_(True),
                or_(
                    Alert.expires_at.is_(None),
                    Alert.expires_at >= now,
                ),
            )
            .order_by(Alert.created_at.desc())
        )
        alerts = list(result.scalars().all())

        if lat is not None and lng is not None and not all_alerts:
            alerts = self._filter_by_location(alerts, lat, lng)

        return alerts

    async def get_active(self) -> list[Alert]:
        now = datetime.now(timezone.utc)
        result = await self.db.execute(
            select(Alert)
            .where(
                Alert.is_active.is_(True),
                or_(
                    Alert.expires_at.is_(None),
                    Alert.expires_at >= now,
                ),
            )
            .join(Alert.disaster, isouter=True)
            .order_by(Alert.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_history(
        self,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Alert]:
        result = await self.db.execute(
            select(Alert)
            .where(Alert.is_active.is_(False))
            .order_by(Alert.expired_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def create(self, data: AlertCreate) -> Alert:
        alert = Alert(**data.model_dump())
        self.db.add(alert)
        await self.db.flush()
        await self.db.refresh(alert)
        return alert

    @staticmethod
    def _filter_by_location(
        alerts: list[Alert],
        lat: float,
        lng: float,
    ) -> list[Alert]:
        matched: list[Alert] = []

        for alert in alerts:
            if _is_nationwide(alert.area or ""):
                matched.append(alert)
                continue

            polygons_text = alert.polygons

            if not polygons_text:
                matched.append(alert)
                continue

            all_vertices: list[tuple[float, float]] = []
            inside_polygon = False

            for poly_str in polygons_text.split(";"):
                poly_str = poly_str.strip()
                if not poly_str:
                    continue
                try:
                    polygon = _parse_polygon(poly_str)
                    if len(polygon) < 3:
                        continue
                    all_vertices.extend(polygon)
                    if _point_in_polygon(lat, lng, polygon):
                        inside_polygon = True
                        break
                except (ValueError, IndexError):
                    continue

            if inside_polygon:
                matched.append(alert)
                continue

            if all_vertices:
                centroid = _polygon_centroid(all_vertices)
                dist = _haversine(lat, lng, centroid[0], centroid[1])
                if dist <= SEARCH_RADIUS_KM:
                    matched.append(alert)

        return matched
