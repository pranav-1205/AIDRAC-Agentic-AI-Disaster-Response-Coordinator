import asyncio
from fastapi import APIRouter, Query
from app.services.location_service import LocationService, DEFAULT_RADIUS

router = APIRouter(prefix="/api/location", tags=["Location"])
_service = LocationService()

# ---------------------------------------------------------------------------
# Safe Destination scoring
# ---------------------------------------------------------------------------
# This scoring function is intentionally isolated because it will later be
# reused by the LangGraph Shelter Agent.  The agent will likely modify the
# score based on additional runtime factors such as:
#   - disaster type (flood, fire, earthquake)
#   - evacuation orders
#   - weather severity
#   - road accessibility
#   - shelter capacity / occupancy
#   - hospital emergency availability
#   - user emergency type (medical, fire, police, shelter)
#
# For now the score is purely weight × distance.  The function is a pure
# side-effect-free callable that can be unit-tested independently.
# ---------------------------------------------------------------------------

SAFE_DESTINATION_WEIGHTS: dict[str, float] = {
    "shelter": 1.0,
    "community_centre": 1.3,
    "school": 1.5,
    "hospital": 2.0,
    "police": 2.3,
    "firestation": 2.6,
}


def score_destination(
    destination_type: str,
    distance_km: float,
) -> float:
    weight = SAFE_DESTINATION_WEIGHTS.get(destination_type, 1.0)
    return weight * distance_km


@router.get("/nearby")
async def get_nearby(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    radius: int = Query(DEFAULT_RADIUS, ge=100, le=100_000),
):
    hospitals, shelters, community_centres, schools, police, firestations, pharmacies = await asyncio.gather(
        _service.get_nearby_hospitals(lat, lng, radius),
        _service.get_nearby_shelters(lat, lng, radius),
        _service.get_nearby_community_centres(lat, lng, radius),
        _service.get_nearby_schools(lat, lng, radius),
        _service.get_nearby_police(lat, lng, radius),
        _service.get_nearby_firestations(lat, lng, radius),
        _service.get_nearby_pharmacies(lat, lng, radius),
    )
    return {
        "hospitals": hospitals,
        "shelters": shelters,
        "community_centres": community_centres,
        "schools": schools,
        "police": police,
        "firestations": firestations,
        "pharmacies": pharmacies,
    }


@router.get("/safe-destination")
async def get_safe_destination(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    radius: int = Query(DEFAULT_RADIUS, ge=100, le=100_000),
):
    categories = await asyncio.gather(
        _service.get_nearby_hospitals(lat, lng, radius),
        _service.get_nearby_shelters(lat, lng, radius),
        _service.get_nearby_community_centres(lat, lng, radius),
        _service.get_nearby_schools(lat, lng, radius),
        _service.get_nearby_police(lat, lng, radius),
        _service.get_nearby_firestations(lat, lng, radius),
    )
    grouped = {
        "hospitals": categories[0],
        "shelters": categories[1],
        "community_centres": categories[2],
        "schools": categories[3],
        "police": categories[4],
        "firestations": categories[5],
    }

    best_score: float | None = None
    best_type: str | None = None
    best_item: dict | None = None

    for dest_type, cat_key in (
        ("shelter", "shelters"),
        ("community_centre", "community_centres"),
        ("school", "schools"),
        ("hospital", "hospitals"),
        ("police", "police"),
        ("firestation", "firestations"),
    ):
        items = grouped[cat_key]
        if not items:
            continue
        nearest = items[0]
        score = score_destination(dest_type, nearest["distance"])
        if best_score is None or score < best_score:
            best_score = score
            best_type = dest_type
            best_item = nearest

    if best_type and best_item:
        return {
            "destinationType": best_type,
            "destination": best_item,
        }

    return {
        "destinationType": None,
        "destination": None,
    }
