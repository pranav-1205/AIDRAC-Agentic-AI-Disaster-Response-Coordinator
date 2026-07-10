# AIDRAC — Agentic AI Disaster Response Coordinator

A full-stack disaster management application that helps citizens during natural disasters by providing safe evacuation routes, nearby shelters, hospitals, police stations, fire stations, pharmacies, real-time weather information, live government emergency alerts, and AI-powered decision support.

## Features

- **JWT Authentication** — register, login, token-based session management with auto-redirect on 401
- **Interactive Map** — Leaflet-based map with standard/satellite/terrain tile layers, custom POI markers, disaster zones with severity-based circles, CAP alert polygons with severity-colored fills, and layer filter chips
- **Live OpenStreetMap Infrastructure** — real-time Overpass API queries for nearby shelters, hospitals, police stations, fire stations, pharmacies, community centres, and schools (7 categories, 3-server retry chain, 10-minute TTL cache)
- **Nearby Hospitals & Shelters** — dedicated pages showing live OSM data sorted by distance, with GPS location prompt
- **Emergency SOS** — floating button for quick access to the map with routing to nearest facility
- **Route Generation** — walking routes with turn-by-turn directions via OpenRouteService or OSRM public API (frontend), or OSRM with straight-line Haversine fallback (backend LangGraph agents)
- **Safe Destination Scoring** — weighted algorithm that selects the best nearby facility by type and distance
- **Live Weather** — current conditions from OpenWeatherMap API with 5-minute auto-refresh; requires API key
- **Government CAP Alert Ingestion** — fetches IMD and NDMA CAP alerts from RSS feeds with background polling every 5 minutes, deduplication, soft-delete, and 30-day retention cleanup; includes polygon-based geofencing for location-aware filtering and map visualization of alert polygons with severity coloring
- **AI Decision Assistant** — Gemini-powered multi-agent system (Weather, Alert, Infrastructure, Route, Coordinator) that answers emergency questions and provides structured recommendations with risk level, destination, reasoning, and action checklist; includes deterministic fallback when Gemini is unavailable; supports incident memory via optional `incident_id`
- **User Settings Persistence** — theme (dark/light/system), accent color (sapphire/amber/emerald), notification toggles, emergency radius (5-100 km), minimum alert severity filter, map type, auto-locate, government data layer toggle, user disaster layer toggle, larger text, reduced motion; persisted to both localStorage and backend
- **Theme Switching** — dark mode, light mode, and system-aware theme with CSS variables
- **Accent Color Switching** — sapphire, amber, and emerald accent palettes applied via CSS variables
- **Admin Dashboard** — overview of shelters with occupancy stats, hospitals with emergency readiness, active disasters table with severity badges, and system status
- **PostgreSQL Persistence** — all users, settings, shelters, hospitals, disasters, alerts, and routes stored in PostgreSQL

## Technology Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| React 18 + TypeScript | UI framework with type safety |
| Vite 6 | Build tool and dev server |
| Tailwind CSS 3 | Utility-first styling with CSS variable theming |
| React Router 6 | Client-side routing with auth guards |
| Leaflet + react-leaflet | Interactive map rendering |
| Axios | HTTP client with JWT interceptor |
| Geist font | UI typography |
| Lucide React + Material Symbols | Icon libraries |

### Backend

| Technology | Purpose |
|------------|---------|
| Python 3.12+ | Runtime |
| FastAPI | Async web framework |
| SQLAlchemy 2.0 | Async ORM with PostgreSQL |
| Pydantic v2 | Request/response validation |
| JWT (python-jose) | Token authentication |
| bcrypt (passlib) | Password hashing |
| LangGraph | Multi-agent orchestration graph |
| google-genai | Gemini AI client |
| httpx | Async HTTP for external APIs |

### Database

- **PostgreSQL 16** — primary data store

### Maps

- **OpenStreetMap** — tile layers and map data
- **Overpass API** — real-time infrastructure queries (3-server retry chain)
- **Leaflet** — map rendering library

### Weather

- **OpenWeatherMap API** — current weather data by GPS coordinates

### Routing

- **OpenRouteService API** — primary foot-walking routing (frontend)
- **OSRM Public API** — routing provider used by both frontend and backend
- **Haversine Formula** — straight-line distance fallback (backend)

### Authentication

- **JWT (HS256)** — bearer token auth with 60-minute expiry
- **bcrypt** — password hashing

## Architecture Overview

```
Browser
   │
   ▼
┌─────────────────┐
│   Frontend      │  React + Vite + Tailwind
│   :5173 (dev)   │  :80 (prod)
│   :80 (Docker)  │
└────────┬────────┘
         │ HTTP /api/*
         ▼
┌─────────────────┐
│   Backend       │  FastAPI + SQLAlchemy
│   :8000         │  uvicorn
└────────┬────────┘
         │
    ┌────┼────────────┬──────────────────┐
    ▼    ▼            ▼                  ▼
┌──────┐ ┌──────┐ ┌─────────┐ ┌────────────────┐
│Post- │ │Over- │ │Open-    │ │IMD / NDMA      │
│greSQL│ │pass  │ │Weather  │ │CAP RSS Feeds   │
│ 16   │ │API   │ │API      │ │(background     │
│      │ │(OSM) │ │         │ │ polling)        │
└──────┘ └──────┘ └─────────┘ └────────────────┘
                     ┌─────────────┐
                     │OpenRoute-   │
                     │Service /    │
                     │OSRM Public  │
                     │API          │
                     └─────────────┘
                     ┌─────────────┐
                     │Gemini AI    │
                     │API          │
                     └─────────────┘
```

## Installation

### Prerequisites

- Python 3.12+
- Node.js 20+
- PostgreSQL 16+
- Docker (optional)

### Docker Setup

```bash
cp .env.example .env
# Edit .env with your API keys
docker-compose up --build
```

- Frontend: http://localhost:80
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Manual Setup

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp .env.example .env
# Edit .env with database credentials and API keys
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Environment Variables

### Backend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | `postgresql+asyncpg://aidrac:aidrac@localhost:5432/aidrac` | PostgreSQL connection string |
| `SECRET_KEY` | Yes | — | JWT signing secret |
| `OPENWEATHER_API_KEY` | No | — | OpenWeatherMap API key (weather unavailable if not set) |
| `GEMINI_API_KEY` | No | — | Google Gemini API key (AI falls back to deterministic if not set) |
| `GEMINI_MODEL` | No | `gemini-2.5-flash` | Gemini model identifier |
| `OVERPASS_API_URL` | No | `https://overpass.openstreetmap.fr/api/interpreter` | Primary Overpass endpoint (falls back to overpass-api.de, kumi.systems) |
| `IMD_CAP_RSS_URL` | No | `https://cap-sources.s3.amazonaws.com/in-imd-en/rss.xml` | IMD CAP RSS feed URL |
| `NDMA_CAP_RSS_URL` | No | `https://sachet.ndma.gov.in/cap_public_website/rss/rss_india.xml` | NDMA CAP RSS feed URL |
| `REFRESH_INTERVAL_SECONDS` | No | `300` | Background alert refresh interval |
| `ALERT_RETENTION_DAYS` | No | `30` | Days to retain expired alerts |
| `CACHE_TTL_SECONDS` | No | `300` | Overpass cache TTL |

### Frontend

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_ORS_API_KEY` | No | OpenRouteService API key (OSRM public fallback if empty) |

## Project Structure

```
aidrac/
├── backend/
│   ├── app/
│   │   ├── ai/                # Gemini client and prompt templates
│   │   ├── langgraph/         # Multi-agent graph (state, nodes, context builder)
│   │   ├── config/            # Application settings
│   │   ├── database/          # DB connection and seed data
│   │   ├── disaster_sources/  # CAP RSS/XML ingestion providers
│   │   ├── models/            # SQLAlchemy ORM models
│   │   ├── schemas/           # Pydantic request/response schemas
│   │   ├── routers/           # API route handlers
│   │   ├── services/          # Business logic layer
│   │   └── utils/             # Auth dependencies
│   ├── alembic/               # Database migrations
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Route pages
│   │   ├── services/          # API client (single api.ts)
│   │   ├── hooks/             # Custom hooks (useApi, useGeolocation, useWeather)
│   │   ├── utils/             # Helper functions
│   │   ├── context/           # Auth and Settings contexts
│   │   └── types/             # TypeScript type definitions
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
└── README.md
```

## Screenshots

<!-- Screenshots will be added here once captured -->

## Known Limitations

- **NDMA CAP RSS feed is frequently rate-limited** — returns HTTP 302 to a rate-limit page, limiting NDMA alert availability. IMD feed works reliably.
- **Browser notifications utility exists but is not wired** — `showBrowserNotification()` and `playAlertSound()` are defined but never triggered by any event. Only `requestNotificationPermission()` is called on app mount.
- **AI recommendations require a Gemini API key** — the deterministic fallback provides basic recommendations without it, but quality is limited.
- **OpenRouteService API key is recommended** for reliable frontend routing; OSRM public fallback may be rate-limited.
- **Hospitals admin API is read-only** — only GET and POST exist; no update or delete endpoints for hospitals.
- **Weather API key is required for live data** — if `OPENWEATHER_API_KEY` is not set, the backend returns an error.
- **No offline support** — the application requires a live network connection.
- **No push notification delivery** — browser permission is requested, but no actual notifications are sent to the user.

## Future Roadmap

See [ROADMAP.md](ROADMAP.md) for planned features and development priorities.

## License

MIT
