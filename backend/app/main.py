from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config.settings import settings
from app.database.connection import engine, Base, async_session_factory
from app.database.seed import seed_database
from app.routers import auth, users, shelters, hospitals, disasters, alerts, routes, weather, location, ai


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    await seed_database(async_session_factory())

    yield

    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(shelters.router)
app.include_router(hospitals.router)
app.include_router(disasters.router)
app.include_router(alerts.router)
app.include_router(routes.router)
app.include_router(weather.router)
app.include_router(location.router)
app.include_router(ai.router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": settings.VERSION}
