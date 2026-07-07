# AIDRAC — Project Context

## Overview

**AIDRAC (Agentic AI Disaster Response Coordinator)** is a full-stack disaster management application that helps citizens during natural disasters such as floods, cyclones, and earthquakes. It provides safe evacuation routes, nearby shelters, hospitals, real-time weather information, and emergency alerts through an interactive geographic interface.

The project is architected in phases. Phase 1 established the core platform (auth, database, CRUD APIs, mapping), and Phase 2 added real-time geolocation, routing, and GPS-based weather. Phase 3.1 added live infrastructure from OpenStreetMap (shelters, hospitals, police, fire stations, pharmacies). Phase 3.2+ will introduce Agentic AI orchestration.

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI framework |
| TypeScript | 5.6.3 | Type safety |
| Vite | 6.0.3 | Build tool & dev server |
| Tailwind CSS | 3.4.16 | Utility-first styling |
| React Router | 6.28.0 | Client-side routing |
| Leaflet | 1.9.4 | Map rendering |
| react-leaflet | 4.2.1 | React bindings for Leaflet |
| Axios | 1.7.7 | HTTP client |
| Lucide React | 0.460.0 | Icon library |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.12+ | Runtime |
| FastAPI | 0.115.0 | Async web framework |
| SQLAlchemy | 2.0.36 | Async ORM |
| PostgreSQL | 16 | Relational database |
| asyncpg | 0.30.0 | Async PostgreSQL driver |
| Pydantic | 2.10.0 | Validation & settings |
| Alembic | 1.14.0 | Database migrations |
| python-jose | 3.3.0 | JWT encoding/decoding |
| passlib | 1.7.4 | Password hashing (bcrypt) |
| httpx | 0.28.0 | Async HTTP client |
| uvicorn | 0.31.0 | ASGI server |

### DevOps
| Tool | Purpose |
|------|---------|
| Docker | Containerization |
| Docker Compose | Multi-service orchestration |
| Nginx | Production frontend serving & API reverse proxy |

---

## Project Structure

```
aidrac/
├── .env                    # Docker Compose environment (gitignored)
├── .env.example            # Template for required env vars
├── .gitignore
├── docker-compose.yml      # PostgreSQL + Backend + Frontend
├── README.md
├── docs/
│   ├── CHANGELOG_AI.md
│   └── PROJECT_CONTEXT.md
├── backend/
│   ├── .env                # Backend local dev environment (gitignored)
│   ├── .env.example
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/
│   │   ├── env.py          # Async Alembic environment
│   │   ├── script.py.mako
│   │   └── versions/
│   └── app/
│       ├── __init__.py
│       ├── main.py         # FastAPI app with lifespan (create tables + seed)
│       ├── config/
│       │   └── settings.py # Pydantic BaseSettings (env vars)
│       ├── database/
│       │   ├── connection.py # Async engine, session factory, Base
│       │   └── seed.py      # Demo data seeder (10 shelters, 10 hospitals, etc.)
│       ├── models/          # SQLAlchemy ORM models
│       │   ├── user.py      # User with role enum (admin/user)
│       │   ├── shelter.py   # Shelter with capacity/occupancy tracking
│       │   ├── hospital.py  # Hospital with emergency_available flag
│       │   ├── disaster.py  # Disaster with severity, status, timestamp
│       │   ├── alert.py     # Alert with FK to disaster
│       │   └── route.py     # Pre-defined evacuation route
│       ├── schemas/         # Pydantic v2 request/response schemas
│       │   ├── user.py      # UserCreate, UserLogin, UserResponse, TokenResponse
│       │   ├── shelter.py   # ShelterCreate, ShelterUpdate, ShelterResponse
│       │   ├── hospital.py  # HospitalCreate, HospitalResponse
│       │   ├── disaster.py  # DisasterCreate, DisasterResponse
│       │   ├── alert.py     # AlertCreate, AlertResponse
│       │   └── route.py     # RouteCreate, RouteResponse
│       ├── routers/         # FastAPI route handlers
│       │   ├── auth.py      # POST /api/auth/register, /login
│       │   ├── users.py     # GET /api/users/me
│       │   ├── shelters.py  # CRUD /api/shelters
│       │   ├── hospitals.py # GET/POST /api/hospitals
│       │   ├── disasters.py # GET/POST /api/disasters, /api/disasters/active
│       │   ├── alerts.py    # GET/POST /api/alerts
│       │   ├── routes.py    # GET/POST /api/routes
│       │   └── weather.py   # GET /api/weather?lat=&lng=
│       ├── services/        # Business logic layer
│       │   ├── auth.py      # Register/login with hashing
│       │   ├── shelter.py   # CRUD with 404 handling
│       │   ├── hospital.py  # Read/create
│       │   ├── disaster.py  # List active, ordered by date
│       │   ├── alert.py     # List with optional disaster join
│       │   └── weather.py   # OpenWeatherMap API + mock fallback
│       └── utils/
│           ├── security.py  # bcrypt hashing, JWT create/decode
│           └── dependencies.py # get_current_user, require_admin
└── frontend/
    ├── .env.example
    ├── Dockerfile
    ├── nginx.conf
    ├── index.html
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── tsconfig.json
    └── src/
        ├── vite-env.d.ts
        ├── main.tsx          # React entry with BrowserRouter + AuthProvider
        ├── App.tsx           # Route definitions with lazy-loaded MapPage
        ├── index.css         # Tailwind directives + custom component classes
        ├── types/
        │   └── index.ts      # All TypeScript interfaces
        ├── services/
        │   └── api.ts        # Axios instance with JWT interceptors
        ├── context/
        │   └── AuthContext.tsx # Auth state management
        ├── hooks/
        │   ├── useApi.ts      # Generic async data fetcher
        │   ├── useGeolocation.ts # Browser GPS with watchPosition
        │   └── useWeather.ts  # Polling weather hook (5-min refresh)
        ├── utils/
        │   ├── haversine.ts   # Distance calculations
        │   └── routing.ts     # ORS -> OSRM -> straight-line fallback
        ├── components/
        │   ├── AppLayout.tsx   # Sidebar + Navbar + content
        │   ├── Sidebar.tsx     # Navigation with admin link
        │   ├── Navbar.tsx      # User info + logout
        │   ├── ProtectedRoute.tsx # Auth & role guard
        │   ├── DashboardCard.tsx # Stat card with color themes
        │   ├── EmergencyButton.tsx # Floating emergency + route finder
        │   ├── LocationStatus.tsx  # GPS status indicator
        │   ├── RoutePanel.tsx  # Route details + directions
        │   ├── LoadingSpinner.tsx
        │   ├── ErrorState.tsx
        │   └── EmptyState.tsx
        └── pages/
            ├── Landing.tsx     # Public hero page
            ├── Login.tsx       # Auth form with demo credentials
            ├── Register.tsx    # Registration form
            ├── Dashboard.tsx   # Overview with weather + alerts + disasters
            ├── MapPage.tsx     # Interactive map with all features
            ├── Shelters.tsx    # Shelter directory
            ├── Hospitals.tsx   # Hospital directory
            ├── AlertsPage.tsx  # Alert feed
            ├── Admin.tsx       # Admin statistics
            └── NotFound.tsx    # 404 page
```

---

## Architecture Decisions

### Backend Architecture

1. **Service Layer Pattern**: Business logic lives in `services/`, not in routers. Routers are thin HTTP adapters. This enables reuse and prepares for AI agent integration.

2. **Dependency Injection**: Services receive `AsyncSession` via constructor injection. Auth dependencies use FastAPI's `Depends()` for token extraction and user resolution.

3. **Async Everything**: SQLAlchemy's async engine (`create_async_engine`) with `asyncpg` driver. All route handlers and service methods are `async def`.

4. **Lifespan Auto-Migration**: Tables are created on startup via `Base.metadata.create_all` inside the FastAPI lifespan. Seed data is applied immediately after. No separate migration step needed for development.

5. **JWT Auth**: Access tokens contain `sub` (user ID) and `role` claims. Token extraction via `HTTPBearer`. Admin routes protected by `require_admin` dependency.

6. **Mock Fallback**: The weather service returns mock data when no API key is configured, enabling full local development without external dependencies.

### Frontend Architecture

1. **Custom Hooks for Side Effects**: `useApi` handles generic data fetching with loading/error states. `useGeolocation` encapsulates the entire browser Geolocation API lifecycle. `useWeather` adds polling on top of `useApi`.

2. **Utility-First Distance Calculations**: `haversine.ts` provides pure functions for geographic math, used by both MapPage and EmergencyButton for nearest-item detection. No external GIS library needed.

3. **Three-Tier Routing Fallback**: `routing.ts` tries OpenRouteService (requires API key), falls back to OSRM public API (free, no key), and finally computes a straight-line approximation with Haversine. The `provider` field in `RouteInfo` tracks which source was used.

4. **Lazy-Loaded Map**: `MapPage` is loaded via `React.lazy()` + `Suspense` to avoid pulling Leaflet into the initial bundle. The map component is only loaded when the user navigates to `/map`.

5. **Memoized Nearest Calculations**: `useMemo` wraps `findNearest` and `sortByDistance` calls in MapPage, recomputing only when `shelters`, `hospitals`, or `position` changes. This prevents expensive Haversine recalculations on every render.

6. **State-Based Emergency Navigation**: The EmergencyButton computes nearest shelter/hospital and passes them as React Router `state` to the MapPage. No shared context or global state needed.

---

## Database Schema

### `users`
| Column | Type | Constraints |
|--------|------|-------------|
| id | Integer | PK, auto-increment, indexed |
| full_name | String(255) | NOT NULL |
| email | String(255) | NOT NULL, UNIQUE, indexed |
| password | String(255) | NOT NULL (bcrypt hash) |
| role | Enum(admin, user) | NOT NULL, default 'user' |

### `shelters`
| Column | Type | Constraints |
|--------|------|-------------|
| id | Integer | PK, indexed |
| name | String(255) | NOT NULL |
| latitude | Float | NOT NULL |
| longitude | Float | NOT NULL |
| capacity | Integer | NOT NULL |
| occupancy | Integer | default 0 |
| phone | String(20) | nullable |
| address | String(500) | nullable |

### `hospitals`
| Column | Type | Constraints |
|--------|------|-------------|
| id | Integer | PK, indexed |
| name | String(255) | NOT NULL |
| latitude | Float | NOT NULL |
| longitude | Float | NOT NULL |
| emergency_available | Boolean | default true |
| phone | String(20) | nullable |
| address | String(500) | nullable |

### `disasters`
| Column | Type | Constraints |
|--------|------|-------------|
| id | Integer | PK, indexed |
| type | String(100) | NOT NULL |
| severity | String(50) | NOT NULL |
| latitude | Float | NOT NULL |
| longitude | Float | NOT NULL |
| description | String(1000) | nullable |
| status | String(50) | default 'active' |
| created_at | DateTime(tz) | server_default now() |

### `alerts`
| Column | Type | Constraints |
|--------|------|-------------|
| id | Integer | PK, indexed |
| title | String(255) | NOT NULL |
| message | String(2000) | NOT NULL |
| disaster_id | Integer | FK -> disasters.id, nullable |
| severity | String(50) | default 'info' |
| created_at | DateTime(tz) | server_default now() |

### `routes`
| Column | Type | Constraints |
|--------|------|-------------|
| id | Integer | PK, indexed |
| source_lat | Float | NOT NULL |
| source_lng | Float | NOT NULL |
| destination_lat | Float | NOT NULL |
| destination_lng | Float | NOT NULL |
| estimated_time | Float | nullable (minutes) |
| distance_km | Float | nullable |

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | None | Register new user, returns JWT |
| POST | `/api/auth/login` | None | Login, returns JWT |
| GET | `/api/users/me` | JWT | Get authenticated user profile |
| GET | `/api/weather?lat=&lng=` | None | Weather by GPS coordinates |
| GET | `/api/shelters` | None | List all shelters |
| POST | `/api/shelters` | Admin | Create shelter |
| PUT | `/api/shelters/{id}` | Admin | Update shelter (partial) |
| DELETE | `/api/shelters/{id}` | Admin | Delete shelter |
| GET | `/api/hospitals` | None | List all hospitals |
| POST | `/api/hospitals` | Admin | Create hospital |
| GET | `/api/disasters` | None | List all disasters |
| GET | `/api/disasters/active` | None | List active disasters |
| POST | `/api/disasters` | Admin | Create disaster |
| GET | `/api/alerts` | None | List all alerts |
| POST | `/api/alerts` | Admin | Create alert |
| GET | `/api/routes` | None | List evacuation routes |
| POST | `/api/routes` | None | Create route |
| GET | `/api/health` | None | Health check |

---

## Frontend Routes

| Path | Page | Auth | Notes |
|------|------|------|-------|
| `/` | Landing | Public | Hero section with feature showcase |
| `/login` | Login | Public | Redirects to /dashboard if authenticated |
| `/register` | Register | Public | Redirects to /dashboard if authenticated |
| `/dashboard` | Dashboard | Required | Weather, alerts, disaster table |
| `/map` | MapPage | Required | Lazy-loaded interactive map |
| `/shelters` | Shelters | Required | Shelter directory with occupancy bars |
| `/hospitals` | Hospitals | Required | Hospital directory with emergency status |
| `/alerts` | AlertsPage | Required | Severity-filtered alert feed |
| `/admin` | Admin | Admin only | Statistics overview |
| `*` | NotFound | None | 404 page |

---

## Key Features Implemented

### Phase 1 — Core Platform
- **JWT Authentication** with register/login, role-based access (admin/user)
- **Dashboard** showing active disasters, critical alerts, shelter/hospital counts, weather, and a disaster table
- **Interactive Map** with markers for user, shelters, hospitals, and disaster zones
- **Shelter Management** with occupancy tracking and visual capacity bars
- **Hospital Directory** with emergency availability flags
- **Disaster Management** with severity levels and status tracking
- **Emergency Alerts** with severity-based color coding (critical/severe/warning/info)
- **Admin Panel** with system statistics
- **PostgreSQL** persistence with auto-seeded demo data
- **Docker Compose** for full-stack containerized deployment

### Phase 3.1 — Live Infrastructure from OpenStreetMap
- **Overpass API Integration** with async HTTP client (httpx) and Overpass QL query builder
- **5 Infrastructure Categories**: hospitals, shelters, police stations, fire stations, pharmacies
- **In-Memory TTL Cache**: 10-minute cache keyed by (rounded lat, rounded lng, category) to reduce Overpass API calls
- **LocationService Facade**: single service wrapping 5 category methods, each with Haversine sorting and stale-cache fallback on Overpass errors
- **New Endpoint**: `GET /api/location/nearby?lat=&lng=&radius=` returns unified `NearbyResponse` with all 5 categories
- **Parallel Fetching**: backend uses `asyncio.gather` for simultaneous category queries (3s timeout each)
- **Configurable Radius**: default 10 km, adjustable via query parameter
- **Live Data Priority**: frontend MapPage uses live OSM results as primary source, falls back to static PostgreSQL data
- **New Map Layers**: Police (blue), Fire Stations (red), Pharmacies (green) with custom marker icons and layer toggles
- **Sidebar Infrastructure Panel**: live counts for all 5 categories with color dot indicators
- **Dashboard Live Counts**: shelter/hospital cards show live OSM counts when GPS is available, with "(live)" subtitle
- **Updated EmergencyButton**: uses `/api/location/nearby` instead of separate shelter/hospital API calls
- **3s Timeout per Category**: each Overpass query independently times out; partial results are still returned
- **Haversine Server-Side**: distances computed by LocationService before returning, matching frontend calculation

### Phase 2 — Real-Time Geolocation & Navigation
- **Browser GPS** via `navigator.geolocation.watchPosition` with continuous tracking
- **Nearest Shelter Detection** using Haversine distance formula
- **Nearest Hospital Detection** using Haversine distance formula
- **Real Routing** via OpenRouteService API (ORS) with OSRM public API fallback
- **Straight-Line Fallback** when no routing API is available (Haversine-based)
- **Weather by GPS Coordinates** with 5-minute auto-refresh via polling
- **Disaster Radius Circles** scaled by severity (critical=3km, severe=2km, high=1.5km, moderate=1km, default=500m)
- **Route Visualization** with dashed polyline, distance, duration, and turn-by-turn directions
- **Enhanced Emergency Button** — finds nearest shelter/hospital, computes safest route, navigates to map
- **GPS Status Indicator** showing acquisition state, permission status, and coordinates
- **Sorted Nearest Lists** in map sidebar for quick reference
- **Lazy-Loaded Map** via `React.lazy()` for faster initial bundle
- **Memoized Distance Calculations** via `useMemo` to avoid unnecessary re-renders
- **Graceful Error Handling** — cached weather on API failure, straight-line fallback on routing failure, clear GPS permission denied messaging

---

## Environment Variables

| Variable | Required | Default | Used By | Description |
|----------|----------|---------|---------|-------------|
| `POSTGRES_USER` | Yes | — | Docker Compose | PostgreSQL username |
| `POSTGRES_PASSWORD` | Yes | — | Docker Compose | PostgreSQL password |
| `POSTGRES_DB` | Yes | — | Docker Compose | PostgreSQL database name |
| `SECRET_KEY` | Yes | — | Backend | JWT signing secret |
| `DATABASE_URL` | Yes | localhost asyncpg | Backend (local dev) | Full database connection string |
| `OPENWEATHER_API_KEY` | No | empty | Backend | OpenWeather API key (mock fallback if empty) |
| `VITE_ORS_API_KEY` | No | empty | Frontend | OpenRouteService API key (OSRM fallback if empty) |
| `OVERPASS_API_URL` | No | `https://overpass-api.de/api/interpreter` | Backend | Overpass API endpoint (defaults to public instance) |

---

## Demo Credentials

- **Admin**: admin@aidrac.com / admin123
- **User**: user@aidrac.com / user123

---

## Seed Data

The database auto-seeds on first startup with:
- 2 users (admin + standard)
- 10 shelters in the New Delhi area
- 10 hospitals in the New Delhi area
- 5 disaster events (floods, cyclone, earthquake, fire)
- 10 emergency alerts (linked to disasters or standalone)
- 3 pre-defined evacuation routes

---

## Development Setup

### Local (no Docker)
```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\Activate  # or source venv/bin/activate on Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

### Docker
```bash
cp .env.example .env
# Edit .env with your values
docker-compose up --build
```

### Access
- Frontend: http://localhost:5173 (dev) or http://localhost:80 (Docker)
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## Phase 3.2+ Roadmap

The architecture is designed for extension with Agentic AI in Phase 3:

- **LangGraph/CrewAI integration** for autonomous disaster response coordination
- **LLM-powered decision support** for resource allocation
- **Predictive analytics** for disaster forecasting
- **Multi-agent coordination** for dynamic shelter assignment and evacuation planning
- **Natural language interface** for emergency reporting and inquiry

The existing service layer, typed API schemas, and modular component structure are intentionally designed to be consumed by AI agents without architectural changes.
