import httpx
from typing import Any
from app.langgraph.models import RouteState
from app.services.location_service import _haversine

OSRM_BASE = "https://router.project-osrm.org"
TIMEOUT = 10


class RoutingService:
    async def get_route(
        self,
        origin_lat: float,
        origin_lng: float,
        dest_lat: float,
        dest_lng: float,
        destination_type: str = "destination",
    ) -> RouteState:
        try:
            print("[Routing] Calling OSRM")
            result = await self._osrm_route(origin_lat, origin_lng, dest_lat, dest_lng)
            print(f"[Routing] Provider: OSRM")
            return result
        except Exception as exc:
            print(f"[Routing] OSRM unavailable: {exc}")
            print("[Routing] Falling back to straight-line")
            return self._straight_line_route(
                origin_lat, origin_lng,
                dest_lat, dest_lng,
                destination_type,
            )

    async def _osrm_route(
        self,
        origin_lat: float,
        origin_lng: float,
        dest_lat: float,
        dest_lng: float,
    ) -> RouteState:
        url = (
            f"{OSRM_BASE}/route/v1/foot/"
            f"{origin_lng},{origin_lat};{dest_lng},{dest_lat}"
            f"?overview=full&geometries=geojson&steps=true"
        )
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data: dict[str, Any] = resp.json()

        if data.get("code") != "Ok":
            raise RuntimeError(f"OSRM returned code: {data.get('code')}")

        route = data["routes"][0]
        distance_km = route["distance"] / 1000.0
        duration_min = round(route["duration"] / 60.0, 1)

        coords_raw = route["geometry"]["coordinates"]
        coordinates: list[list[float]] = [[c[1], c[0]] for c in coords_raw]

        directions: list[str] = []
        legs = route.get("legs", [])
        if legs:
            for step in legs[0].get("steps", []):
                instruction = (
                    step.get("maneuver", {}).get("instruction")
                    or step.get("name")
                )
                if instruction:
                    directions.append(instruction)

        return RouteState(
            distance_km=round(distance_km, 3),
            duration_min=duration_min,
            provider="osrm",
            directions=directions,
            coordinates=coordinates,
        )

    def _straight_line_route(
        self,
        origin_lat: float,
        origin_lng: float,
        dest_lat: float,
        dest_lng: float,
        destination_type: str = "destination",
    ) -> RouteState:
        dist = _haversine(origin_lat, origin_lng, dest_lat, dest_lng)
        duration_min = round((dist / 5.0) * 60, 1) if dist > 0 else 0.0

        directions: list[str] = [
            f"Head towards the nearest {destination_type}",
        ]
        if dist > 1:
            directions.append(f"Continue for approximately {dist:.1f} km")
        directions.append("Arrive at destination")

        return RouteState(
            distance_km=round(dist, 3),
            duration_min=duration_min,
            provider="straight-line",
            directions=directions,
            coordinates=[[origin_lat, origin_lng], [dest_lat, dest_lng]],
        )
