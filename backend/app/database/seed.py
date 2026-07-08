from sqlalchemy.ext.asyncio import AsyncSession
from app.models.shelter import Shelter
from app.models.hospital import Hospital
from app.models.disaster import Disaster
from app.models.route import Route
from app.models.user import User
from app.utils.security import hash_password


async def seed_database(db: AsyncSession):
    result = await db.execute(User.__table__.select().limit(1))
    if result.fetchone():
        return

    admin = User(
        full_name="Admin User",
        email="admin@aidrac.com",
        password=hash_password("admin123"),
        role="admin",
    )
    user = User(
        full_name="Test User",
        email="user@aidrac.com",
        password=hash_password("user123"),
        role="user",
    )
    db.add_all([admin, user])
    await db.flush()

    shelters = [
        Shelter(name="City Convention Center", latitude=28.6129, longitude=77.2295, capacity=500, occupancy=230, phone="+91-1111111111", address="Convention Center Rd, New Delhi"),
        Shelter(name="Community Hall A", latitude=28.6200, longitude=77.2400, capacity=200, occupancy=120, phone="+91-1111111112", address="Block A, Community Center"),
        Shelter(name="School Ground Shelter", latitude=28.5900, longitude=77.2100, capacity=300, occupancy=180, phone="+91-1111111113", address="Green Field School"),
        Shelter(name="Sports Complex", latitude=28.6300, longitude=77.2500, capacity=400, occupancy=250, phone="+91-1111111114", address="Sports Authority Complex"),
        Shelter(name="Relief Camp Alpha", latitude=28.6000, longitude=77.2000, capacity=350, occupancy=200, phone="+91-1111111115", address="Alpha Zone, Relief Area"),
        Shelter(name="Community Hall B", latitude=28.6150, longitude=77.2350, capacity=150, occupancy=80, phone="+91-1111111116", address="Block B, Community Center"),
        Shelter(name="Stadium Shelter", latitude=28.6400, longitude=77.2600, capacity=600, occupancy=320, phone="+91-1111111117", address="City Stadium Complex"),
        Shelter(name="College Auditorium", latitude=28.6050, longitude=77.2250, capacity=250, occupancy=150, phone="+91-1111111118", address="University Campus"),
        Shelter(name="Temple Complex Shelter", latitude=28.6250, longitude=77.2450, capacity=180, occupancy=90, phone="+91-1111111119", address="Temple Road"),
        Shelter(name="Warehouse Shelter", latitude=28.5950, longitude=77.2150, capacity=450, occupancy=280, phone="+91-1111111120", address="Industrial Area"),
    ]
    db.add_all(shelters)
    await db.flush()

    hospitals = [
        Hospital(name="AIIMS Delhi", latitude=28.5678, longitude=77.2100, emergency_available=True, phone="+91-2222222221", address="AIIMS Campus, Ansari Nagar"),
        Hospital(name="Max Hospital Saket", latitude=28.5800, longitude=77.2200, emergency_available=True, phone="+91-2222222222", address="Saket, New Delhi"),
        Hospital(name="Apollo Hospital", latitude=28.5900, longitude=77.2300, emergency_available=True, phone="+91-2222222223", address="Sarita Vihar, New Delhi"),
        Hospital(name="Fortis Hospital", latitude=28.5600, longitude=77.2000, emergency_available=True, phone="+91-2222222224", address="Shalimar Bagh, New Delhi"),
        Hospital(name="Medanta Medicity", latitude=28.6100, longitude=77.2400, emergency_available=True, phone="+91-2222222225", address="Gurugram"),
        Hospital(name="Sir Ganga Ram Hospital", latitude=28.6350, longitude=77.2550, emergency_available=True, phone="+91-2222222226", address="Rajinder Nagar, New Delhi"),
        Hospital(name="BLK Hospital", latitude=28.6200, longitude=77.2200, emergency_available=False, phone="+91-2222222227", address="Pusa Road, New Delhi"),
        Hospital(name="Holy Family Hospital", latitude=28.5750, longitude=77.2150, emergency_available=True, phone="+91-2222222228", address="Okhla Road, New Delhi"),
        Hospital(name="Moolchand Hospital", latitude=28.6050, longitude=77.2350, emergency_available=True, phone="+91-2222222229", address="Moolchand Flyover, New Delhi"),
        Hospital(name="St. Stephen's Hospital", latitude=28.6450, longitude=77.2650, emergency_available=True, phone="+91-2222222230", address="Tis Hazari, New Delhi"),
    ]
    db.add_all(hospitals)
    await db.flush()

    disasters = [
        Disaster(type="Flood", severity="critical", latitude=28.6000, longitude=77.1900, description="Severe flooding in low-lying areas of South Delhi. Water levels rising rapidly.", status="active"),
        Disaster(type="Cyclone", severity="severe", latitude=28.6300, longitude=77.2700, description="Cyclone approaching Eastern Delhi. High-speed winds expected.", status="active"),
        Disaster(type="Earthquake", severity="moderate", latitude=28.5800, longitude=77.2400, description="Moderate earthquake tremors felt across the region. Aftershocks possible.", status="active"),
        Disaster(type="Flood", severity="high", latitude=28.6200, longitude=77.2100, description="Flooding in Yamuna river basin areas. Evacuation recommended.", status="active"),
        Disaster(type="Fire", severity="critical", latitude=28.6100, longitude=77.2500, description="Major fire in industrial area. Toxic smoke spreading.", status="contained"),
    ]
    db.add_all(disasters)
    await db.flush()

    routes = [
        Route(source_lat=28.6000, source_lng=77.1900, destination_lat=28.6129, destination_lng=77.2295, estimated_time=15.0, distance_km=4.2),
        Route(source_lat=28.6300, source_lng=77.2700, destination_lat=28.6400, destination_lng=77.2600, estimated_time=10.0, distance_km=2.1),
        Route(source_lat=28.5800, source_lng=77.2400, destination_lat=28.5678, destination_lng=77.2100, estimated_time=20.0, distance_km=5.5),
    ]
    db.add_all(routes)
    await db.flush()
    await db.commit()