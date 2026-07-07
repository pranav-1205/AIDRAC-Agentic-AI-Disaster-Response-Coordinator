from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.database.connection import get_db
from app.schemas.route import RouteCreate, RouteResponse
from app.models.route import Route

router = APIRouter(prefix="/api/routes", tags=["Routes"])


@router.get("", response_model=List[RouteResponse])
async def get_routes(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Route).order_by(Route.id))
    routes = result.scalars().all()
    return [RouteResponse.model_validate(r) for r in routes]


@router.post("", response_model=RouteResponse, status_code=201)
async def create_route(data: RouteCreate, db: AsyncSession = Depends(get_db)):
    route = Route(**data.model_dump())
    db.add(route)
    await db.flush()
    await db.refresh(route)
    return route
