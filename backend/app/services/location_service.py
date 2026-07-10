import math
import time
from typing import Any
from app.services.overpass_service import OverpassService, OverpassError

DEFAULT_RADIUS = 10_000
CACHE_TTL = 600

CATEGORY_QUERIES: dict[str, list[str]] = {
    "hospitals": ["amenity=hospital"],
    "shelters": ["amenity=shelter", "building=shelter", "emergency=shelter"],
    "community_centres": ["amenity=community_centre"],
    "schools": ["amenity=school"],
    "police": ["amenity=police"],
    "firestations": ["amenity=fire_station"],
    "pharmacies": ["amenity=pharmacy"],
}

EARTH_RADIUS_KM = 6371


def _haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    )
    return 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)) * EARTH_RADIUS_KM


def _cache_key(lat: float, lng: float, radius: int, category: str) -> str:
    rlat = round(lat, 2)
    rlng = round(lng, 2)
    return f"{rlat}:{rlng}:{radius}:{category}"


class LocationService:
    def __init__(self):
        self._overpass = OverpassService()
        self._cache: dict[str, tuple[float, list[dict[str, Any]]]] = {}

    async def get_nearby_hospitals(self, lat: float, lng: float, radius: int = DEFAULT_RADIUS) -> list[dict[str, Any]]:
        return await self._fetch("hospitals", lat, lng, radius)

    async def get_nearby_shelters(self, lat: float, lng: float, radius: int = DEFAULT_RADIUS) -> list[dict[str, Any]]:
        return await self._fetch("shelters", lat, lng, radius)

    async def get_nearby_community_centres(self, lat: float, lng: float, radius: int = DEFAULT_RADIUS) -> list[dict[str, Any]]:
        return await self._fetch("community_centres", lat, lng, radius)

    async def get_nearby_schools(self, lat: float, lng: float, radius: int = DEFAULT_RADIUS) -> list[dict[str, Any]]:
        return await self._fetch("schools", lat, lng, radius)

    async def get_nearby_police(self, lat: float, lng: float, radius: int = DEFAULT_RADIUS) -> list[dict[str, Any]]:
        return await self._fetch("police", lat, lng, radius)

    async def get_nearby_firestations(self, lat: float, lng: float, radius: int = DEFAULT_RADIUS) -> list[dict[str, Any]]:
        return await self._fetch("firestations", lat, lng, radius)

    async def get_nearby_pharmacies(self, lat: float, lng: float, radius: int = DEFAULT_RADIUS) -> list[dict[str, Any]]:
        return await self._fetch("pharmacies", lat, lng, radius)

    async def _fetch(self, category: str, lat: float, lng: float, radius: int) -> list[dict[str, Any]]:
        key = _cache_key(lat, lng, radius, category)
        now = time.time()

        cached = self._cache.get(key)
        if cached:
            ts, data = cached
            if now - ts < CACHE_TTL:
                return data

        tags = CATEGORY_QUERIES.get(category)
        if not tags:
            return []

        q = self._overpass.build_query(tags, lat, lng, radius)
        try:
            raw = await self._overpass.query(q)
        except OverpassError:
            return []

        results = []
        for item in raw:
            dist = round(_haversine(lat, lng, item["latitude"], item["longitude"]), 3)
            results.append({
                "name": item["name"],
                "latitude": item["latitude"],
                "longitude": item["longitude"],
                "distance": dist,
                "address": item.get("address"),
            })

        results.sort(key=lambda r: r["distance"])
        self._cache[key] = (now, results)
        return results
