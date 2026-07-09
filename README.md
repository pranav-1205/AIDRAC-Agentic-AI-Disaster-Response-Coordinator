# AIDRAC - Agentic AI Disaster Response Coordinator

A full-stack disaster management application that helps citizens during natural disasters by providing safe evacuation routes, nearby shelters, hospitals, weather information, and emergency alerts.

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Router v6** for routing
- **Leaflet + OpenStreetMap** for interactive maps
- **Axios** for API calls
- **Lucide React** for icons

### Backend
- **FastAPI** (Python async web framework)
- **SQLAlchemy 2.0** (async ORM)
- **PostgreSQL** (database)
- **Pydantic v2** (validation)
- **Alembic** (migrations)
- **JWT** authentication
- **bcrypt** password hashing

## Project Structure

```
aidrac/
├── backend/
│   ├── app/
│   │   ├── ai/               # AI Decision Support (Gemini)
│   │   ├── langgraph/        # LangGraph multi-agent orchestration
│   │   │   ├── __init__.py       # Exports compiled graph
│   │   │   ├── models.py         # Strongly typed Pydantic models
│   │   │   ├── state.py          # Shared AgentState with typed fields
│   │   │   ├── nodes.py          # Service-backed agent nodes
│   │   │   ├── graph.py          # Parallel graph builder & compiled graph
│   │   │   └── context_builder.py# AgentState→LLM context (no service calls)
│   │   ├── config/          # Application settings
│   │   ├── database/        # DB connection & seed data
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── routers/         # API route handlers
│   │   ├── services/        # Business logic layer (Weather, Alert, Location, Routing, Incident)
│   │   └── utils/           # Auth, dependencies
│   ├── alembic/             # Database migrations
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Route pages
│   │   ├── services/        # API client
│   │   ├── hooks/           # Custom hooks (useGeolocation, useWeather, useApi)
│   │   ├── utils/           # Helpers (haversine, routing)
│   │   ├── context/         # Auth context
│   │   └── types/           # TypeScript types
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
└── README.md
```

## Features

### Phase 1 (Complete)
- **Interactive Map** with disaster zones, shelters, and hospitals
- **Real-time Weather** data via OpenWeather API (mock fallback)
- **Shelter Management** with occupancy tracking
- **Hospital Directory** with emergency availability
- **Emergency Alerts** system with severity levels
- **User Authentication** with JWT
- **Admin Dashboard** for system overview
- **Responsive Design** optimized for all devices

### Phase 2 (Complete)
- **Browser GPS** via `navigator.geolocation.watchPosition` with continuous tracking
- **Nearest Shelter/Hospital** using Haversine distance formula
- **Real Routing** via OpenRouteService API (ORS) with OSRM public API fallback
- **Straight-line fallback** if both routing APIs are unavailable
- **Disaster Radius Circles** scaled by severity (critical: 3km, severe: 2km, high: 1.5km, moderate: 1km)
- **Weather by GPS coordinates** with 5-minute auto-refresh
- **Location status indicator** showing GPS state (acquiring, denied, unsupported, active)
- **Lazy-loaded map** for faster initial page load
- **Memoized nearest-location calculations** to avoid unnecessary re-renders
- **Graceful error handling** —cached data on API failure, straight-line fallback on routing failure, GPS permission denied messaging

### Phase 3.1 (Complete)
- **Live Overpass Infrastructure** — real-time OSM data for shelters, hospitals, police, fire stations, pharmacies
- **Configurable Overpass Endpoint** with automatic retry across 3 servers (openstreetmap.fr → overpass-api.de → kumi.systems)
- **User-Selectable Emergency Destinations** — choose Safe Shelter, Hospital, Police Station, Fire Station, or Pharmacy
- **Safe Shelter Priority** — automatically selects the best available shelter type
- **Destination Routing** — computes walking route to the user's selected emergency destination
- **Or-style Overpass Queries** — supports multiple alternative tags per category
- **In-Memory TTL Cache** — 10-minute cache for Overpass results with stale-cache fallback
- **Parallel Category Fetching** — all 5 infrastructure categories queried simultaneously

### Phase 3.2 (Complete)
- **AI Decision Support** — Gemini-powered emergency recommendations
- **Backend AI Package** — isolated AI module with prompts, context builder, and Gemini client
- **Context Enrichment** — automatically gathers GPS, weather, nearby infrastructure, disasters, and alerts before querying Gemini
- **Structured JSON Responses** — risk level, summary, recommended destination, reasoning, and actionable steps
- **Dashboard AI Assistant** — question input with formatted recommendation cards
- **Placeholder System Prompt** — easily replaceable without touching other code

### Phase 3.3A (Complete)
- **Live CAP Alert Ingestion** — fetches official disaster alerts from IMD CAP RSS feed (with NDMA fallback)
- **Provider Architecture** — abstract `WeatherProvider`/`AlertProvider` interfaces in `disaster_sources/` package
- **CAP XML Parsing** — extracts event, headline, severity, urgency, certainty, area, polygons, and expiry from CAP 1.2 alerts
- **Automated Deduplication** — prevents duplicate alerts via `external_id` unique constraint; expired alerts auto-deleted
- **Graceful Degradation** — IMD feed → NDMA fallback → empty alerts; never crashes on network errors
- **Backward Compatible** — existing `GET /api/alerts` and `GET /api/weather` unchanged; ContextBuilder auto-consumes live alerts

### Phase 3.3B/C (Complete)
- **Background Ingestion** — IMD and NDMA feeds fetched concurrently every 5 minutes via asyncio background task; `GET /api/alerts` reads only from PostgreSQL (zero network on read)
- **Multi-Source Merge** — IMD and NDMA treated as equal peers; results merged and deduplicated by `external_id`; concurrent CAP XML downloads
- **Alert History & Soft-Delete** — expired alerts are soft-deleted (`is_active=false`) instead of removed; configurable 30-day retention purge
- **In-Memory Caching** — RSS and CAP XML responses cached with 5-minute TTL; stale cache served on network failure
- **Location-Aware Filtering** — `GET /api/alerts?lat=&lng=` returns alerts matching the user's state/area via area string matching; designed for future polygon-based filtering
- **Demo Data Cleanup** — seed.py no longer creates demo alerts; existing demo alerts marked inactive on first background run; ContextBuilder filters to CAP-only alerts
- **DisasterProvider Abstraction** — `DisasterProvider` interface with `StaticDisasterProvider` for development data; ready for live disaster API sources
### Phase 3.3C (Complete)
- **Live OSM Hospitals Page** — `/hospitals` now uses `GET /api/location/nearby` with GPS position to show live hospitals from OpenStreetMap, sorted by distance, with distance, coordinates, and OSM tags displayed
- **Live OSM Shelters Page** — `/shelters` now merges shelters, community centres, and schools from the location service, sorted by distance with type labels and OSM tags
- **GPS Location Prompt** — both pages show "Enable Location" button when GPS is unavailable instead of showing stale demo data
- **Legacy Endpoints Preserved** — `GET /api/hospitals` and `GET /api/shelters` kept as fallback/legacy APIs; no user-facing pages depend on them
- **Consistent Types** — uses the same `NearbyPlace` and `NearbyResponse` types as the Map page, EmergencyButton, and routing components

### Phase 4.1 (Complete)
- **LangGraph Foundation** — introduced `backend/app/langgraph/` package with `StateGraph`-based sequential workflow
- **Strongly Typed State** — `AgentState` uses Pydantic `BaseModel` with 8 typed sub-models (`LocationState`, `WeatherState`, `AlertState`, `InfrastructureState`, `DestinationState`, `RouteState`, `RecommendationState`) instead of generic `dict[str, Any]`
- **5 Placeholder Nodes** — Weather, Alert, Infrastructure, Route, Coordinator — each logs execution and returns state unchanged (no business logic yet)
- **Sequential Pipeline** — START → Weather → Alert → Infrastructure → Route → Coordinator → END
- **Isolated Package** — no existing services, APIs, or frontend code modified; `langgraph/` is a self-contained orchestration foundation
- **Installed Dependency** — `langgraph>=1.2.0` added to `requirements.txt`

### Phase 4.2 (Complete)
- **Service-Backed LangGraph Agents** — 5 real agents (Weather, Alert, Infrastructure, Route, Coordinator) replacing Phase 4.1 placeholders
- **Weather Agent** — calls `WeatherService.get_current_weather(lat, lng)`, infers risk level from temp/description
- **Alert Agent** — calls `AlertService.get_all()` via DB session, maps to typed `AlertItem[]` with severity ranking
- **Infrastructure Agent** — calls `LocationService` for all 7 categories in parallel (hospitals, shelters, community centres, schools, police, fire stations, pharmacies)
- **Route Agent** — picks nearest facility across all categories, computes Haversine distance and walking ETA
- **Coordinator Agent** — aggregates upstream state into `RecommendationState` (placeholder, no Gemini yet)

### Phase 4.3 (Complete)
- **Gemini Coordinator** — replaces placeholder with real AI reasoning via existing `AIService`
- **LangGraph Context Builder** — `build_llm_context(state)` converts `AgentState` to a compact LLM prompt (no service calls, no DB, no HTTP)
- **Deterministic Fallback** — when Gemini is unavailable, Coordinator generates recommendations using only `AgentState` (alert severity, weather risk, nearby facilities)
- **Structured Recommendations** — `RecommendationState` extended with `reasoning`, `recommended_destination`, and `source` ("gemini" or "fallback") fields
- **Degraded Response Detection** — Coordinator detects non-exception Gemini failures (quota, auth, network) via `_is_degraded()` before falling back

### Phase 4.3.1 (Complete)
- **Upgraded AI Decision Support UI** — polished card-based recommendation layout in existing Dashboard AIAssistant component
- **Risk Badge** — color-coded risk level display (green/yellow/orange/red/gray)
- **Destination Card** — icon + type label + name for recommended destination
- **Action Checklist** — green checkmarks instead of numbered circles
- **Explainability Section** — collapsible "How this recommendation was generated" showing all 5 agents
- **Live Data Sources Footer** — displays OpenWeather, IMD/NDMA CAP, OpenStreetMap, Gemini
- **Loading/Error/Empty States** — spinner with "Analyzing your situation...", retry button, example questions

### Phase 4.4 (Complete)
- **Parallel LangGraph Execution** — Weather, Alert, and Infrastructure agents execute concurrently via LangGraph's native fan-out
- **Fan-out from START** — all three independent agents launched simultaneously
- **Fan-in to Route** — Route agent waits for all three upstream agents to complete before executing
- **Orchestration Logging** — `[LangGraph] <Node> started` prints at each node's entry, demonstrating parallelism
- **Fault Tolerance** — if one parallel branch fails, the other branches still complete; Coordinator executes with whatever state is available
- **No Business Logic Changes** — only graph topology and logging modified; agent logic, APIs, and frontend untouched

### Phase 4.5 (Complete)
- **RoutingService Abstraction** — new `backend/app/services/routing_service.py` decouples the Route Agent from routing implementation
- **OSRM Provider** — Route Agent calls OSRM public API for real road/path distances with turn-by-turn directions and full polyline
- **Automatic Straight-Line Fallback** — if OSRM times out, returns HTTP error, or is rate-limited, RoutingService transparently falls back to Haversine straight-line
- **Route Agent Refactored** — Route Agent now calls `RoutingService.get_route(origin, dest, type)`; no routing calculations live in the agent
- **Extensible Architecture** — new providers (GraphHopper, ORS, Google, Mapbox) can be added to RoutingService without changing the Route Agent

### Phase 5 (Complete)
- **IncidentService** — new `backend/app/services/incident_service.py` owns ALL LangGraph checkpoint logic (restore, execute, save), keeping the router completely agnostic of MemorySaver internals
- **Incident Memory** — optional `incident_id` in the request preserves complete `AgentState` across requests using LangGraph's native `MemorySaver` checkpointer
- **State Restoration** — when the same `incident_id` is reused, previous agent outputs (weather, alerts, infrastructure, route, recommendation) are restored and merged with new question/location before graph execution
- **Incident Isolation** — different `incident_id` values maintain completely independent state; no cross-contamination
- **Router Refactored** — `POST /api/ai/recommendation` is now a 5-line handler that delegates entirely to `IncidentService`
- **Backward Compatible** — requests without `incident_id` continue to use a stateless graph; the API schema is unchanged

### Phase 5.1 (Complete)
- **Memory-Aware AI Recommendations** — the Coordinator injects the previous incident recommendation into the LLM context when an existing incident is restored, enabling state-aware follow-up questions
- **`build_previous_context(state)`** — new helper in `langgraph/context_builder.py` extracts only previous risk level, summary, destination, and actions (not raw weather/infrastructure/route data) from the restored AgentState
- **`has_previous_recommendation(state)`** — predicate that checks if the restored AgentState contains a populated recommendation
- **Logging** — `[Memory] Previous recommendation injected into LLM context` for restored incidents; `[Memory] No previous incident context` for new incidents
- **No Cross-Contamination** — previous recommendation is only injected when the same `incident_id` is reused; different incidents remain fully isolated
- **Prompt Structure** — restored incidents see: `PREVIOUS INCIDENT STATE` → `CURRENT INCIDENT STATE` → `USER QUESTION` in the LLM prompt
- **No API Changes** — all existing APIs, frontend, and graph topology unchanged
- **No Chat History** — only the previous recommendation is reused; no conversation history, no message memory, no previous user prompts

## AI Decision Support

AIDRAC features a multi-agent AI decision system powered by LangGraph and Gemini:

1. **Weather Agent** — fetches real-time conditions from OpenWeather, infers risk level
2. **Alert Agent** — loads active CAP alerts from the database with severity analysis
3. **Infrastructure Agent** — queries OpenStreetMap for 7 categories of nearby facilities
4. **Route Agent** — computes the nearest safe destination with walking ETA via `RoutingService` (OSRM or straight-line fallback)
5. **Coordinator Agent** — synthesizes all agent outputs using Gemini (or deterministic fallback) into a structured recommendation

The recommendation is displayed in the Dashboard's AI Decision Support card with risk badge, summary, recommended destination, action checklist, and explainability section.

## LangGraph Workflow

The agents execute in a parallel graph topology:

```text
                START
                   │
      ┌────────────┼────────────┐
      │            │            │
      ▼            ▼            ▼
  Weather      Alert      Infrastructure        ← parallel
      │            │            │
      └────────────┴────────────┘
                   │
                   ▼
                 Route                          ← depends on Infrastructure + others
                   │
                   ▼
               Coordinator                      ← Gemini or deterministic fallback
                    │
                    ▼
               Recommendation
                    │
                    ▼
              IncidentService                ← MemorySaver checkpoints (optional incident_id)
```

When `incident_id` is provided, the complete `AgentState` is checkpointed after each graph execution via LangGraph's `MemorySaver`. Subsequent requests with the same `incident_id` restore the previous state before the graph runs, enabling context-aware incident tracking across requests.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/users/me` | Get current user |
| GET | `/api/weather?lat=&lng=` | Get weather by GPS coords |
| GET | `/api/shelters` | List all shelters |
| POST | `/api/shelters` | Create shelter (admin) |
| PUT | `/api/shelters/{id}` | Update shelter (admin) |
| DELETE | `/api/shelters/{id}` | Delete shelter (admin) |
| GET | `/api/hospitals` | List all hospitals |
| POST | `/api/hospitals` | Create hospital (admin) |
| GET | `/api/disasters` | List all disasters |
| GET | `/api/disasters/active` | List active disasters |
| POST | `/api/disasters` | Create disaster (admin) |
| GET | `/api/alerts` | List active alerts (optional `?lat=&lng=` for location filtering) |
| POST | `/api/alerts` | Create alert (admin) |
| GET | `/api/alerts/history` | List expired/deactivated alerts |
| GET | `/api/routes` | List evacuation routes |
| POST | `/api/routes` | Create route |
| POST | `/api/ai/recommendation` | AI emergency recommendation (question, optional lat/lng, optional incident_id) |

## Setup Instructions

### Prerequisites
- Python 3.12+
- Node.js 20+
- PostgreSQL 16+
- Docker (optional)

### Local Development

#### 1. Clone the repository
```bash
git clone <repo-url>
cd aidrac
```

#### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your database credentials and API keys

# Run database migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload
```

#### 3. Frontend Setup
```bash
cd frontend
cp ../.env.example .env
# Add VITE_ORS_API_KEY for routing (optional)
npm install
npm run dev
```

#### 4. Open in browser
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Docker Setup
```bash
# Create .env from template
cp .env.example .env
# Edit with your keys
docker-compose up --build
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_USER` | Yes | PostgreSQL username |
| `POSTGRES_PASSWORD` | Yes | PostgreSQL password |
| `POSTGRES_DB` | Yes | PostgreSQL database name |
| `SECRET_KEY` | Yes | JWT signing secret |
| `OPENWEATHER_API_KEY` | No | OpenWeather API key (mock data used if empty) |
| `OVERPASS_API_URL` | No | Primary Overpass API endpoint (defaults to openstreetmap.fr, falls back to overpass-api.de, kumi.systems) |
| `GEMINI_API_KEY` | No | Google Gemini API key (AI recommendations disabled if not set) |
| `GEMINI_MODEL` | No | Gemini model name (default: `gemini-2.5-flash`) |
| `VITE_ORS_API_KEY` | No | OpenRouteService API key (OSRM fallback if empty) |
| `IMD_CAP_RSS_URL` | No | Primary IMD CAP RSS feed URL (official India alerts) |
| `NDMA_CAP_RSS_URL` | No | Secondary NDMA CAP RSS feed URL (fetched concurrently with IMD) |
| `REFRESH_INTERVAL_SECONDS` | No | Background alert refresh interval (default: 300) |
| `ALERT_RETENTION_DAYS` | No | Days to retain expired alerts before physical deletion (default: 30) |

### Demo Credentials
- **Admin:** admin@aidrac.com / admin123
- **User:** user@aidrac.com / user123

## Phase 6+ Roadmap
- **Agent Observability** — LangSmith integration for tracing, monitoring, and debugging agent execution
- **Human-in-the-Loop** — breakpoints for coordinator approval before critical recommendations
- **Multi-turn Conversations** — agent remembers past questions and context across sessions
- **Additional Agents** — resource allocation agent, population density agent, weather forecasting agent
