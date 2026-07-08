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

## Future Phases

### Phase 3 — Agentic AI (Planned)
- LangGraph/CrewAI integration for multi-agent coordination
- LLM-powered decision support for resource allocation
- Natural language interface for emergency reporting
- Predictive analytics for disaster forecasting
- Automated shelter assignment during evacuations
- Real-time resource tracking and optimization

### Architecture Considerations for Phase 3
- Service layer already decoupled from HTTP — AI agents can call services directly
- Typed Pydantic schemas provide structured I/O for agent tool definitions
- `GeolocationState` and `NearestItem` types are agent-consumable
- `RouteInfo` provider field enables agent awareness of data quality
- Mock data fallbacks enable AI development without external API dependencies
