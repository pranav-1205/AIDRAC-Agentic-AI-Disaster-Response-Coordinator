from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime, timezone, timedelta

from app.database.connection import get_db
from app.models.user import User, UserRole
from app.models.alert import Alert
from app.models.sos import SOSIncident, SOSStatus
from app.models.disaster import Disaster
from app.models.alert_location import AlertLocation
from app.utils.dependencies import require_admin
from app.schemas.admin import (
    AdminOverviewResponse,
    AdminAlertResponse,
    AdminSOSResponse,
    AdminUserResponse,
    AdminIncidentHistoryResponse,
    AdminZoneStatsResponse,
    AdminResponderResponse,
)

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/overview", response_model=AdminOverviewResponse)
async def get_admin_overview(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    now = datetime.now(timezone.utc)

    # Active disaster alerts
    active_alerts_result = await db.execute(
        select(func.count(Alert.id)).where(
            Alert.is_active.is_(True),
            or_(Alert.expires_at.is_(None), Alert.expires_at >= now),
        )
    )
    active_alerts = active_alerts_result.scalar() or 0

    # Active SOS incidents
    active_sos_statuses = [
        SOSStatus.ACTIVE,
        SOSStatus.RECEIVED,
        SOSStatus.ACKNOWLEDGED,
        SOSStatus.AWAITING_RESPONDER,
        SOSStatus.RESPONDER_ASSIGNED,
        SOSStatus.RESPONDER_ACCEPTED,
        SOSStatus.ASSISTANCE_IN_PROGRESS,
        SOSStatus.ASSISTANCE_PROVIDED,
        SOSStatus.USER_CONFIRMED_SAFE,
    ]
    active_sos_result = await db.execute(
        select(func.count(SOSIncident.id)).where(
            SOSIncident.status.in_(active_sos_statuses)
        )
    )
    active_sos = active_sos_result.scalar() or 0

    # People in affected zones (users with location within alert polygons/radius)
    # For prototype: count users with recent location updates
    people_in_zones_result = await db.execute(
        select(func.count(User.id)).where(
            User.last_location_update.is_not(None),
            User.last_location_update >= now - timedelta(hours=24),
            User.location_visibility.is_(True),
        )
    )
    people_in_zones = people_in_zones_result.scalar() or 0

    # People marked safe (resolved SOS where victim confirmed safe)
    people_safe_result = await db.execute(
        select(func.count(SOSIncident.id)).where(
            SOSIncident.status == SOSStatus.USER_CONFIRMED_SAFE
        )
    )
    people_safe = people_safe_result.scalar() or 0

    # People requiring help (active SOS without responder)
    people_needing_help_result = await db.execute(
        select(func.count(SOSIncident.id)).where(
            SOSIncident.status.in_([
                SOSStatus.ACTIVE,
                SOSStatus.RECEIVED,
                SOSStatus.ACKNOWLEDGED,
                SOSStatus.AWAITING_RESPONDER,
            ])
        )
    )
    people_needing_help = people_needing_help_result.scalar() or 0

    # Available nearby responders (online users with location visibility)
    available_responders_result = await db.execute(
        select(func.count(User.id)).where(
            User.is_online.is_(True),
            User.location_visibility.is_(True),
            User.last_location_update >= now - timedelta(minutes=5),
            User.role == UserRole.USER,
        )
    )
    available_responders = available_responders_result.scalar() or 0

    # Active response tasks (SOS with responder assigned/in progress)
    active_tasks_result = await db.execute(
        select(func.count(SOSIncident.id)).where(
            SOSIncident.status.in_([
                SOSStatus.RESPONDER_ASSIGNED,
                SOSStatus.RESPONDER_ACCEPTED,
                SOSStatus.ASSISTANCE_IN_PROGRESS,
            ])
        )
    )
    active_tasks = active_tasks_result.scalar() or 0

    return AdminOverviewResponse(
        active_alerts=active_alerts,
        active_sos=active_sos,
        people_in_affected_zones=people_in_zones,
        people_marked_safe=people_safe,
        people_requiring_help=people_needing_help,
        available_responders=available_responders,
        active_response_tasks=active_tasks,
    )


@router.get("/alerts", response_model=List[AdminAlertResponse])
async def get_admin_alerts(
    active_only: bool = Query(True),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    now = datetime.now(timezone.utc)
    query = (
        select(Alert)
        .options(selectinload(Alert.locations))
        .order_by(Alert.created_at.desc())
    )

    if active_only:
        query = query.where(
            Alert.is_active.is_(True),
            or_(Alert.expires_at.is_(None), Alert.expires_at >= now),
        )

    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    alerts = result.scalars().all()

    return [
        AdminAlertResponse(
            id=a.id,
            title=a.title,
            message=a.message,
            severity=a.severity,
            created_at=a.created_at,
            external_id=a.external_id,
            expires_at=a.expires_at,
            event=a.event,
            urgency=a.urgency,
            certainty=a.certainty,
            area=a.area,
            is_active=a.is_active,
            polygons=a.polygons,
            source=a.source,
            latitude=a.latitude,
            longitude=a.longitude,
            location_source=a.location_source,
            locations=[
                {
                    "name": loc.name,
                    "latitude": loc.latitude,
                    "longitude": loc.longitude,
                    "location_source": loc.location_source,
                    "location_type": loc.location_type,
                    "state": loc.state,
                    "district": loc.district,
                    "resolved_order": loc.resolved_order,
                }
                for loc in a.locations
            ] if a.locations else [],
        )
        for a in alerts
    ]


@router.get("/sos", response_model=List[AdminSOSResponse])
async def get_admin_sos(
    status_filter: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    query = select(SOSIncident).order_by(SOSIncident.created_at.desc())

    if status_filter:
        try:
            sos_status = SOSStatus(status_filter)
            query = query.where(SOSIncident.status == sos_status)
        except ValueError:
            pass

    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    sos_incidents = result.scalars().all()

    response = []
    for sos in sos_incidents:
        victim = await db.execute(select(User).where(User.id == sos.reporting_user_id))
        victim_user = victim.scalar_one_or_none()

        responder_name = None
        if sos.assigned_responder_id:
            responder = await db.execute(select(User).where(User.id == sos.assigned_responder_id))
            responder_user = responder.scalar_one_or_none()
            responder_name = responder_user.full_name if responder_user else None

        response.append(AdminSOSResponse(
            id=sos.id,
            reporting_user_id=sos.reporting_user_id,
            reporting_user_name=victim_user.full_name if victim_user else None,
            assigned_responder_id=sos.assigned_responder_id,
            assigned_responder_name=responder_name,
            latitude=sos.latitude,
            longitude=sos.longitude,
            location_accuracy=sos.location_accuracy,
            location_timestamp=sos.location_timestamp,
            emergency_type=sos.emergency_type,
            emergency_details=sos.emergency_details,
            status=sos.status,
            responder_type=sos.responder_type,
            created_at=sos.created_at,
            updated_at=sos.updated_at,
            accepted_at=sos.accepted_at,
            resolved_at=sos.resolved_at,
        ))

    return response


@router.get("/responders", response_model=List[AdminResponderResponse])
async def get_admin_responders(
    active_only: bool = Query(True),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    now = datetime.now(timezone.utc)
    query = select(User).where(User.role == UserRole.USER)

    if active_only:
        query = query.where(
            User.is_online.is_(True),
            User.location_visibility.is_(True),
            User.last_location_update >= now - timedelta(minutes=5),
        )

    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    users = result.scalars().all()

    response = []
    for user in users:
        # Get active SOS for this responder
        active_sos = await db.execute(
            select(SOSIncident).where(
                SOSIncident.assigned_responder_id == user.id,
                SOSIncident.status.in_([
                    SOSStatus.RESPONDER_ASSIGNED,
                    SOSStatus.RESPONDER_ACCEPTED,
                    SOSStatus.ASSISTANCE_IN_PROGRESS,
                    SOSStatus.ASSISTANCE_PROVIDED,
                ])
            ).order_by(SOSIncident.created_at.desc())
        )
        sos = active_sos.scalars().first()

        response.append(AdminResponderResponse(
            id=user.id,
            full_name=user.full_name,
            email=user.email,
            last_latitude=user.last_latitude,
            last_longitude=user.last_longitude,
            location_accuracy=user.location_accuracy,
            last_location_update=user.last_location_update,
            is_online=user.is_online,
            active_sos_id=sos.id if sos else None,
            active_sos_status=sos.status if sos else None,
        ))

    return response


@router.get("/users", response_model=List[AdminUserResponse])
async def get_admin_users(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    result = await db.execute(
        select(User).order_by(User.created_at.desc()).limit(limit).offset(offset)
    )
    users = result.scalars().all()

    return [
        AdminUserResponse(
            id=u.id,
            full_name=u.full_name,
            email=u.email,
            role=u.role,
            last_latitude=u.last_latitude,
            last_longitude=u.last_longitude,
            location_accuracy=u.location_accuracy,
            last_location_update=u.last_location_update,
            location_visibility=u.location_visibility,
            is_online=u.is_online,
            created_at=u.created_at if hasattr(u, 'created_at') else None,
        )
        for u in users
    ]


@router.get("/incidents", response_model=List[AdminIncidentHistoryResponse])
async def get_admin_incidents(
    status_filter: Optional[str] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    query = select(SOSIncident).order_by(SOSIncident.created_at.desc())

    if status_filter:
        try:
            sos_status = SOSStatus(status_filter)
            query = query.where(SOSIncident.status == sos_status)
        except ValueError:
            pass

    if date_from:
        query = query.where(SOSIncident.created_at >= date_from)
    if date_to:
        query = query.where(SOSIncident.created_at <= date_to)

    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    incidents = result.scalars().all()

    response = []
    for sos in incidents:
        victim = await db.execute(select(User).where(User.id == sos.reporting_user_id))
        victim_user = victim.scalar_one_or_none()

        responder_name = None
        if sos.assigned_responder_id:
            responder = await db.execute(select(User).where(User.id == sos.assigned_responder_id))
            responder_user = responder.scalar_one_or_none()
            responder_name = responder_user.full_name if responder_user else None

        response.append(AdminIncidentHistoryResponse(
            id=sos.id,
            reporting_user_id=sos.reporting_user_id,
            reporting_user_name=victim_user.full_name if victim_user else None,
            assigned_responder_id=sos.assigned_responder_id,
            assigned_responder_name=responder_name,
            latitude=sos.latitude,
            longitude=sos.longitude,
            location_accuracy=sos.location_accuracy,
            emergency_type=sos.emergency_type,
            emergency_details=sos.emergency_details,
            status=sos.status,
            responder_type=sos.responder_type,
            created_at=sos.created_at,
            updated_at=sos.updated_at,
            accepted_at=sos.accepted_at,
            resolved_at=sos.resolved_at,
        ))

    return response


@router.get("/zone-stats", response_model=AdminZoneStatsResponse)
async def get_admin_zone_stats(
    disaster_id: Optional[int] = Query(None),
    alert_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    now = datetime.now(timezone.utc)

    # Get the disaster/alert to determine the zone
    target_lat = None
    target_lng = None
    radius_km = 50  # default zone radius

    if alert_id:
        alert_result = await db.execute(select(Alert).where(Alert.id == alert_id))
        alert = alert_result.scalar_one_or_none()
        if alert:
            if alert.latitude and alert.longitude:
                target_lat = alert.latitude
                target_lng = alert.longitude
            elif alert.locations:
                target_lat = alert.locations[0].latitude
                target_lng = alert.locations[0].longitude

    if disaster_id and (target_lat is None):
        disaster_result = await db.execute(select(Disaster).where(Disaster.id == disaster_id))
        disaster = disaster_result.scalar_one_or_none()
        if disaster:
            target_lat = disaster.latitude
            target_lng = disaster.longitude

    if target_lat is None or target_lng is None:
        return AdminZoneStatsResponse(
            total_people_detected=0,
            people_requiring_help=0,
            active_sos=0,
            people_helped=0,
            people_marked_safe=0,
            responders_active=0,
        )

    # Find users in the affected zone (within radius_km)
    from math import radians, sin, cos, sqrt, atan2

    def haversine(lat1, lng1, lat2, lng2):
        R = 6371
        dlat = radians(lat2 - lat1)
        dlng = radians(lng2 - lng1)
        a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng/2)**2
        return 2 * atan2(sqrt(a), sqrt(1-a)) * R

    users_result = await db.execute(
        select(User).where(
            User.last_latitude.is_not(None),
            User.last_longitude.is_not(None),
            User.last_location_update >= now - timedelta(hours=24),
            User.location_visibility.is_(True),
        )
    )
    users = users_result.scalars().all()

    people_in_zone = []
    for u in users:
        dist = haversine(target_lat, target_lng, u.last_latitude, u.last_longitude)
        if dist <= radius_km:
            people_in_zone.append(u)

    total_people = len(people_in_zone)

    # Count active SOS in zone
    sos_result = await db.execute(
        select(SOSIncident).where(
            SOSIncident.status.in_([
                SOSStatus.ACTIVE,
                SOSStatus.RECEIVED,
                SOSStatus.ACKNOWLEDGED,
                SOSStatus.AWAITING_RESPONDER,
                SOSStatus.RESPONDER_ASSIGNED,
                SOSStatus.RESPONDER_ACCEPTED,
                SOSStatus.ASSISTANCE_IN_PROGRESS,
                SOSStatus.ASSISTANCE_PROVIDED,
                SOSStatus.USER_CONFIRMED_SAFE,
            ])
        )
    )
    all_active_sos = sos_result.scalars().all()

    active_sos_in_zone = 0
    for sos in all_active_sos:
        dist = haversine(target_lat, target_lng, sos.latitude, sos.longitude)
        if dist <= radius_km:
            active_sos_in_zone += 1

    # People requiring help (SOS without responder in zone)
    people_needing_help = 0
    for sos in all_active_sos:
        dist = haversine(target_lat, target_lng, sos.latitude, sos.longitude)
        if dist <= radius_km and sos.assigned_responder_id is None:
            people_needing_help += 1

    # People helped (SOS with responder in zone)
    people_helped = 0
    for sos in all_active_sos:
        dist = haversine(target_lat, target_lng, sos.latitude, sos.longitude)
        if dist <= radius_km and sos.assigned_responder_id is not None:
            people_helped += 1

    # People marked safe (resolved SOS in zone)
    people_safe = 0
    for sos in all_active_sos:
        dist = haversine(target_lat, target_lng, sos.latitude, sos.longitude)
        if dist <= radius_km and sos.status == SOSStatus.USER_CONFIRMED_SAFE:
            people_safe += 1

    # Active responders in zone
    responders_active = 0
    for u in people_in_zone:
        if u.is_online and u.location_visibility and u.last_location_update and u.last_location_update >= now - timedelta(minutes=5):
            responders_active += 1

    return AdminZoneStatsResponse(
        total_people_detected=total_people,
        people_requiring_help=people_needing_help,
        active_sos=active_sos_in_zone,
        people_helped=people_helped,
        people_marked_safe=people_safe,
        responders_active=responders_active,
    )


@router.post("/sos/{sos_id}/acknowledge")
async def admin_acknowledge_sos(
    sos_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    from app.services.sos import SOSService
    service = SOSService(db)
    sos = await service.update_sos_status(sos_id, current_user, SOSStatus.ACKNOWLEDGED)
    return {"success": True, "sos_id": sos.id, "status": sos.status}


@router.post("/sos/{sos_id}/assign")
async def admin_assign_responder_to_sos(
    sos_id: int,
    responder_id: int = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    from app.services.sos import SOSService
    service = SOSService(db)

    # Verify responder exists
    responder_result = await db.execute(select(User).where(User.id == responder_id))
    responder = responder_result.scalar_one_or_none()
    if not responder:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Responder not found")

    sos = await service.admin_override_responder(sos_id, responder_id)
    return {"success": True, "sos_id": sos.id, "responder_id": responder_id, "status": sos.status}


@router.post("/sos/{sos_id}/status")
async def admin_update_sos_status(
    sos_id: int,
    status: SOSStatus,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    from app.services.sos import SOSService
    service = SOSService(db)
    sos = await service.update_sos_status(sos_id, current_user, status)
    return {"success": True, "sos_id": sos.id, "status": sos.status}