import asyncio
from fastapi import APIRouter, Query
from app.services.location_service import LocationService, DEFAULT_RADIUS

router = APIRouter(prefix="/api/location", tags=["Location"])
_service = LocationService()


@router.get("/nearby")
async def get_nearby(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    radius: int = Query(DEFAULT_RADIUS, ge=100, le=50_000),
):
    hospitals, shelters, police, firestations, pharmacies = await asyncio.gather(
        _service.get_nearby_hospitals(lat, lng, radius),
        _service.get_nearby_shelters(lat, lng, radius),
        _service.get_nearby_police(lat, lng, radius),
        _service.get_nearby_firestations(lat, lng, radius),
        _service.get_nearby_pharmacies(lat, lng, radius),
    )
    return {
        "hospitals": hospitals,
        "shelters": shelters,
        "police": police,
        "firestations": firestations,
        "pharmacies": pharmacies,
    }
