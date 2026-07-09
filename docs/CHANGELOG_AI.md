# AIDRAC — AI-Generated Development Changelog

This changelog reconstructs the development history of AIDRAC by analyzing the existing codebase. It is organized into phases that reflect the architectural evolution of the project.

---

## Phase 1 — Core Platform Foundation

### 1.1 Project Scaffolding

**Objective:** Initialize the monorepo structure with backend and frontend skeletons.

**Changes:**
- Created root `aidrac/` directory with `docker-compose.yml`, `.gitignore`, `.env.example`
- Scaffolded `backend/` with FastAPI project structure: `app/`, `config/`, `database/`, `models/`, `schemas/`, `routers/`, `services/`, `utils/`, `alembic/`
- Scaffolded `frontend/` with Vite + React + TypeScript + Tailwind: `src/`, `public/`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`, `index.html`
- Created `README.md` with setup instructions and architecture overview

**Key Files:**
- `backend/app/__init__.py`, `backend/app/config/__init__.py`, `backend/app/database/__init__.py`, `backend/app/models/__init__.py`, `backend/app/schemas/__init__.py`, `backend/app/routers/__init__.py`, `backend/app/services/__init__.py`, `backend/app/utils/__init__.py`
- `frontend/src/main.tsx`, `frontend/src/App.tsx`, `frontend/src/index.css`, `frontend/src/vite-env.d.ts`

**Architecture Decision:** Monorepo with clear separation of concerns. Backend follows service layer pattern; frontend uses component-per-file convention.

---

### 1.2 Database & Models

**Objective:** Define PostgreSQL schema with async SQLAlchemy and auto-migration.

**Changes:**
- Configured `settings.py` with Pydantic `BaseSettings` for all env vars (`DATABASE_URL`, `SECRET_KEY`, `ALGORITHM`, `OPENWEATHER_API_KEY`)
- Set up `connection.py` with async engine (`create_async_engine`), session factory (`async_sessionmaker`), and `DeclarativeBase`
- Implemented Alembic migration configuration with async support (`alembic/env.py` uses `async_engine_from_config`)

**Models Created:**
- `User` with `UserRole` enum (admin/user): id, full_name, email (unique), password (hashed), role
- `Shelter`: id, name, lat/lng, capacity, occupancy, phone, address
- `Hospital`: id, name, lat/lng, emergency_available, phone, address
- `Disaster`: id, type, severity, lat/lng, description, status, created_at
- `Alert`: id, title, message, FK to disaster, severity, created_at
- `Route`: id, source/destination lat/lng, estimated_time, distance_km

**Key Files:**
- `backend/app/config/settings.py`
- `backend/app/database/connection.py`
- `backend/app/models/user.py`, `shelter.py`, `hospital.py`, `disaster.py`, `alert.py`, `route.py`
- `backend/alembic/env.py`, `backend/alembic/script.py.mako`

**Architecture Decision:** Async SQLAlchemy throughout for non-blocking database access. `Base.metadata.create_all` in lifespan for auto-provisioning (no separate migration step needed in development). Models define explicit column types with validation constraints.

---

### 1.3 Pydantic Schemas

**Objective:** Define request/response validation schemas for all endpoints.

**Changes:**
- `UserCreate`/`UserLogin`/`UserResponse`/`TokenResponse` with EmailStr validation and min-length constraints
- `ShelterCreate`/`ShelterUpdate`/`ShelterResponse` with lat/lng range validation, capacity > 0
- `HospitalCreate`/`HospitalResponse` with lat/lng range validation
- `DisasterCreate`/`DisasterResponse` with string length constraints
- `AlertCreate`/`AlertResponse` with disaster_id optional
- `RouteCreate`/`RouteResponse` with lat/lng range validation
- All response schemas use `Config.from_attributes = True` for ORM compatibility

**Key Files:**
- `backend/app/schemas/user.py`, `shelter.py`, `hospital.py`, `disaster.py`, `alert.py`, `route.py`

**Architecture Decision:** Pydantic v2 with `from_attributes` for seamless SQLAlchemy model-to-schema conversion. Separate create/update/response schemas per entity to enforce different constraints per operation.

---

### 1.4 Authentication System

**Objective:** Implement JWT-based authentication with register, login, and role-based access control.

**Changes:**
- `security.py`: bcrypt password hashing via `passlib`, JWT create/decode via `python-jose` with HS256
- `dependencies.py`: `get_current_user` extracts Bearer token, decodes JWT, fetches user from DB; `require_admin` checks admin role
- `auth.py` service: `register` checks email uniqueness, hashes password; `login` verifies credentials
- `auth.py` router: `POST /api/auth/register` (201), `POST /api/auth/login` — both return `TokenResponse` with JWT
- `users.py` router: `GET /api/users/me` — protected, returns `UserResponse`
- JWT payload includes `sub` (user ID string) and `role` for admin checks

**Key Files:**
- `backend/app/utils/security.py`
- `backend/app/utils/dependencies.py`
- `backend/app/services/auth.py`
- `backend/app/routers/auth.py`
- `backend/app/routers/users.py`

**Architecture Decision:** Stateless JWT auth with no refresh tokens in Phase 1. Token expiration configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`. Admin routes use a composable `require_admin` dependency that chains on `get_current_user`.

---

### 1.5 CRUD APIs

**Objective:** Build full CRUD operations for all domain entities with admin protection.

**Changes:**
- `ShelterService`: `get_all`, `get_by_id` (404), `create`, `update` (partial via `exclude_unset`), `delete`
- `HospitalService`: `get_all`, `get_by_id` (404), `create`
- `DisasterService`: `get_all` (ordered by created_at desc), `get_active` (status="active"), `create`
- `AlertService`: `get_all` (ordered desc), `get_active` (with disaster join), `create`
- Each entity's router maps service methods to HTTP verbs with appropriate status codes
- All POST/PUT/DELETE operations protected by `require_admin`

**Key Files:**
- `backend/app/services/shelter.py`, `hospital.py`, `disaster.py`, `alert.py`
- `backend/app/routers/shelters.py`, `hospitals.py`, `disasters.py`, `alerts.py`, `routes.py`

**Architecture Decision:** Services are instantiated per-request with the DB session injected via constructor. No global service singletons. Routes router uses inline logic (no service layer) for simplicity.

---

### 1.6 Weather Module

**Objective:** Implement weather data retrieval with real API and mock fallback.

**Changes:**
- `WeatherService.get_current_weather(lat, lng)`: calls OpenWeatherMap `/data/2.5/weather` via `httpx.AsyncClient`
- Returns simplified response: temperature, feels_like, humidity, description, wind_speed, rain, icon, city, is_mock flag
- If `OPENWEATHER_API_KEY` is empty/missing, returns mock data (32°C, partly cloudy, Delhi)
- Router accepts optional lat/lng query params (defaults to Delhi: 28.6139, 77.209)

**Key Files:**
- `backend/app/services/weather.py`
- `backend/app/routers/weather.py`

**Architecture Decision:** Mock data enables full development without API key. The `is_mock` flag allows the frontend to display a "(mock)" label. No caching implemented — every request hits the API or returns fresh mock data.

---

### 1.7 Database Seeder

**Objective:** Populate the database with realistic demo data for development and testing.

**Changes:**
- `seed.py`: guards against double-seeding via user existence check
- Creates 2 users: admin@aidrac.com (admin/admin123) and user@aidrac.com (user/user123) with bcrypt-hashed passwords
- Creates 10 shelters in New Delhi with capacity ranging 150–600, occupancy 80–320
- Creates 10 hospitals with emergency availability flags
- Creates 5 disasters: 2 floods (critical/high), cyclone (severe), earthquake (moderate), fire (critical/contained)
- Creates 10 alerts: 4 critical/severe, 4 warnings, 2 informational
- Creates 3 pre-defined evacuation routes

**Key Files:**
- `backend/app/database/seed.py`

**Architecture Decision:** Seeder runs inside FastAPI lifespan, immediately after table creation. This guarantees the database is always ready on first startup with no manual seeding step.

---

### 1.8 Frontend Foundation

**Objective:** Build the React application shell with routing, auth, layout, and design system.

**Changes:**
- `main.tsx`: mounts `<App />` inside `<BrowserRouter>` + `<AuthProvider>`
- `App.tsx`: defines all routes with `ProtectedRoute` guards
- `index.css`: Tailwind directives + custom component classes (`.card`, `.btn-primary`, `.btn-emergency`, `.input-field`, `.sidebar-link`)
- `AuthContext.tsx`: manages JWT token in localStorage, fetches user profile on mount, provides `login`/`register`/`logout`/`isAdmin`
- `AppLayout.tsx`: flexbox layout with Sidebar (left, fixed 64px) + Navbar (top) + scrollable main + floating EmergencyButton
- `Sidebar.tsx`: `NavLink`-based navigation with active state styling, conditional admin link
- `Navbar.tsx`: shows app name, admin badge, user info, logout button
- `ProtectedRoute.tsx`: renders loading spinner while auth resolves, redirects to `/login` if unauthenticated, to `/dashboard` if insufficient role
- `DashboardCard.tsx`: polymorphic stat card with icon, title, value, subtitle, color theme (blue/orange/red/green)
- `LoadingSpinner.tsx`, `ErrorState.tsx`, `EmptyState.tsx`: reusable feedback components
- `EmergencyButton.tsx`: floating red button linking to `tel:112`

**Color Palette:**
- Primary: blue spectrum (#eff6ff → #172554)
- Emergency: orange spectrum (#fff7ed → #7c2d12)

**Key Files:**
- `frontend/src/main.tsx`, `frontend/src/App.tsx`, `frontend/src/index.css`
- `frontend/src/context/AuthContext.tsx`
- `frontend/src/components/AppLayout.tsx`, `Sidebar.tsx`, `Navbar.tsx`, `ProtectedRoute.tsx`, `DashboardCard.tsx`, `LoadingSpinner.tsx`, `ErrorState.tsx`, `EmptyState.tsx`, `EmergencyButton.tsx`

**Architecture Decision:** Auth state is managed via React Context (no Redux/Zustand). The EmergencyButton is a fixed-position global component, not page-specific. Protected routes use a wrapper component pattern rather than route-level middleware.

---

### 1.9 Frontend API Layer

**Objective:** Create a centralized HTTP client with JWT interceptors and typed API methods.

**Changes:**
- Axios instance with `baseURL: '/api'` and JSON headers
- Request interceptor: reads JWT from localStorage, attaches `Authorization: Bearer <token>`
- Response interceptor: on 401, clears storage and redirects to `/login`
- Typed API modules: `authApi`, `shelterApi`, `hospitalApi`, `disasterApi`, `alertApi`, `routeApi`, `weatherApi`
- `useApi<T>` generic hook: manages loading/error/data states, refetch capability, Axios error handling

**Key Files:**
- `frontend/src/services/api.ts`
- `frontend/src/hooks/useApi.ts`

**Architecture Decision:** Single Axios instance with interceptors prevents token logic duplication. The `useApi` hook provides a consistent data-fetching pattern across all pages. No React Query or SWR — keeping dependencies minimal.

---

### 1.10 Frontend Pages

**Objective:** Implement all public pages with data fetching and state management.

**Landing Page (`/`):**
- Hero section with project title, description, feature cards (Real-time Mapping, Emergency Alerts, Community Support)
- Conditional CTAs based on auth state (Dashboard vs Get Started)
- Emergency call button with `animate-pulse`
- Dark footer with copyright

**Login Page (`/login`):**
- Email/password form with show/hide password toggle
- Redirects to `/dashboard` if already authenticated
- Demo credentials displayed in info box
- Dark gradient background with centered white card

**Register Page (`/register`):**
- Full name, email, password, confirm password
- Client-side validation (password match, min length)
- Redirects to `/dashboard` on success

**Dashboard Page (`/dashboard`):**
- 4 stat cards (active disasters, critical alerts, shelters, hospitals)
- Weather card with temperature, feels-like, humidity, wind, rain, city
- Recent alerts panel with severity-based color coding
- Active disaster zones table with type, severity badge, status badge, location, date

**Shelters Page (`/shelters`):**
- Card grid showing each shelter with name, address, occupancy bar (color-coded), phone link
- Visual capacity bar: green (<60%), orange (60-89%), red (≥90%)

**Hospitals Page (`/hospitals`):**
- Card grid showing each hospital with name, address, emergency availability badge, phone link
- Green/red badge for emergency status

**Alerts Page (`/alerts`):**
- Alert feed with severity-based styling (critical=red, severe=orange, warning=yellow, info=blue)
- Each alert shows title, message, severity badge, timestamp

**Admin Page (`/admin`):**
- 4 stat cards (shelters, hospitals, disasters, system status)
- Shelter overview table with occupancy/percentage
- Active disaster zones table

**404 Page:**
- Centered shield icon, "404" text, "Go Home" button

**Key Files:**
- `frontend/src/pages/Landing.tsx`, `Login.tsx`, `Register.tsx`, `Dashboard.tsx`, `Shelters.tsx`, `Hospitals.tsx`, `AlertsPage.tsx`, `Admin.tsx`, `NotFound.tsx`

**Architecture Decision:** Each page is self-contained with its own data fetching via `useApi`. No shared page-level state. The Dashboard fetches 5 datasets independently (weather, disasters, alerts, shelters, hospitals).

---

### 1.11 Interactive Map (Phase 1)

**Objective:** Build a Leaflet-based interactive map with markers for user, shelters, hospitals, and disasters.

**Changes:**
- `MapPage.tsx`: centered at Delhi (28.6139, 77.209), zoom level 12
- Custom `divIcon` markers: user (blue), shelter (orange), hospital (red), disaster (dark red with pulse border)
- Layer toggle buttons: All, Shelters, Hospitals, Disasters
- Disaster zones rendered with `Circle` (fixed 1000m radius in Phase 1)
- Popups with entity details on click
- Legend bar at bottom showing marker colors

**Key Files:**
- `frontend/src/pages/MapPage.tsx`

**Architecture Decision:** Direct Leaflet integration via `react-leaflet` (MapContainer, TileLayer, Marker, Popup, Circle). Custom `divIcon` markers with emoji characters for visual distinction. Phase 1 uses hardcoded user position and fixed disaster radius.

---

### 1.12 Docker & Deployment

**Objective:** Containerize all services for one-command deployment.

**Changes:**
- `docker-compose.yml`: PostgreSQL 16 (health-checked), backend, frontend (NGINX)
- `backend/Dockerfile`: `python:3.12-slim`, pip install, uvicorn
- `frontend/Dockerfile`: multi-stage (node:20-alpine build → nginx:alpine serve)
- `nginx.conf`: SPA fallback to index.html, `/api` proxy to backend:8000
- `.env` files with Docker Compose variable interpolation (`${VAR:-default}`)

**Key Files:**
- `docker-compose.yml`
- `backend/Dockerfile`
- `frontend/Dockerfile`, `nginx.conf`

**Architecture Decision:** Services depend on each other via `condition: service_healthy` for PostgreSQL. Frontend uses production-grade NGINX rather than Vite dev server in Docker.

---

## Phase 2 — Real-Time Geolocation & Navigation

### 2.1 Browser Geolocation Hook

**Objective:** Replace hardcoded user location with real browser GPS, handling all edge cases.

**Changes:**
- Created `useGeolocation.ts` hook wrapping `navigator.geolocation`
- Uses `watchPosition` for continuous tracking by default
- Options: `enableHighAccuracy` (default true), `timeout` (10s), `maximumAge` (5s), `watch` (true/false)
- State machine: loading → position OR error
- Error classification: `PERMISSION_DENIED` → "No GPS permission", `TIMEOUT` → "GPS request timed out", general → "GPS location unavailable"
- Detects unsupported browsers via `!navigator.geolocation` check
- Cleanup via `clearWatch` on unmount
- Exposes `refresh()` method for manual retry

**Key Files:**
- `frontend/src/hooks/useGeolocation.ts`

**Architecture Decision:** Single hook encapsulates all Geolocation API complexity. Returns both state and refresh action. The `watch` option allows one-shot usage (e.g., EmergencyButton) vs continuous tracking (MapPage).

---

### 2.2 Haversine Distance Utilities

**Objective:** Implement pure-function geographic calculations for nearest-item detection.

**Changes:**
- Created `haversine.ts` with Earth radius constant (6371 km)
- `haversineDistance(lat1, lng1, lat2, lng2) → km`: standard Haversine formula
- `findNearest<T>(items, lat, lng) → NearestItem<T> | null`: single-pass minimum distance search
- `sortByDistance<T>(items, lat, lng) → NearestItem<T>[]`: map + sort pattern
- `estimateWalkingTime(distanceKm) → minutes`: assumes 5 km/h
- `estimateDrivingTime(distanceKm) → minutes`: assumes 30 km/h

**Key Files:**
- `frontend/src/utils/haversine.ts`

**Architecture Decision:** Pure functions with no dependencies on React or external GIS libraries. Generic TypeScript constraint `T extends { latitude: number; longitude: number }` ensures any entity with lat/lng can use these utilities.

---

### 2.3 Routing Engine

**Objective:** Implement client-side routing with a three-tier fallback chain.

**Changes:**
- Created `routing.ts` with `getRoute(start, end) → Promise<RouteInfo>`
- Tier 1 — OpenRouteService: POST to `/v2/directions/foot-walking/geojson` with API key from `import.meta.env.VITE_ORS_API_KEY`. Returns full GeoJSON with segments, steps, distance, duration
- Tier 2 — OSRM Public API: GET `/route/v1/foot/{coordinates}` with `overview=full&geometries=geojson&steps=true`. No API key needed.
- Tier 3 — Straight-line fallback: Haversine distance + midpoint polyline (3 points) + estimated walking time + generic directions
- Error handling: if ORS fails (no key or network error), falls through to OSRM; if OSRM fails, falls through to straight-line
- `RouteInfo` type includes `provider` field ('openrouteservice' | 'osrm' | 'straight-line') for transparency

**Key Files:**
- `frontend/src/utils/routing.ts`
- `frontend/src/types/index.ts` (RouteInfo interface)

**Architecture Decision:** Client-side routing avoids backend load and enables offline-capable straight-line fallback. The `provider` field allows the UI to display which routing source was used. ORS expects `[lng, lat]` order in coordinates; OSRM uses `lng,lat` in URL; internal representation uses `[lat, lng]` for Leaflet compatibility.

---

### 2.4 Weather by GPS Coordinates

**Objective:** Replace hardcoded Delhi weather with GPS-based real-time weather and auto-refresh.

**Changes:**
- Created `useWeather` hook that fetches weather from backend whenever `position.lat` or `position.lng` changes
- Polls every 5 minutes (`REFRESH_INTERVAL = 5 * 60 * 1000`) via `setInterval`
- Cleans up interval on unmount
- Dashboard updated: passes `geolocation.position` to `useWeather`, shows GPS status indicator, rain data with `<Droplets>` icon
- Dashboard shows "Enable GPS for local weather" when position is null
- Mock label displayed when `weather.is_mock` is true

**Key Files:**
- `frontend/src/hooks/useWeather.ts`
- `frontend/src/pages/Dashboard.tsx`

**Architecture Decision:** Separate hook from `useApi` because of the polling requirement. Passes lat/lng as dependency to trigger refetch on location change. Backend already accepts lat/lng params — no backend changes needed.

---

### 2.5 MapPage Overhaul

**Objective:** Transform the static Phase 1 map into a full-featured geolocation and navigation interface.

**Changes:**
- Replaces hardcoded `userPosition` with `useGeolocation({ watch: true })`
- Adds `LocationStatus` component in the header area
- Nearest shelter gets a distinct green marker (`nearestShelterIcon`, larger 36px)
- Nearest shelter/hospital computed via `useMemo` with `findNearest`
- Sorted nearest lists displayed in sidebar via `sortByDistance`
- Route polyline rendered with `<Polyline>` (dashed, blue, 4px weight)
- `FlyTo` component: flies map to user position on location change
- `FitBounds` component: zooms to route bounds when route loads
- Route toggle button: "Show Safest Route" / "Hide Route Info"
- RoutePanel component shows nearest shelter, hospital, distance, duration, provider, turn-by-turn steps
- Disaster radius scaled by severity (critical=3000m, severe=2000m, high=1500m, moderate=1000m, default=500m)
- Popup enhancements: shows distance from user for hospitals and disasters
- Handles navigation state from EmergencyButton (`location.state` with emergencyRoute, nearestShelter, nearestHospital, userPosition)
- Grid layout: map (flex-1) + sidebar (320px)

**Key Files:**
- `frontend/src/pages/MapPage.tsx`
- `frontend/src/components/RoutePanel.tsx`
- `frontend/src/components/LocationStatus.tsx`

**Architecture Decision:** All nearest-item calculations are memoized with `useMemo` to avoid recomputation on every render. Route fetching is triggered by a `useEffect` dependent on `showRoutePanel`, `position`, and `nearestShelter`. The map sidebar shows sorted lists rather than overwhelming the map with labels.

---

### 2.6 Enhanced Emergency Button

**Objective:** Upgrade the static emergency phone button to a smart evacuation assistant.

**Changes:**
- Toggle menu: clicking the main red button reveals a sub-menu
- "Find Safest Route" button: on click, fetches shelters and hospitals, computes nearest via Haversine (client-side), navigates to `/map` with `location.state` containing:
  - `emergencyRoute: true` — triggers route panel on map
  - `nearestShelter` and `nearestHospital` — NearestItem objects
  - `userPosition` — one-shot GPS position
- Loading spinner on button while data is being fetched
- Disabled state when GPS position is unavailable
- Uses `useGeolocation({ watch: false })` for one-time position read

**Key Files:**
- `frontend/src/components/EmergencyButton.tsx`

**Architecture Decision:** Navigation state via React Router `useLocation().state` avoids shared context or global state. One-shot GPS (rather than continuous watch) conserves battery. Client-side nearest computation avoids an extra API round-trip.

---

### 2.7 Performance Optimizations

**Objective:** Minimize bundle size and avoid unnecessary re-renders.

**Changes:**
- **Lazy-loaded MapPage** via `React.lazy(() => import('./pages/MapPage'))` with `<Suspense fallback={<LoadingSpinner />}>`
- **Memoized distance calculations** in MapPage: `nearestShelter`, `nearestHospital`, `sortedShelters`, `sortedHospitals`, `routeBounds` all wrapped in `useMemo`
- **Memoized `providerLabel`** in RoutePanel to avoid string mapping on every render
- **`useCallback` for route fetching** (`fetchRoute`) to prevent infinite effect loops
- `useEffect` for route fetch depends on `showRoutePanel`, `position`, and `nearestShelter` — minimal trigger set
- `FlyTo` and `FitBounds` components use `useEffect` with dependency arrays to control map animations

**Key Files:**
- `frontend/src/App.tsx` (lazy import)
- `frontend/src/pages/MapPage.tsx` (memos + callbacks)
- `frontend/src/components/RoutePanel.tsx` (memo)

**Architecture Decision:** Lazy loading removes ~200KB (Leaflet + react-leaflet) from the initial bundle. All geographic computations are memoized because they iterate over arrays and run trig functions. `useCallback` stabilizes function references for child component dependencies.

---

### 2.8 Error Handling

**Objective:** Graceful degradation when external services or browser features are unavailable.

**Changes:**
- **GPS denied**: `LocationStatus` shows "No GPS permission" in red. Map defaults to Delhi fallback coordinates. Dashboard shows "Enable GPS for local weather".
- **GPS unsupported**: `LocationStatus` shows "GPS not supported" in yellow.
- **Weather API failure**: Dashboard shows cached data if available (from previous successful fetch), or error state if no cache.
- **Routing failure**: Falls through from ORS → OSRM → straight-line. User sees "Estimated (direct)" provider label.
- **Network error**: Axios response interceptor handles 401 (redirects to login). Other errors captured by `useApi` and displayed via `ErrorState` with retry button.

**Key Files:**
- `frontend/src/components/LocationStatus.tsx`
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/utils/routing.ts`
- `frontend/src/services/api.ts`

**Architecture Decision:** Failures are isolated per feature. Weather failure doesn't crash the dashboard. Routing failure still produces a usable straight-line route. GPS failure doesn't block access to the map (uses fallback coordinates).

---

### 2.9 Type System Expansion

**Objective:** Add TypeScript interfaces for all Phase 2 data structures.

**Changes:**
- `GeoPosition`: `{ lat: number; lng: number }` — normalized coordinate representation
- `GeolocationState`: `{ position, error, loading, permissionDenied, unsupported }` — complete GPS state machine
- `NearestItem<T>`: `{ item: T; distanceKm: number }` — generic distance wrapper
- `RouteInfo`: `{ coordinates, distanceKm, durationMin, steps, provider }` — routing result with source tracking

**Key Files:**
- `frontend/src/types/index.ts`

**Architecture Decision:** Generic `NearestItem<T>` enables reuse across Shelter, Hospital, and any future location-based entity. `RouteInfo.provider` is a string union that enables transparent routing source display.

---

### 2.10 Documentation & Environment

**Objective:** Document Phase 2 features and configure optional API keys.

**Changes:**
- Updated `README.md` with Phase 2 feature list, environment variable table, and Phase 3 roadmap
- Updated `.env.example` with `VITE_ORS_API_KEY` placeholder
- Created `docs/PROJECT_CONTEXT.md` — comprehensive project overview for new joiners
- Created `docs/CHANGELOG_AI.md` — reconstructed development history from codebase analysis
- `.gitignore` excludes `backend/.env` and `frontend/.env` in addition to root `env`

**Key Files:**
- `README.md`
- `.env.example`
- `.gitignore`
- `docs/PROJECT_CONTEXT.md`
- `docs/CHANGELOG_AI.md`

---

## Phase 3.1 — Live Infrastructure from OpenStreetMap

### 3.1.1 Overpass API Service

**Objective:** Replace static PostgreSQL shelter/hospital data with real-time infrastructure queries from OpenStreetMap via the Overpass API.

**Changes:**
- Created `OverpassService` in `backend/app/services/overpass_service.py`:
  - Builds Overpass QL (Query Language) queries for 5 infrastructure categories: hospitals (`amenity=hospital`), shelters (`emergency=shelter` or `building=bunker`), police stations (`amenity=police`), fire stations (`amenity=fire_station`), pharmacies (`amenity=pharmacy`)
  - Uses `httpx.AsyncClient` with configurable timeout (default 10s) to POST queries to the Overpass API endpoint
  - Response parser extracts nodes with `lat`, `lon`, `tags.name`, `tags."addr:full"`; falls back to `tags."addr:street"` for address
  - Custom `OverpassError` exception class for HTTP failures, timeouts, and invalid responses
  - Configurable via `OVERPASS_API_URL` env var (defaults to `https://overpass-api.de/api/interpreter`)
  - Bounding box query limited to ~20km radius around the search center for performance
  - Returns lists of clean `dict` objects (name, latitude, longitude, address) — no ORM models involved

**Key Files:**
- `backend/app/services/overpass_service.py`

**Architecture Decision:** Stateless service with no caching at this layer. Caching is handled upstream by LocationService. Queries use bounding boxes rather than global searches to limit response size. Address extraction prefers `addr:full` (complete address) over `addr:street` (street only).

---

### 3.1.2 LocationService Facade

**Objective:** Create a unified service facade that provides nearby infrastructure data with caching, Haversine sorting, and graceful fallback.

**Changes:**
- Created `LocationService` in `backend/app/services/location_service.py`:
  - 5 public methods: `get_nearby_hospitals`, `get_nearby_shelters`, `get_nearby_police`, `get_nearby_firestations`, `get_nearby_pharmacies`
  - Each calls `_fetch(category, lat, lng, radius)` which:
    1. Checks in-memory TTL cache (key: `{rounded_lat_2dp}:{rounded_lng_2dp}:{category}`)
    2. If cache miss: calls `OverpassService.query(category, lat, lng, radius)`
    3. Computes Haversine distance for each result and sorts ascending
    4. Caches the sorted result with expiry timestamp (10 min TTL)
    5. Returns cached result if still valid
  - On `OverpassError`: returns the last cached result if stale cache exists; if no cache, raises the error
  - Thread-safe cache via `threading.Lock` for concurrent FastAPI requests
  - `_haversine(lat1, lng1, lat2, lng2)` — standalone implementation (no external dependency)
  - Cache constants: `CACHE_TTL = 600` (10 min), `ROUND_DIGITS = 2` for lat/lng cache keys

**Key Files:**
- `backend/app/services/location_service.py`

**Architecture Decision:** In-memory cache (not Redis) avoids additional infrastructure dependencies. TTL caching at the service layer, not the Overpass layer, allows the cache to serve sorted-by-distance results directly. Lat/lng rounding to 2 decimal places (~1.1km grid) prevents cache fragmentation.

---

### 3.1.3 Location Router

**Objective:** Expose a single unified endpoint that returns all nearby infrastructure categories in parallel.

**Changes:**
- Created `backend/app/routers/location.py`:
  - `GET /api/location/nearby` with query params: `lat` (float, required), `lng` (float, required), `radius` (int, optional, default 10000 meters)
  - Single `LocationService` instance created at module level (not per-request) since it's stateless beyond its cache
  - Uses `asyncio.gather` to fire all 5 category queries in parallel, each with `timeout(3)` — if any query times out, it returns an empty list for that category
  - Returns `{hospitals: [...], shelters: [...], police: [...], firestations: [...], pharmacies: [...]}` — each entry has `name`, `latitude`, `longitude`, `distance` (km, sorted), `address`
  - Each result object has `distance` in km, sorted ascending within each category
  - Registered in `backend/app/main.py` via `app.include_router(location_router, prefix="/api")`

**Key Files:**
- `backend/app/routers/location.py`
- `backend/app/main.py` (updated)

**Architecture Decision:** Parallel fetching via `asyncio.gather` with per-category timeout ensures that a slow Overpass query for one category doesn't block the entire response. Module-level service instance preserves the in-memory cache across requests.

---

### 3.1.4 Frontend Types & API Integration

**Objective:** Add TypeScript types for the new live data structures and API methods.

**Changes:**
- Added `NearbyCategory` union type: `'hospital' | 'shelter' | 'police' | 'firestation' | 'pharmacy'`
- Added `NearbyPlace` interface: `{ name, latitude, longitude, distance, address }`
- Added `NearbyResponse` interface: `{ hospitals, shelters, police, firestations, pharmacies }` — each is `NearbyPlace[]`
- Added `locationApi.nearby(lat, lng, radius?)` method to the centralized API service (`api.ts`)
- Updated `RoutePanel` props to accept `NearestItem<NearbyPlace>` instead of `NearestItem<Shelter>` / `NearestItem<Hospital>`
- `DashboardCard` already supported `subtitle` prop — used to show "live (OSM)" / "from database"

**Key Files:**
- `frontend/src/types/index.ts`
- `frontend/src/services/api.ts`
- `frontend/src/components/RoutePanel.tsx`

**Architecture Decision:** `NearbyPlace` is a unified type for all 5 categories, avoiding 5 nearly-identical interfaces. The `distance` field is pre-computed server-side using Haversine, matching the frontend calculation.

---

### 3.1.5 MapPage Live Data Integration

**Objective:** Replace static PostgreSQL infrastructure on the map with live OpenStreetMap data as the primary source.

**Changes:**
- MapPage fetches live data via `locationApi.nearby(position.lat, position.lng)` inside a `useApi` hook, triggered when GPS position changes
- Live data (`liveShelters`, `liveHospitals`, `livePolice`, `liveFirestations`, `livePharmacies`) is used as primary source; falls back to `shelterApi.getAll()` / `hospitalApi.getAll()` when no GPS or no live results
- 3 new marker icons:
  - Police: blue circle with emoji, centered at Delhi or user position
  - Fire stations: dark red circle with emoji
  - Pharmacies: green circle with emoji
- 3 new layer toggle buttons: Police, Fire, Pharmacy — each shows live markers when the layer is active or "All" is selected
- Sidebar "Nearby Infrastructure" panel displays live counts for all 5 categories with colored dot indicators
- Nearest shelter/hospital calculations use live data when available, falling back to static data
- Subtitle legend extended with Police (blue), Fire (dark red), Pharmacy (green) markers

**Key Files:**
- `frontend/src/pages/MapPage.tsx`

**Architecture Decision:** Live data takes priority over static DB data. The `refetchNearby` function is called when position changes. Each category independently renders markers from the live results — if live data is empty (no GPS or API failure), the MapPage transparently falls back to the static PostgreSQL-fetched data.

---

### 3.1.6 EmergencyButton & Dashboard Updates

**Objective:** Update EmergencyButton and Dashboard to use live Overpass data instead of static DB queries.

**Changes:**
- **EmergencyButton**: replaces `shelterApi.getAll()` + `hospitalApi.getAll()` with single `locationApi.nearby(position.lat, position.lng)` call; computes nearest shelter/hospital from live results; falls back gracefully if live results are empty
- **Dashboard**: conditionally shows live Overpass infrastructure counts when GPS is available:
  - Fetches `locationApi.nearby()` when `geolocation.position` is non-null
  - Shelter/Hospital stat cards display "live (OSM)" subtitle when using live data, "from database" when using static data
  - Doesn't break when GPS is unavailable — falls back to static PostgreSQL counts

**Key Files:**
- `frontend/src/components/EmergencyButton.tsx`
- `frontend/src/pages/Dashboard.tsx`

**Architecture Decision:** The EmergencyButton uses a single API call instead of two parallel calls (simpler, fewer HTTP requests). The Dashboard uses a conditional fetch — only calls `locationApi.nearby()` when GPS is available, avoiding unnecessary API calls and preserving the static fallback experience.

---

### 3.1.7 Documentation & Environment

**Objective:** Document Phase 3.1 changes and add Overpass API configuration.

**Changes:**
- Added `OVERPASS_API_URL` to `.env.example` (blank default, optional)
- Updated `PROJECT_CONTEXT.md`: added Phase 3.1 to the overview, feature list, and env var table; renamed Phase 3 to Phase 3.2+ in the roadmap
- Updated `CHANGELOG_AI.md`: added full Phase 3.1 changelog (7 sections)

**Key Files:**
- `.env.example`
- `docs/PROJECT_CONTEXT.md`
- `docs/CHANGELOG_AI.md`

### 3.1.8 User-Selectable Emergency Destinations

**Objective:** Redesign the emergency routing flow from a single "Find Safest Route" to a user-selectable destination picker with 5 categories.

**Changes:**
- **EmergencyButton redesign** (`frontend/src/components/EmergencyButton.tsx`):
  - Replaced single "Find Safest Route" button with 5 color-coded destination option buttons
  - Each button has a distinct lucide icon (Home, Heart, Shield, Flame, Pill) and background color
  - On click: fetches nearby data via `locationApi.nearby()`, finds nearest of selected type, navigates to `/map` with `destinationType` and `destinationItem` in state
  - Per-button loading spinner via `calculating` state tracking which option is in flight
  - Disabled state when GPS is unavailable
  - Preserved the existing `animate-fade-in` menu animation and `animate-bounce` emergency button

- **RoutePanel simplification** (`frontend/src/components/RoutePanel.tsx`):
  - Replaced `nearestShelter`/`nearestHospital` props with unified `destination: NearestItem<NearbyPlace> | null` and `destinationType: EmergencyDestinationType | null`
  - Changed "Nearest shelter:" label to "Destination:" — dynamically shows the selected facility type
  - Error message now reads "No nearby {type} found." where `{type}` is derived from `DESTINATION_LABELS`
  - Still shows distance, duration, provider, and turn-by-turn directions when route is computed

- **MapPage updates** (`frontend/src/pages/MapPage.tsx`):
  - Nav state type updated: `nearestShelter`/`nearestHospital` replaced with `destinationType`/`destinationItem`
  - Destination marker: uses the green highlight icon for any destination type, with popup showing the correct label from `DESTINATION_LABELS`
  - Route fetching: `fetchRoute` now uses `destination` instead of `nearestShelter`; guards on `!position || !destination`
  - Route button: only renders when a destination is set from nav state; shows "Emergency Route" / "Hide Route Info"
  - Shelter/hospital marker deduplication: checks against `destination` instead of `nearestShelter`/`nearestHospital`

- **Type system expansion** (`frontend/src/types/index.ts`):
  - Added `EmergencyDestinationType` union: `'shelter' | 'hospital' | 'police' | 'firestation' | 'pharmacy'`
  - Added `DESTINATION_LABELS` constant: maps each type to a human-readable label (Safe Shelter, Hospital, Police Station, Fire Station, Pharmacy)

- **Overpass endpoint resilience** (`backend/app/services/overpass_service.py`):
  - Added `OVERPASS_API_URL` to `settings.py` with default `https://overpass.openstreetmap.fr/api/interpreter`
  - Fallback chain: if primary endpoint fails → try `overpass-api.de` → `overpass.kumi.systems`
  - Each endpoint tried once; success/failure logged via `print(f"[overpass] ...")`
  - Duplicates deduplicated; all fail → `OverpassError` raised with last failure reason
  - `.env.example` updated with `OVERPASS_API_URL` variable

- **No cross-border routing**: when GPS is active, MapPage uses ONLY live Overpass results for routing; the seeded PostgreSQL data is never used as routing fallback to prevent routes spanning cities/countries

**Key Files:**
- `frontend/src/components/EmergencyButton.tsx` (rewritten)
- `frontend/src/components/RoutePanel.tsx` (rewritten)
- `frontend/src/pages/MapPage.tsx` (updated nav state, destination logic, route button)
- `frontend/src/types/index.ts` (added `EmergencyDestinationType`, `DESTINATION_LABELS`)
- `backend/app/services/overpass_service.py` (added retry/fallback, User-Agent fix)
- `backend/app/config/settings.py` (added `OVERPASS_API_URL`)

**Architecture Decision:** The emergency flow is now fully state-driven via React Router's `location.state`. EmergencyButton computes the destination and passes it to MapPage. MapPage no longer computes its own nearest-item for routing — it exclusively uses the value from nav state. The Safe Shelter priority is handled implicitly by the backend's combined Overpass query (all shelter-like tags OR'd together). The `DESTINATION_LABELS` constant centralizes display text, keeping it consistent between EmergencyButton and RoutePanel.

---

## Phase 3.2 — AI Decision Support (Gemini)

### 3.2.1 AI Package & Service Layer

**Objective:** Implement an AI Decision Support layer using the Gemini API, isolated in its own backend package.

**Changes:**
- Created `backend/app/ai/` package with 4 modules:
  - **`prompts.py`**: single `SYSTEM_PROMPT` constant (placeholder text). Designed to be replaced without touching any other code.
  - **`schemas.py`**: `AIRecommendationRequest` (question + optional lat/lng) and `AIRecommendationResponse` (riskLevel, summary, recommendedDestination, reason, actions) Pydantic models.
  - **`context_builder.py`**: `ContextBuilder` class that collects and normalizes: GPS location, weather (via `WeatherService`), nearby infrastructure (all 7 OSM categories via `LocationService`), active disasters, and recent alerts (via DB session). Returns a plain text context string for the prompt.
  - **`ai_service.py`**: `AIService` class wrapping the `google.genai` SDK. Assembles system prompt + context + question into a single prompt. Calls Gemini 2.0 Flash asynchronously. Parses JSON response with markdown fence stripping. Full error handling — returns a structured fallback response on failure or when `GEMINI_API_KEY` is unset.
- Registered `GEMINI_API_KEY` in `settings.py` (optional, defaults to `None`).
- Added `google-genai>=1.0.0` to `requirements.txt`.
- Updated `.env.example` with `GEMINI_API_KEY=`.

**Key Files:**
- `backend/app/ai/__init__.py`
- `backend/app/ai/prompts.py`
- `backend/app/ai/schemas.py`
- `backend/app/ai/context_builder.py`
- `backend/app/ai/ai_service.py`
- `backend/app/config/settings.py`
- `backend/requirements.txt`
- `.env.example`

**Architecture Decision:** The AI package is fully isolated — it imports only from `app.services`, `app.models`, and `app.config`. The system prompt is a module-level constant so it can be replaced in one place. The `ContextBuilder` instantiates its own service dependencies, keeping the AI layer self-contained. The `AIService` returns a fallback response when the API key is missing, avoiding crashes in development/demo mode.

---

### 3.2.2 AI Router

**Objective:** Expose the AI recommendation engine via a REST endpoint.

**Changes:**
- Created `backend/app/routers/ai.py` with `POST /api/ai/recommendation`
  - Accepts `AIRecommendationRequest` (question required, lat/lng optional)
  - Instantiates `ContextBuilder` and `AIService` at module level (single instances)
  - Calls `context_builder.build()` to generate context, then `ai_service.get_recommendation()` to get the AI response
  - Returns the response as a dict via `model_dump()`
- Wired into `main.py` via `app.include_router(ai.router)`

**Key Files:**
- `backend/app/routers/ai.py`
- `backend/app/main.py`

**Architecture Decision:** Module-level service instances (same pattern as `location.py`) preserve state across requests. The router is stateless beyond the service instances — all enrichment and AI logic lives in the `ai/` package.

---

### 3.2.3 AIAssistant Frontend Component

**Objective:** Create a user-facing AI interaction component with question input and formatted responses.

**Changes:**
- Created `frontend/src/components/AIAssistant.tsx`:
  - Question input field with keyboard submit (Enter key)
  - Send button with loading spinner
  - Error banner for API failures
  - Formatted recommendation card showing:
    - Risk level badge (color-coded: low/green, moderate/yellow, high/orange, critical/red)
    - Summary paragraph
    - Recommended destination card (blue highlight with type label)
    - Reasoning text (italic, subtle)
    - Numbered action list with styled circles
  - Gets GPS position via `useGeolocation` hook and passes lat/lng to the API
  - Gracefully handles null destination (skips destination card)
- Added `AIRecommendationRequest` and `AIRecommendationResponse` types to `frontend/src/types/index.ts`
- Added `aiApi.recommend()` method to `frontend/src/services/api.ts`
- Integrated `AIAssistant` into the Dashboard page (below the active disasters table)

**Key Files:**
- `frontend/src/components/AIAssistant.tsx`
- `frontend/src/types/index.ts`
- `frontend/src/services/api.ts`
- `frontend/src/pages/Dashboard.tsx`

**Architecture Decision:** The AIAssistant is a self-contained component with its own state management (loading, error, result). It uses the existing `useGeolocation` hook to provide location context. The Dashboard integration is a single `<AIAssistant />` JSX tag — no shared state, no coupling.

---

## Phase 3.3A — Live Weather & Official Alert Integration

**Objective:** Replace demo disaster alerts with official CAP alerts while preserving the existing API architecture.

### Data Sources
- **Weather**: Existing OpenWeather integration reused via `OpenWeatherProvider` wrapper
- **Primary Alerts**: `https://cap-sources.s3.amazonaws.com/in-imd-en/rss.xml` (IMD CAP RSS)
- **Fallback Alerts**: `https://sachet.ndma.gov.in/cap_public_website/rss/rss_india.xml` (NDMA CAP RSS)
- Both URLs configurable via environment variables (`IMD_CAP_RSS_URL`, `NDMA_FALLBACK_RSS_URL`)

### Provider Architecture

Created `backend/app/services/disaster_sources/`:

| File | Responsibility |
|------|---------------|
| `base.py` | Abstract `WeatherProvider`/`AlertProvider` interfaces + `WeatherData`/`AlertData` dataclasses |
| `cap_provider.py` | Fetches IMD CAP RSS feed; parses CAP 1.2 XML; extracts event, headline, description, severity, urgency, certainty, effective/expires, area, polygons; normalizes severity to critical/warning/advisory/info |
| `openweather_provider.py` | Wraps existing `WeatherService` into `WeatherProvider` interface |
| `normalizer.py` | Converts `AlertData` → DB dict; datetime parsing; expiry check |
| `ingestion_service.py` | Orchestrates fetch → normalize → upsert → expire; dedup by `external_id` |

**Architecture Decision:** The rest of the application does not know where data originates. Providers are swap-able implementations of abstract interfaces.

### Database Changes
- **Alert model extended**: added `external_id` (unique, nullable), `expires_at` (DateTime, nullable), `event`, `urgency`, `certainty`, `area` columns
- **`message` widened**: `String(2000)` → `Text` to handle long CAP descriptions
- **Auto-expiry**: alerts with `expires_at < now()` are deleted on each ingestion cycle
- **Deduplication**: CAP `identifier` → `external_id` unique constraint; existing alerts updated on re-ingestion

### API Changes
- `GET /api/alerts` — now runs `IngestionService.ingest()` before returning results; filters out expired alerts
- `POST /api/alerts` — unchanged (admin-only manual alert creation)
- `GET /api/weather` — unchanged (still uses `WeatherService` directly)

**Backward Compatibility:** All existing endpoints, response schemas, and frontend contracts preserved. `AlertResponse` gains optional fields (`external_id`, `expires_at`, `event`, `urgency`, `certainty`, `area`) that default to `None` for pre-existing alerts.

### AI Integration
- `ContextBuilder` automatically consumes live CAP alerts from the database — no changes needed

### Error Handling
- IMD feed → NDMA fallback → empty alerts returned first
- Network errors, XML parse errors, timeouts — all caught; never crashes

### Config & Environment
- `settings.py`: added `IMD_CAP_RSS_URL`, `NDMA_FALLBACK_RSS_URL`
- `.env.example`: updated with both variables
- No new Python dependencies (uses stdlib `xml.etree.ElementTree`)

### Files Created
- `backend/app/services/disaster_sources/__init__.py`
- `backend/app/services/disaster_sources/base.py`
- `backend/app/services/disaster_sources/cap_provider.py`
- `backend/app/services/disaster_sources/openweather_provider.py`
- `backend/app/services/disaster_sources/normalizer.py`
- `backend/app/services/disaster_sources/ingestion_service.py`

### Files Modified
- `backend/app/models/alert.py` — CAP columns added, message widened to Text
- `backend/app/schemas/alert.py` — AlertResponse gains optional CAP fields
- `backend/app/services/alert.py` — `get_all()`/`get_active()` filter out expired alerts
- `backend/app/routers/alerts.py` — injection of IngestionService on GET
- `backend/app/config/settings.py` — IMD_CAP_RSS_URL, NDMA_FALLBACK_RSS_URL
- `backend/.env.example` — CAP RSS URLs added
- `.env.example` (root) — CAP RSS URLs added
- `docs/CHANGELOG_AI.md` — this entry
- `docs/PROJECT_CONTEXT.md` — Phase 3.3A section, updated structure, env vars
- `README.md` — Phase 3.3A features, env vars, roadmap

---

## Phase 3.3B/C — Background Ingestion & Alert Pipeline Improvements

**Objective:** Replace on-request ingestion with background refresh, add multi-source merging, alert history, caching, location-aware filtering, and disaster provider abstraction.

### 3.3B.1 Model & Schema Changes

**Objective:** Add columns for alert history, geo-data, and source tracking.

**Changes:**
- Added `is_active` (Boolean, default True, NOT NULL) to `Alert` model — enables soft-delete for expired alerts
- Added `expired_at` (DateTime, nullable) — timestamp when alert was soft-expired
- Added `polygons` (Text, nullable) — semicolon-joined CAP polygon coordinate strings for future geo-filtering
- Added `source` (String(50), nullable) — tracks origin feed ("imd", "ndma")
- Created Alembic migration (`2bfd451b4aed_add_alert_history_fields.py`) with `server_default=true` for existing rows
- Updated `AlertResponse` schema with all new fields

**Key Files:**
- `backend/app/models/alert.py`
- `backend/app/schemas/alert.py`
- `backend/alembic/versions/2bfd451b4aed_add_alert_history_fields.py`

### 3.3B.2 In-Memory Cache Service

**Objective:** Avoid redundant network requests with a simple TTL cache.

**Changes:**
- Created `CacheService` in `disaster_sources/cache.py`:
  - In-memory `dict` of `CacheEntry` objects with `value` and `expires_at` (computed from `time.monotonic() + ttl`)
  - `get(key)` → returns value if not expired, auto-evicts and returns None on expiry
  - `set(key, value, ttl=300)` — default 5-minute TTL
  - `clear()` — full cache invalidation (called before each background refresh cycle)
- No external dependencies — pure Python stdlib

**Key Files:**
- `backend/app/services/disaster_sources/cache.py`

### 3.3B.3 Multi-Source Concurrent CAP Provider

**Objective:** Replace sequential IMD→NDMA fallback with parallel fetch + merge.

**Changes:**
- Rewrote `CapProvider` to treat IMD and NDMA as equal peers
- `__init__` now stores `(url, label)` tuples instead of a single URL list
- `get_alerts()`:
  1. Checks `CacheService` for cached merged alerts
  2. Fires `_safe_process_feed(url, label)` for each source via `asyncio.gather`
  3. Merges results, deduplicates by `external_id` (first occurrence wins)
  4. Caches merged list with 5-minute TTL
  5. On total failure, serves stale cached data if available
- `_process_feed()` uses per-URL RSS cache key (`rss:{url}`) and per-alert CAP XML cache key (`cap:{url}`)
- Each `AlertData` now carries a `source` field (default "cap") set to the feed label by `_parse_single_alert`

**Key Files:**
- `backend/app/services/disaster_sources/cap_provider.py`
- `backend/app/services/disaster_sources/base.py` (AlertData.source added)

### 3.3B.4 Background Refresh Service

**Objective:** Decouple ingestion from API reads — refresh on a 5-minute timer.

**Changes:**
- Created `BackgroundIngestion` in `disaster_sources/background_refresh.py`:
  - `start()`: creates `asyncio.create_task` for the refresh loop; runs an immediate first ingestion
  - `_run_loop()`: sleeps for `REFRESH_INTERVAL_SECONDS` (default 300), then clears cache and runs `_ingest()`
  - `stop()`: sets stop event, cancels the task
  - `_ingest()`: opens its own DB session, runs `_mark_demo_inactive()` → `_sync_alerts()` → `_expire_old()` → `_purge_old_history()`, then commits
  - `_sync_alerts()`: loads existing CAP alerts by `external_id`, upserts (inserts new, updates existing, reactivates soft-deleted when re-appearing in feed)
  - `_expire_old()`: soft-deletes alerts where `expires_at < now` (sets `is_active=false`, `expired_at=now`)
  - `_purge_old_history()`: physically deletes inactive alerts older than `ALERT_RETENTION_DAYS` (default 30)
  - `_mark_demo_inactive()`: one-time cleanup of seeded alerts (where `external_id IS NULL`)
- Wired into FastAPI `lifespan` in `main.py`: starts on app startup, stops on shutdown

**Key Files:**
- `backend/app/services/disaster_sources/background_refresh.py`
- `backend/app/main.py`

### 3.3B.5 Router & Service Refactoring

**Objective:** Remove live network calls from GET /api/alerts, add location-aware filtering and history endpoint.

**Changes:**
- **`routers/alerts.py`**: removed `IngestionService` import and `_ingestion.ingest()` call from `GET /api/alerts`. Added optional `lat`/`lng` query parameters. Added new `GET /api/alerts/history` endpoint returning inactive alerts with pagination (limit/offset).
- **`services/alert.py`**: `get_all()` now filters `is_active == True` AND non-expired. Added `get_history(limit, offset)` returning inactive alerts ordered by `expired_at DESC`. Added `_resolve_state(lat, lng)` using bounding-box heuristics to map coordinates to Indian state. Added `_filter_by_location(alerts, user_state)` matching alert `area` (substring) against user state and nationwide keywords.
- **`services/disaster_sources/ingestion_service.py`**: simplified — removed `_remove_demo_alerts()` and `_count_alerts()`; `_expire_old()` renamed to `_soft_expire()` and uses soft-delete instead of physical delete.
- **`services/disaster_sources/normalizer.py`**: `alert_data_to_dict()` now includes `polygons` and `source` fields from `AlertData.source`; removed unused `is_expired()` function.

**Key Files:**
- `backend/app/routers/alerts.py`
- `backend/app/services/alert.py`
- `backend/app/services/disaster_sources/ingestion_service.py`
- `backend/app/services/disaster_sources/normalizer.py`

### 3.3B.6 Demo Data Cleanup

**Objective:** Remove all seeded demo alerts and ensure production code uses only live data.

**Changes:**
- **`database/seed.py`**: removed the `alerts` list (10 demo alerts) from the seed function. Alerts now come exclusively from live CAP feeds.
- **`ai/context_builder.py`**: `select(Alert)` now filters with `.where(Alert.external_id.isnot(None))` to exclude any remaining seeded alerts.
- Old demo alerts (with `external_id IS NULL`) are marked inactive on the first `BackgroundIngestion._mark_demo_inactive()` run.
- **Env var rename**: `NDMA_FALLBACK_RSS_URL` → `NDMA_CAP_RSS_URL` to reflect equal-peer status.

**Key Files:**
- `backend/app/database/seed.py`
- `backend/app/ai/context_builder.py`
- `backend/.env` (variable rename)
- `.env.example` (variable rename)

### 3.3B.7 DisasterProvider Abstraction

**Objective:** Create a pluggable disaster data source interface while preserving development data.

**Changes:**
- Created `disaster_provider.py` with `DisasterData` dataclass, `DisasterProvider` abstract class, and `StaticDisasterProvider` implementation (returns the 5 seeded Delhi disasters)
- `DisasterService` remains unchanged — the abstraction is ready for future live sources without modifying existing code or routers

**Key Files:**
- `backend/app/services/disaster_sources/disaster_provider.py`

### 3.3B.8 Configuration & Environment

**Objective:** Add new settings for background refresh and retention.

**Changes:**
- Added `NDMA_CAP_RSS_URL`, `REFRESH_INTERVAL_SECONDS` (default 300), `ALERT_RETENTION_DAYS` (default 30), `CACHE_TTL_SECONDS` (default 300) to `settings.py`
- Updated `.env` and `.env.example` with new variables and renamed NDMA variable

**Key Files:**
- `backend/app/config/settings.py`
- `backend/.env`
- `.env.example`

### 3.3B.9 Documentation

**Objective:** Document Phase 3.3B/C architecture, features, and configuration.

**Changes:**
- Updated `README.md`: added Phase 3.3B/C feature list, new API endpoints, env var table
- Updated `docs/PROJECT_CONTEXT.md`: added Phase 3.3B/C to overview, project structure, architecture decisions, database schema, API endpoints, env vars, seed data notes, and features section
- Updated `docs/CHANGELOG_AI.md`: this entry

**Key Files:**
- `README.md`
- `docs/PROJECT_CONTEXT.md`
- `docs/CHANGELOG_AI.md`

---

## Phase 3.3C — Live OSM Infrastructure Pages

**Objective:** Replace the remaining demo-data-driven pages (Hospitals, Shelters) with live OpenStreetMap data from the location service, matching the Map page behavior exactly.

### 3.3C.1 Hospitals Page Rewrite

**Objective:** Use GPS location + `/api/location/nearby` instead of `/api/hospitals`.

**Changes:**
- Replaced `hospitalApi.getAll()` import with `useGeolocation` + `locationApi.nearby()` from the shared API layer
- Page now requires GPS position: if `position` is null, shows `LocationStatus` + "Enable Location" button (never shows demo data)
- Fetches `NearbyResponse` via `useApi`, extracts `hospitals` array, sorts by distance
- Each card shows: name, distance badge (m/km), latitude/longitude, OSM tags via `address` field
- Uses same `NearbyPlace`/`NearbyResponse` types used by MapPage, EmergencyButton, and routing components
- Visually consistent with existing card design: `Stethoscope` icon, red accent, hover shadow

**Key Files:**
- `frontend/src/pages/Hospitals.tsx` (rewritten)
- `frontend/src/types/index.ts` (already had `NearbyPlace`, `NearbyResponse`)

### 3.3C.2 Shelters Page Rewrite

**Objective:** Use GPS location + `/api/location/nearby` instead of `/api/shelters`, merging shelters, community centres, and schools into one sorted list.

**Changes:**
- Replaced `shelterApi.getAll()` import with `useGeolocation` + `locationApi.nearby()`
- Merges `shelters`, `community_centres`, and `schools` from `NearbyResponse` into a single `ShelteredPlace[]` with a `category` discriminator
- Sorts combined list by distance ascending
- Each card shows: type icon (Home/Users/Building2) with distinct background colors (orange/blue/green), type label via `DESTINATION_LABELS`, distance badge, coordinates, OSM tags
- GPS gate: same "Enable Location" button when position unavailable
- Uses shared `NearbyPlace` type — no duplicate interfaces

**Key Files:**
- `frontend/src/pages/Shelters.tsx` (rewritten)

### 3.3C.3 Legacy API Preservation

**Objective:** Keep `GET /api/hospitals` and `GET /api/shelters` endpoints as fallback/legacy APIs without breaking any consumers.

**Changes:**
- Backend endpoints untouched — still serve seeded DB records on `GET /api/hospitals` and `GET /api/shelters`
- `api.ts` service layer retains `hospitalApi.getAll()` and `shelterApi.getAll()` for potential admin use
- Dashboard still imports both for fallback counters when GPS is unavailable
- No user-facing page imports `hospitalApi` or `shelterApi` anymore

**Key Files:**
- `backend/app/routers/hospitals.py` (unchanged)
- `backend/app/routers/shelters.py` (unchanged)
- `frontend/src/services/api.ts` (unchanged)

### 3.3C.4 Documentation

**Objective:** Document Phase 3.3C migration in all project docs.

**Changes:**
- Updated `README.md`: added Phase 3.3C feature list with 5 bullet points
- Updated `docs/PROJECT_CONTEXT.md`: updated overview sentence, frontend routes table, added Phase 3.3C key features section with 6 bullet points
- Updated `docs/CHANGELOG_AI.md`: this entry

**Key Files:**
- `README.md`
- `docs/PROJECT_CONTEXT.md`
- `docs/CHANGELOG_AI.md`

---

## Phase 4.1 — LangGraph Foundation

**Objective:** Introduce the LangGraph orchestration framework into the architecture. No agent intelligence — only the graph skeleton, shared state, and placeholder nodes.

### 4.1.1 New Package Structure

**Changes:**
- Created `backend/app/langgraph/` with four files:
  - `__init__.py` — exports compiled `graph` singleton for external imports
  - `state.py` — `AgentState` TypedDict with 9 fields: `user_question`, `latitude`, `longitude`, `weather`, `alerts`, `nearby_infrastructure`, `selected_destination`, `route`, `final_recommendation`
  - `nodes.py` — 5 async placeholder functions (`weather_node`, `alert_node`, `infrastructure_node`, `route_node`, `coordinator_node`), each logs `[langgraph] <name> node executed` and returns an empty dict (no state mutation)
  - `graph.py` — builds a `StateGraph(AgentState)`, registers all 5 nodes in sequence (START → weather → alert → infrastructure → route → coordinator → END), compiles the graph, and exports a module-level `graph` instance

**Key Files:**
- `backend/app/langgraph/__init__.py`
- `backend/app/langgraph/state.py`
- `backend/app/langgraph/nodes.py`
- `backend/app/langgraph/graph.py`

### 4.1.2 Dependency

**Changes:**
- Added `langgraph>=1.2.0` to `backend/requirements.txt`
- No existing packages removed

**Key Files:**
- `backend/requirements.txt`

### 4.1.3 Testing

**Changes:**
- Created `tests/test_langgraph.py` with two tests:
  - `test_graph_builds()` — asserts the compiled graph contains the 5 expected nodes (excluding internal `__start__`)
  - `test_graph_executes()` — invokes the graph with a full initial state, verifies all nodes run in sequence, and asserts final state keys match `AgentState`

**Key Files:**
- `backend/tests/test_langgraph.py`

### 4.1.4 Documentation

**Changes:**
- Updated `README.md`: added `langgraph/` to project structure, Phase 4.1 feature list, updated roadmap to Phase 4.2+
- Updated `docs/PROJECT_CONTEXT.md`: added Phase 4.1 to overview, project structure, architecture decisions (new decision #10), and features section
- Updated `docs/CHANGELOG_AI.md`: this entry

**Key Files:**
- `README.md`
- `docs/PROJECT_CONTEXT.md`
- `docs/CHANGELOG_AI.md`

### 4.1.6 Strongly Typed State Models

**Objective:** Replace generic dict-based workflow state with strongly typed Pydantic models for type safety, IDE autocompletion, and runtime validation.

**Changes:**
- Created `models.py` with 9 Pydantic models: `LocationState`, `WeatherState`, `AlertItem`, `AlertState`, `InfrastructureItem`, `InfrastructureState`, `DestinationState`, `RouteState`, `RecommendationState`
- Each model has explicit typed fields with sensible defaults (all sub-states are `Optional` to keep placeholder nodes working)
- `AgentState` in `state.py` converted from `TypedDict` to `Pydantic BaseModel` — fields now reference the typed models instead of `dict[str, Any]`
- `__init__.py` expanded to export all models for convenient importing
- Graph topology, node order, node logic — all unchanged
- Nodes still receive state as strongly typed `AgentState` instances from LangGraph
- Tests updated: added `test_agent_state_typed()` verifying field types, `test_models_accept_data()` demonstrating construction and access, and `test_graph_executes_with_typed_state()` confirming graph execution with typed state

**Key Files:**
- `backend/app/langgraph/models.py` (new)
- `backend/app/langgraph/state.py` (updated)
- `backend/app/langgraph/__init__.py` (updated)
- `backend/tests/test_langgraph.py` (updated)

### 4.1.5 What Was NOT Changed
- No existing routers, services, models, schemas, or utilities were modified
- No existing AI package (`app/ai/`) was touched
- No frontend code was changed
- No business logic, API calls, or Gemini integration was added
- The `langgraph/` package is a self-contained orchestration foundation — ready for Phase 4.2 agent intelligence

---

## Phase 4.2 — Real Service-Backed LangGraph Agents

**Objective:** Replace placeholder LangGraph nodes with real service-backed agents. Each node now calls the corresponding service layer, handles errors gracefully, and returns properly typed state.

### 4.2.1 Service-Backed Agents

**Changes to `nodes.py`:**
- **Weather Node** (`weather_node`): Instantiates `WeatherService` at module level. Calls `get_current_weather(lat, lng)` when GPS coordinates are available. Returns `WeatherState` with temperature, feels_like, humidity, wind_speed, rain, description, city, and inferred risk_level (`_infer_weather_risk`). On error, returns empty `WeatherState()`.
- **Alert Node** (`alert_node`): Opens a DB session via `async_session_factory`, calls `AlertService.get_all(lat, lng)`. Maps results to `AlertItem[]` with id, event, severity, headline, description, area, source. Computes `highest_severity` by ranking. On error (no DB, service failure), returns empty `AlertState()`.
- **Infrastructure Node** (`infrastructure_node`): Instantiates `LocationService` at module level. Fires all 7 category queries in parallel via `asyncio.gather`: hospitals, shelters, community_centres, schools, police, firestations, pharmacies. Maps each to `InfrastructureItem[]`. On error, returns empty `InfrastructureState()`.
- **Route Node** (`route_node`): Picks the nearest infrastructure item (across all categories) using `_haversine` from `location_service.py`. Computes distance, estimated walking duration (5 km/h), builds `DestinationState` with destination_type and item, and `RouteState` with distance_km, duration_min, provider ("straight-line"), directions, and coordinates polyline. On error, returns empty `DestinationState()` + `RouteState()`.
- **Coordinator Node** (`coordinator_node`): Aggregates all upstream state. Produces `RecommendationState` with summary, actions (based on severity/risk), and risk_level. No Gemini call — pure placeholder summarization.

**New helpers:**
- `_infer_weather_risk(data)` — maps temperature ranges and description keywords to risk levels (extreme/high/moderate/low)
- `_pick_nearest_destination(lat, lng, infra)` — scans all 7 categories for the closest item
- `_build_directions(type, distance)` — returns step-by-step text directions
- `_count_infrastructure(infra)` — total count across all categories
- `_suggest_actions(state)` — generates 1-3 action items based on alert severity, weather risk, and nearest facility

### 4.2.2 InfrastructureState Expansion

**Changes to `models.py`:**
- Added `community_centres: list[InfrastructureItem] = []` field
- Added `schools: list[InfrastructureItem] = []` field
- Both use `Field(default_factory=list)` for mutable default safety

### 4.2.3 Updated Tests

**Changes to `tests/test_langgraph.py`:**
- `test_graph_executes_without_crashing()`: now asserts every state field is a proper typed model instance (e.g., `isinstance(result["weather"], WeatherState)`) instead of checking keys exist
- `test_graph_with_gps_coordinates()`: passes real GPS coordinates (Delhi: 28.6139, 77.2090), verifies services execute and return typed state even when external APIs fail
- `test_coordinator_populates_summary()`: verifies `recommendation.summary` contains "All agents completed" and `recommendation.actions` is a non-empty list

### 4.2.4 What Was NOT Changed
- Graph topology (START → weather → alert → infrastructure → route → coordinator → END) — unchanged
- `AgentState` model in `state.py` — unchanged
- `graph.py` build/compile logic — unchanged
- Any REST APIs, frontend code, or external services — unchanged
- No Gemini integration in the Coordinator (still a placeholder)
- No new Python dependencies required

---
- Service layer already decoupled from HTTP — AI agents can call services directly
- Typed Pydantic schemas provide structured I/O for agent tool definitions
- `GeolocationState` and `NearestItem` types are agent-consumable
- `RouteInfo` provider field enables agent awareness of data quality
- Mock data fallbacks enable AI development without external API dependencies
- Provider architecture (`disaster_sources/`) enables data source swap without endpoint changes

---

## Phase 4.3.1 — AI Decision Support UI Upgrade

**Objective:** Upgrade the existing AI Decision Support component on the Dashboard with a polished card-based layout. Frontend-only — no backend changes.

### 4.3.1.1 Card-Based Recommendation Layout

**Changes to `frontend/src/components/AIAssistant.tsx`:**
- **Risk Badge**: color-coded badge (green/yellow/orange/red/gray) with Shield icon mapping `riskLevel` from backend
- **Summary Card**: gray background card with leading-relaxed text
- **Destination Card**: blue card with lucide icon (Hospital/Home/Shield/Building2/Flame/Pill depending on destination type), type label, and facility name
- **Reason Card**: white card with "Reason" header and explanation text
- **Actions Checklist**: green `Check` icon in a green circle for each recommended action
- **Explainability Section**: collapsible `<button>` panel (ChevronDown/ChevronUp toggles) showing all 5 agents (Weather, Alert, Infrastructure, Route, Gemini Coordinator) with green checkmarks — informational only, no API calls
- **Live Data Sources Footer**: static "Powered by" row showing OpenWeather, IMD/NDMA CAP Alerts, OpenStreetMap, Gemini
- **Empty State**: before first submission, shows Bot icon + "Ask anything about your safety" + 5 clickable example questions
- **Loading State**: `Loader2` spinner in button (disabled) + `LoadingSpinner` below + "Analyzing your situation..."
- **Error State**: friendly error message + "Try Again" retry button; no stack traces
- **Location Display**: `📍 Current Location: lat, lng` when GPS available, "Location unavailable" otherwise

### 4.3.1.2 What Was NOT Changed
- Backend — no files touched
- LangGraph — no files touched
- Existing REST APIs — unchanged
- Graph topology — unchanged
- Agent logic — unchanged
- `AIAssistant.tsx` is the only modified file

---

## Phase 4.4 — Parallel LangGraph Execution

**Objective:** Refactor the LangGraph graph topology so that independent agents (Weather, Alert, Infrastructure) execute concurrently using LangGraph's native fan-out/fan-in, reducing total execution time while preserving identical functionality.

### 4.4.1 Graph Topology Change

**Changes to `backend/app/langgraph/graph.py`:**
- Replaced linear chain with parallel topology:
  - `START → weather`, `START → alert`, `START → infrastructure` — fan-out (parallel launch)
  - `weather → route`, `alert → route`, `infrastructure → route` — fan-in (synchronization barrier)
  - `route → coordinator → END` — sequential tail (unchanged)
- Uses LangGraph's native state merging — each node writes to different keys (`weather`, `alerts`, `infrastructure`), so parallel state updates merge automatically without conflicts

### 4.4.2 Orchestration Logging

**Changes to `backend/app/langgraph/nodes.py`:**
- Added `print("[LangGraph] Weather started")`, `print("[LangGraph] Alert started")`, etc. at the entry of each node
- Log output clearly demonstrates the first three agents starting concurrently:
  ```
  [LangGraph] Alert started
  [LangGraph] Infrastructure started
  [LangGraph] Weather started
  ...
  [LangGraph] Route started
  [LangGraph] Coordinator started
  ```

### 4.4.3 What Was NOT Changed
- Weather, Alert, Infrastructure, Route, Coordinator business logic — unchanged
- `AgentState` — unchanged
- `models.py` — unchanged
- `context_builder.py` — unchanged
- Any REST APIs, frontend code, or external services — unchanged
- Test assertions remain identical (all 4 tests pass)
- Recommendation behavior — functionally identical to Phase 4.3

### 4.4.4 Fault Tolerance
- If Weather fails (returns empty `WeatherState()`), Alert and Infrastructure still complete
- If Infrastructure fails, Route still executes (with empty infrastructure data)
- No parallel branch failure can crash the graph
- Coordinator runs with whatever state is available

---

## Phase 4.5 — Routing Service Architecture

**Objective:** Refactor the routing layer so the Route Agent no longer performs routing directly. Introduce a reusable `RoutingService` abstraction with OSRM as primary provider and Haversine straight-line as automatic fallback.

### 4.5.1 RoutingService

**Created `backend/app/services/routing_service.py`:**
- `RoutingService.get_route(origin_lat, origin_lng, dest_lat, dest_lng, destination_type) → RouteState` — single public method, returns typed `RouteState`
- **OSRM Provider** (`_osrm_route`): calls `https://router.project-osrm.org/route/v1/foot/{lng},{lat};{lng},{lat}?overview=full&geometries=geojson&steps=true` via `httpx.AsyncClient` with 10s timeout. Extracts:
  - `distance_km` from route distance (meters → km)
  - `duration_min` from route duration (seconds → minutes)
  - `coordinates` from GeoJSON geometry (converted `[lng,lat]` → `[lat,lng]`)
  - `directions` from `legs[0].steps[].maneuver.instruction`
  - Sets `provider="osrm"`
- **Straight-Line Provider** (`_straight_line_route`): uses existing `_haversine` from `location_service.py`. Computes distance, walking ETA (5 km/h), generates 3-step directions. Sets `provider="straight-line"`.
- **Automatic Fallback**: `get_route()` wraps OSRM in try/except. On any exception (timeout, HTTP error, rate limiting), logs `[Routing] OSRM unavailable` / `[Routing] Falling back to straight-line` and returns the straight-line result. The Route Agent never sees the failure.

### 4.5.2 Route Agent Refactored

**Changes to `backend/app/langgraph/nodes.py`:**
- Removed `import ... _haversine` from `location_service`; replaced with `from app.services.routing_service import RoutingService`
- Added `_routing_service = RoutingService()` module-level instance
- `route_node` now calls `await _routing_service.get_route(lat, lng, dest_item.latitude, dest_item.longitude, destination_type=...)` and uses the returned `RouteState` directly
- Removed `import math` (no longer needed)
- Removed `_build_directions()` helper — its logic moved into `RoutingService._straight_line_route()`

### 4.5.3 What Was NOT Changed
- `RouteState` model — preserved unchanged
- `AgentState` — unchanged
- LangGraph graph topology — unchanged
- Other agents (Weather, Alert, Infrastructure, Coordinator) — unchanged
- `_pick_nearest_destination()` helper — unchanged (destination selection stays in the Route Agent)
- All REST APIs — unchanged
- Frontend — unchanged
- Database — unchanged

### 4.5.4 Extensibility

Future providers (GraphHopper, OpenRouteService, Google Directions, Mapbox) can be added by creating a `_provider_route()` method and inserting it into the priority chain. The Route Agent never needs changes when providers are added or removed.
