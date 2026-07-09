# AIDRAC — Project Context

## Overview

**AIDRAC (Agentic AI Disaster Response Coordinator)** is a full-stack disaster management application that helps citizens during natural disasters such as floods, cyclones, and earthquakes. It provides safe evacuation routes, nearby shelters, hospitals, real-time weather information, and emergency alerts through an interactive geographic interface.

The project is architected in phases. Phase 1 established the core platform (auth, database, CRUD APIs, mapping), and Phase 2 added real-time geolocation, routing, and GPS-based weather. Phase 3.1 added live infrastructure from OpenStreetMap (shelters, hospitals, police, fire stations, pharmacies). Phase 3.2 added AI Decision Support via the Gemini API. Phase 3.3A added live CAP alert ingestion from official IMD/NDMA feeds. Phase 3.3B/C added background ingestion, multi-source merging, alert history, caching, location-aware filtering, and disaster provider abstraction. Phase 3.3C migrated the Hospitals and Shelters pages from demo database records to live OpenStreetMap data. Phase 4.1 introduced the LangGraph orchestration foundation with typed state. Phase 4.2 replaced placeholder nodes with real service-backed agents. Phase 4.3 added the Gemini-powered intelligent Coordinator with deterministic fallback. Phase 4.3.1 upgraded the AI Decision Support UI with structured cards, risk badges, and explainability. Phase 4.4 refactored the graph to parallel execution — Weather, Alert, and Infrastructure run concurrently via LangGraph's native fan-out.

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
│       ├── langgraph/        # LangGraph multi-agent orchestration
│       │   ├── __init__.py       # Exports compiled graph
│       │   ├── models.py         # Strongly typed Pydantic models
│       │   ├── state.py          # Shared AgentState with typed fields
│       │   ├── nodes.py          # Service-backed agent nodes
│       │   ├── graph.py          # Parallel graph builder & compiled graph
│       │   └── context_builder.py# AgentState→LLM context (no service calls)
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
│       │   ├── alerts.py    # GET/POST /api/alerts, GET /api/alerts/history
│       │   ├── routes.py    # GET/POST /api/routes
│       │   └── weather.py   # GET /api/weather?lat=&lng=
│       ├── services/        # Business logic layer
│       │   ├── disaster_sources/ # Provider architecture (Phase 3.3A + 3.3B/C)
│       │   │   ├── base.py              # Abstract providers + data classes
│       │   │   ├── cap_provider.py      # IMD/NDMA CAP RSS parser + cache + multi-source merge
│       │   │   ├── openweather_provider.py # OpenWeather wrapper
│       │   │   ├── normalizer.py        # Provider → DB schema conversion
│       │   │   ├── cache.py             # In-memory TTL cache for RSS/CAP XML
│       │   │   ├── background_refresh.py# Async background ingestion loop (5-min interval)
│       │   │   ├── disaster_provider.py # DisasterProvider abstraction + static fallback
│       │   │   └── ingestion_service.py # Manual trigger orchestration + soft-expire
│       │   ├── auth.py      # Register/login with hashing
│       │   ├── shelter.py   # CRUD with 404 handling
│       │   ├── hospital.py  # Read/create
│       │   ├── disaster.py  # List active, ordered by date
│       │   ├── alert.py     # List with expiry filtering
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

4. **Lifespan Auto-Migration**: Tables are created on startup via `Base.metadata.create_all` inside the FastAPI lifespan. Seed data is applied immediately after. Background alert ingestion starts on lifespan begin and runs every 5 minutes. No separate migration step needed for development.

5. **Background Ingestion**: IMD and NDMA CAP RSS feeds are fetched concurrently on a 5-minute asyncio loop. Raw RSS and parsed CAP XML are cached in-memory with TTL. `GET /api/alerts` reads only from PostgreSQL — no network requests on reads.

6. **Alert History**: Expired alerts are soft-deleted (`is_active=false`, `expired_at=now`) instead of physically removed. A configurable retention purge (default 30 days) removes truly stale records. The `/api/alerts/history` endpoint exposes inactive alerts.

7. **Location-Aware Filtering**: `GET /api/alerts` accepts optional `lat`/`lng` query params. A bounding-box-based state resolver maps coordinates to Indian states, then matches against CAP `area` fields. Designed so polygon-based GeoJSON filtering can replace it without API changes.

8. **JWT Auth**: Access tokens contain `sub` (user ID) and `role` claims. Token extraction via `HTTPBearer`. Admin routes protected by `require_admin` dependency.

9. **Mock Fallback**: The weather service returns mock data when no API key is configured, enabling full local development without external dependencies.

10. **LangGraph Multi-Agent Architecture (Phases 4.1–4.4)**: `backend/app/langgraph/` implements a `StateGraph`-based multi-agent system. Phase 4.1 established the skeleton with typed `AgentState` (Pydantic models). Phase 4.2 replaced all placeholder nodes with real service-backed agents. Phase 4.3 added the Gemini-powered Coordinator with deterministic fallback detection. Phase 4.4 refactored to parallel execution: Weather, Alert, and Infrastructure agents fan out from START concurrently; Route fans in after all three complete; Coordinator runs last. All agents share `AgentState` — each writes to its own key (`weather`, `alerts`, `infrastructure`, `route`/`destination`, `recommendation`) with automatic state merging by LangGraph.

11. **Gemini Coordinator with Deterministic Fallback (Phase 4.3)**: The Coordinator reuses the existing `AIService` from `app/ai/` — no duplicate Gemini client or system prompt. A LangGraph-specific `context_builder.py` converts `AgentState` into a compact LLM prompt without making service/DB/HTTP calls (data was already gathered by upstream agents). The Coordinator detects degraded AI responses (quota, auth, network failure) via `_is_degraded()` before falling back to a deterministic recommendation based solely on `AgentState`. The `RecommendationState.source` field tracks whether the recommendation came from "gemini" or "fallback".

12. **Parallel Graph Execution (Phase 4.4)**: LangGraph's native fan-out/fan-in replaces the original sequential pipeline. Three edges from START (weather, alert, infrastructure) launch parallel execution. Edges from all three to `route` create an implicit barrier — Route executes only after all three upstream agents finish. Coordinator runs after Route. This reduces total execution time while preserving fault tolerance: any agent that fails returns empty typed state, and the graph continues with whatever data is available.

13. **RoutingService Abstraction (Phase 4.5)**: `RoutingService` at `backend/app/services/routing_service.py` decouples the Route Agent from routing implementation. The service exposes a single `get_route(origin, dest, type) → RouteState` method. OSRM is the primary provider; Haversine straight-line is the automatic fallback. New providers can be added without modifying the Route Agent — follows the same architectural pattern as the `disaster_sources/` provider abstraction. The Route Agent calls `RoutingService.get_route()` and never knows which provider generated the route.

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
| message | Text | NOT NULL |
| disaster_id | Integer | FK -> disasters.id, nullable |
| severity | String(50) | default 'info' |
| created_at | DateTime(tz) | server_default now() |
| external_id | String(255) | UNIQUE, nullable (CAP identifier) |
| expires_at | DateTime(tz) | nullable |
| event | String(255) | nullable |
| urgency | String(50) | nullable |
| certainty | String(50) | nullable |
| area | String(500) | nullable |
| is_active | Boolean | default True, NOT NULL |
| expired_at | DateTime(tz) | nullable |
| polygons | Text | nullable (semicolon-joined polygon strings) |
| source | String(50) | nullable (e.g., "imd", "ndma") |

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
| GET | `/api/alerts` | None | List active alerts (optional `?lat=&lng=` for location filtering) |
| POST | `/api/alerts` | Admin | Create alert |
| GET | `/api/alerts/history` | None | List expired/deactivated alerts |
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
| `/shelters` | Shelters | Required | Live OSM shelters, community centres, and schools sorted by distance |
| `/hospitals` | Hospitals | Required | Live OSM hospitals sorted by distance with OSM tags |
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
- **Configurable Overpass Endpoint**: `OVERPASS_API_URL` in settings, with automatic fallback to overpass-api.de and kumi.systems
- **User-Selectable Emergency Destinations**: redesigned EmergencyButton with 5 destination options (Safe Shelter, Hospital, Police, Fire, Pharmacy), each with color-coded icon buttons
- **Safe Shelter Priority**: selects best shelter type from available OSM data (amenity=shelter, emergency=shelter, building=shelter, community_centre)
- **Destination-Based RoutePanel**: replaced separate shelter/hospital display with unified "Destination" label showing the selected facility type
- **No Cross-Border Routing**: removed DB fallback for routing when GPS is active; routes are computed exclusively from live Overpass results
- **Retry Logic for Overpass**: each endpoint tried once; success logged; all fail → OverpassError raised

### Phase 3.2 — AI Decision Support (Gemini)
- **Isolated AI Package**: `backend/app/ai/` containing `prompts.py`, `context_builder.py`, `ai_service.py`, and `schemas.py` — modular, replaceable, no coupling to other services
- **Placeholder System Prompt**: `SYSTEM_PROMPT` constant in `prompts.py` can be swapped without touching any other code
- **Context Builder**: collects GPS location, weather, nearby infrastructure (all 7 OSM categories), active disasters, and recent alerts; normalizes into a structured prompt context
- **Gemini API Integration**: uses `google.genai` SDK with configurable model (default `gemini-2.5-flash`); async client for non-blocking requests; fallback response when API key is missing or call fails
- **Structured JSON Response**: returns `riskLevel`, `summary`, `recommendedDestination` (type + name), `reason`, and `actions[]`
- **New Endpoint**: `POST /api/ai/recommendation` accepts `{ question, lat?, lng? }` and returns enriched AI recommendation
- **AIAssistant Component**: `frontend/src/components/AIAssistant.tsx` with question input, send button, loading state, error handling, and formatted recommendation card
- **Dashboard Integration**: AI Assistant card embedded in the Dashboard page below active disasters
- **Graceful Fallback**: when `GEMINI_API_KEY` is unset, returns an informative message instead of crashing
- **Error Resilience**: Gemini call failures are caught and return a user-friendly fallback response with suggested next actions

### Phase 3.3A — Live CAP Alert Ingestion
- **Provider Architecture**: `backend/app/services/disaster_sources/` with abstract `WeatherProvider`/`AlertProvider` interfaces — the rest of the application does not know where data originates
- **CAP RSS Ingestion**: fetches official India alerts from IMD and NDMA CAP RSS feeds concurrently
- **CAP XML Parsing**: extracts event, headline, description, severity (normalized to critical/warning/advisory/info), urgency, certainty, effective/expires times, area description, and polygon coordinates
- **Deduplication**: alerts keyed by CAP `identifier` (stored as `external_id` with unique constraint); existing alerts updated on re-ingestion
- **Auto-Expiry**: alerts with `expires_at` in the past are soft-deleted (`is_active=false`) instead of removed
- **Alert Model Extended**: added `external_id`, `expires_at`, `event`, `urgency`, `certainty`, `area`, `is_active`, `expired_at`, `polygons`, `source` columns; `message` widened to `Text` for long CAP descriptions
- **IngestionService**: orchestrates fetch → normalize → upsert → soft-expire
- **Backward Compatible**: existing `AlertService.get_all()` and `get_active()` filter out inactive and expired alerts; `POST /api/alerts` unchanged; ContextBuilder filters to CAP-only alerts
- **Error Resilience**: both feeds attempted concurrently; if both fail → empty alerts returned; never crashes
- **Weather Unchanged**: `GET /api/weather` continues using existing `WeatherService`; `OpenWeatherProvider` wrapper available for future use

### Phase 4.1 — LangGraph Foundation
- **New Package**: `backend/app/langgraph/` with `models.py`, `state.py`, `nodes.py`, `graph.py` — fully isolated from existing services
- **Strongly Typed State**: `AgentState` is a Pydantic `BaseModel` with 8 typed sub-models (`LocationState`, `WeatherState`, `AlertItem`, `AlertState`, `InfrastructureItem`, `InfrastructureState`, `DestinationState`, `RouteState`, `RecommendationState`) instead of generic dicts — safer agent development with IDE autocompletion and runtime validation
- **5 Placeholder Nodes**: weather, alert, infrastructure, route, coordinator — each logs execution and returns state unchanged
- **Sequential Graph**: START → Weather → Alert → Infrastructure → Route → Coordinator → END
- **Module-Level Graph Instance**: `graph.py` exposes a compiled `graph` singleton importable by other modules
- **Existing Code Untouched**: no routers, services, models, schemas, or frontend files were modified in Phase 4.1
- **Test Coverage**: `tests/test_langgraph.py` verifies graph builds, sequential execution, and final state integrity

### Phase 4.2 — Service-Backed LangGraph Agents
- **Weather Agent**: calls `WeatherService.get_current_weather(lat, lng)`, returns `WeatherState` with inferred risk level via `_infer_weather_risk()` (temperature thresholds + description keywords). Falls back to empty `WeatherState()` on any exception.
- **Alert Agent**: opens a DB session via `async_session_factory`, calls `AlertService.get_all(lat, lng)`. Maps results to `AlertItem[]` with severity ranking. Returns empty `AlertState()` on DB or service failure.
- **Infrastructure Agent**: fires all 7 `LocationService` category queries in parallel via `asyncio.gather`. Maps each to `InfrastructureItem[]`. Returns empty `InfrastructureState()` on failure.
- **Route Agent**: picks the nearest infrastructure item across all 7 categories using `_haversine()`. Computes straight-line distance and walking ETA (5 km/h). Produces `DestinationState` + `RouteState`.
- **Coordinator Agent**: placeholder aggregator — builds summary and action list from upstream state. No Gemini call in Phase 4.2.
- **New Helpers**: `_infer_weather_risk()`, `_pick_nearest_destination()`, `_build_directions()`, `_count_infrastructure()`, `_suggest_actions()` — all pure functions.
- **`InfrastructureState` Expanded**: added `community_centres` and `schools` fields (previously missing from the model).
- **Tests Updated**: `test_graph_executes_without_crashing()` now asserts typed model instances instead of key existence; new `test_graph_with_gps_coordinates()` verifies real service execution with GPS input.

### Phase 4.3 — Intelligent Gemini Coordinator
- **LangGraph Context Builder**: `build_llm_context(state: AgentState) → str` in `backend/app/langgraph/context_builder.py` — a pure function that reads ONLY from `AgentState`. Never calls services, DB, or HTTP. Outputs a compact LLM prompt: weather (condition + risk), alerts (count + severity + top 5 events), infrastructure (capped: 3 hospitals, 3 shelters, 2 police/fire/pharmacy), destination/route, and user question.
- **Gemini Coordinator**: replaces the Phase 4.2 placeholder. Reuses existing `AIService.get_recommendation(question, context)` — no duplicate Gemini client or system prompt.
- **Degraded Response Detection**: `_is_degraded()` checks `AIRecommendationResponse.summary` and `.reason` for known failure indicators ("not configured", "unavailable", "quota exceeded", etc.). Handles cases where AIService returns a degraded response instead of raising.
- **Deterministic Fallback**: `_deterministic_recommendation()` generates recommendations using only `AgentState` — alert severity, weather risk, nearest facility, active alert count. Never allows the graph to crash on Gemini failure.
- **`RecommendationState` Extended**: added `reasoning: str | None`, `recommended_destination: str | None`, `source: str` ("gemini" or "fallback").
- **Logging**: `[Coordinator] Building LLM context`, `[Coordinator] Calling AIService`, `[Coordinator] AI recommendation parsed` / `[Coordinator] Using deterministic fallback`.

### Phase 4.3.1 — AI Decision Support UI Upgrade
- **Card-Based Layout**: recommendation displayed in separate visual cards (risk badge, summary, destination, reason, actions) instead of flat text
- **Risk Badge**: color-coded by risk level (green=low, yellow=moderate, orange=high, red=critical, gray=unknown) with Shield icon
- **Destination Card**: shows lucide icon (Hospital/Home/Shield/Building2/Flame/Pill), destination type label, and facility name in a blue card
- **Action Checklist**: green checkmark icons instead of numbered circles
- **Explainability Section**: collapsible "How this recommendation was generated" panel listing all 5 agents with checkmarks
- **Live Data Sources Footer**: static "Powered by" section showing OpenWeather, IMD/NDMA CAP Alerts, OpenStreetMap, Gemini
- **Loading State**: spinner + "Analyzing your situation..." while request is in flight; Analyze button disabled
- **Empty State**: bot icon + "Ask anything about your safety" + 5 clickable example questions before first submission
- **Error State**: friendly error message with "Try Again" retry button; no stack traces exposed
- **Location Display**: current lat/lng shown below header when GPS available, "Location unavailable" otherwise

### Phase 4.4 — Parallel LangGraph Execution
- **Fan-out from START**: three edges (`START → weather`, `START → alert`, `START → infrastructure`) launch Weather, Alert, and Infrastructure concurrently via LangGraph's native graph orchestration
- **Fan-in to Route**: edges from all three independent nodes to `route` create an implicit synchronization barrier — Route executes only after all three upstream agents complete
- **Sequential Tail**: Route → Coordinator → END remains unchanged
- **Fault Tolerance**: if one parallel branch fails (returns empty state), the other branches still complete; Coordinator runs with whatever data is available
- **Orchestration Logging**: `[LangGraph] <Node> started` printed at each node entry, clearly demonstrating parallel execution of the first three agents
- **No Business Logic Changes**: only `graph.py` edges changed and `nodes.py` print statements added; agent logic, services, APIs, models, and frontend untouched

### Phase 4.5 — Routing Service Architecture
- **RoutingService Abstraction**: `backend/app/services/routing_service.py` provides a single `get_route(origin_lat, origin_lng, dest_lat, dest_lng, destination_type) → RouteState` method. The Route Agent depends only on this interface — it never knows which provider generated the route.
- **OSRM Provider** (primary): calls `https://router.project-osrm.org/route/v1/foot/` with `overview=full&geometries=geojson&steps=true`. Extracts distance (m→km), duration (s→min), full polyline (converted from `[lng,lat]` to `[lat,lng]`), and turn-by-turn instructions from `legs[0].steps[].maneuver.instruction`. Sets `provider="osrm"` on `RouteState`.
- **Straight-Line Provider** (automatic fallback): uses `_haversine` from `location_service.py`. Computes straight-line distance and walking ETA (5 km/h). Generates 3-step directions. Sets `provider="straight-line"` on `RouteState`.
- **Automatic Fallback**: if OSRM fails (timeout, HTTP error, invalid response, rate limiting, service unavailable), `RoutingService.get_route()` catches the exception, logs `[Routing] OSRM unavailable` / `[Routing] Falling back to straight-line`, and returns the straight-line result. The Route Agent never sees the failure.
- **Route Agent Refactored**: `route_node` now calls `_routing_service.get_route(lat, lng, dest_item.latitude, dest_item.longitude, destination_type=...)` — no direct Haversine calls, no `_build_directions`, no manual `RouteState` construction. Destination selection logic (`_pick_nearest_destination`) remains in the agent.
- **Dead Code Removed**: `_build_directions()` removed from `nodes.py` — its logic moved into `RoutingService._straight_line_route()`.
- **Extensible**: future providers (GraphHopper, ORS, Google Directions, Mapbox) can be added to `RoutingService` without changing the Route Agent — just add a `_provider_name_route()` method and insert it in the priority chain.
- **Logging**: `[Routing] Calling OSRM`, `[Routing] Provider: OSRM`, `[Routing] OSRM unavailable`, `[Routing] Falling back to straight-line`.

### Phase 3.3B/C — Background Ingestion & Alert Pipeline
- **Background Refresh**: IMD and NDMA feeds fetched concurrently every 5 minutes via asyncio background task started in FastAPI lifespan. `GET /api/alerts` reads only from PostgreSQL — zero network requests on reads.
- **Multi-Source Merge**: IMD and NDMA treated as equal peers. Results merged into a single list, deduplicated by `external_id`. CAP XML files downloaded concurrently within each feed.
- **Alert History & Soft-Delete**: Expired alerts set `is_active=false` and `expired_at=now` instead of being deleted. A configurable retention purge (default 30 days) physically removes stale records. New `/api/alerts/history` endpoint returns deactivated alerts.
- **In-Memory Caching**: RSS XML and parsed CAP XML are cached via `CacheService` with 5-minute TTL. On network failure, the most recent successful data is served from cache.
- **Location-Aware Filtering**: `GET /api/alerts` accepts optional `?lat=` and `?lng=` query parameters. A state-resolver maps coordinates to Indian states via bounding boxes. Alerts matching the user's state (by `area` field substring), plus nationwide alerts, are returned. Designed for future polygon-based filtering without API changes.
- **DisasterProvider Abstraction**: `DisasterProvider` abstract interface with `StaticDisasterProvider` for seeded development data. Ready for live disaster API sources without changing consumers.
- **Demo Data Cleanup**: seed.py no longer creates demo alerts. Existing demo alerts from earlier runs are marked inactive on first background refresh. ContextBuilder filters to alerts with `external_id IS NOT NULL`.

### Phase 3.3C — Live OSM Infrastructure Pages
- **Hospitals Page Rewritten** — `/hospitals` uses `useGeolocation` + `locationApi.nearby()` to display live nearby hospitals from OpenStreetMap, sorted by distance, with distance badge, coordinates, and OSM tags shown on each card
- **Shelters Page Rewritten** — `/shelters` merges `shelters`, `community_centres`, and `schools` from the location service into one sorted-by-distance list, each card showing a type label (Safe Shelter / Community Centre / School) with distinct icons and colors
- **GPS Location Gate** — both pages require GPS; if unavailable, they show a "Enable Location" button and the `LocationStatus` indicator, never falling back to demo data
- **Legacy Endpoints Deprecated for Pages** — `GET /api/hospitals` and `GET /api/shelters` remain available as fallback APIs but are no longer used by any user-facing page. The Dashboard still references them for fallback counters when GPS is unavailable.
- **Type Consistency** — uses `NearbyPlace`/`NearbyResponse` types shared with MapPage, EmergencyButton, and AI ContextBuilder — no duplicate models
- **Error Handling** — Overpass unavailability shows a user-friendly error with retry button via `ErrorState` component
- **Zero Demo Data** — no seeded hospitals or shelters appear on either page; data comes exclusively from OpenStreetMap

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
| `IMD_CAP_RSS_URL` | No | `https://cap-sources.s3.amazonaws.com/in-imd-en/rss.xml` | Backend | Primary IMD CAP RSS feed (Phase 3.3A) |
| `NDMA_CAP_RSS_URL` | No | `https://sachet.ndma.gov.in/cap_public_website/rss/rss_india.xml` | Backend | Secondary NDMA CAP RSS feed, fetched concurrently with IMD (Phase 3.3B/C) |
| `REFRESH_INTERVAL_SECONDS` | No | `300` | Backend | Background alert refresh interval (Phase 3.3B/C) |
| `ALERT_RETENTION_DAYS` | No | `30` | Backend | Days before physically deleting expired alerts (Phase 3.3B/C) |

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
- 3 pre-defined evacuation routes

*Note: Alerts are no longer seeded — they come exclusively from live CAP feeds via the background ingestion service. Demo alerts (without `external_id`) are marked inactive on the first background refresh run.*

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

## Phase 4.6+ Roadmap

The architecture is designed for further extension:

- **Memory/Persistence** — LangGraph checkpointer for multi-turn conversations and state persistence across sessions
- **Agent Observability** — LangSmith integration for tracing, monitoring, and debugging agent execution
- **Human-in-the-Loop** — breakpoints for coordinator approval before critical recommendations
- **Multi-turn Conversations** — agent remembers past questions and context across sessions
- **Additional Agents** — resource allocation agent, population density agent, weather forecasting agent
- **Polygon-based alert filtering** — replacing the current area/state string matching strategy

The existing service layer, typed API schemas, and modular component structure are intentionally designed to be consumed by AI agents without architectural changes.
