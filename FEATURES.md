# Features

## Authentication

| Feature | Status | Notes |
|---------|--------|-------|
| User registration | ✅ Implemented | |
| User login | ✅ Implemented | |
| JWT token authentication | ✅ Implemented | |
| Password hashing (bcrypt) | ✅ Implemented | |
| Token-based session management | ✅ Implemented | localStorage token + auto-login via getMe |
| Auto-redirect to login on 401 | ✅ Implemented | Axios response interceptor |

## Maps

| Feature | Status | Notes |
|---------|--------|-------|
| Interactive Leaflet map | ✅ Implemented | |
| Standard tile layer | ✅ Implemented | OpenStreetMap |
| Satellite tile layer | ✅ Implemented | Esri World Imagery |
| Terrain tile layer | ✅ Implemented | OpenTopoMap |
| Custom POI markers | ✅ Implemented | divIcon per category with emoji |
| Disaster zone circles | ✅ Implemented | Severity-colored radius circles |
| CAP alert polygon storage | ✅ Implemented | Stored in `alerts.polygons` text field |
| CAP polygon map visualization | ✅ Implemented | Polygons rendered on interactive map with severity coloring |
| Layer filter chips | ✅ Implemented | 8 filter toggles (All, Shelters, Hospitals, Police, Fire, Pharmacy, Disasters, Gov Alerts) |
| Map legend overlay | ❌ Not implemented | Only filter chips exist |
| Auto-locate on startup | ✅ Implemented | |

## Emergency Response

| Feature | Status | Notes |
|---------|--------|-------|
| Emergency SOS button | ✅ Implemented | Floating button navigating to map with nearest-destination route |
| Nearby hospitals page | ✅ Implemented | Live OSM data sorted by distance |
| Nearby shelters page | ✅ Implemented | Live OSM data sorted by distance |
| Nearby police stations | ✅ Implemented | |
| Nearby fire stations | ✅ Implemented | |
| Nearby pharmacies | ✅ Implemented | |
| Distance calculation (Haversine) | ✅ Implemented | |
| GPS geolocation | ✅ Implemented | watchPosition with continuous tracking |
| Location status indicator | ✅ Implemented | |

## Routing

| Feature | Status | Notes |
|---------|--------|-------|
| Walking route calculation | ✅ Implemented | Frontend: ORS or OSRM. Backend: OSRM or straight-line |
| OpenRouteService provider | ✅ Implemented | Frontend only, requires VITE_ORS_API_KEY |
| OSRM public API fallback | ✅ Implemented | Used by both frontend and backend |
| Straight-line fallback | 🚧 Partial | Only backend RoutingService has it; frontend routing.ts has no fallback if both ORS and OSRM fail |
| Turn-by-turn directions | ✅ Implemented | |
| Route polyline on map | ✅ Implemented | |
| Route panel with steps | ✅ Implemented | |
| Safe destination scoring | ✅ Implemented | Weighted algorithm in location.py |

## Government Alerts

| Feature | Status | Notes |
|---------|--------|-------|
| IMD CAP RSS ingestion | ✅ Implemented | |
| NDMA CAP RSS ingestion | ✅ Implemented | Frequently rate-limited (302 redirects) |
| CAP XML 1.2 parsing | ✅ Implemented | |
| Background polling (5 min) | ✅ Implemented | |
| Multi-source deduplication | ✅ Implemented | via `external_id` |
| Soft-delete for expired alerts | ✅ Implemented | |
| 30-day retention cleanup | ✅ Implemented | |
| In-memory caching | ✅ Implemented | 300-second TTL |
| Location-aware filtering via polygons | ✅ Implemented | Backend `_filter_by_location` uses point-in-polygon geofencing + centroid radius |
| Alert centroids on map | ✅ Implemented | Centroid markers with severity icons and popups |
| Alert polygon rendering | ✅ Implemented | Rendered on map with severity-colored fills |

## Settings

| Feature | Status | Notes |
|---------|--------|-------|
| Theme switching (dark/light/system) | ✅ Implemented | |
| Accent color switching (sapphire/amber/emerald) | ✅ Implemented | |
| Notification toggles | ✅ Implemented | Master toggle + email + push + sound |
| Push notification permission request | ✅ Implemented | Called on app mount if settings enable it |
| Browser notification delivery | 🚧 Partial | `showBrowserNotification()` defined but never wired to any event |
| Alert sound | 🚧 Partial | `playAlertSound()` defined but never wired to any event |
| Emergency radius configuration | ✅ Implemented | Slider: 5-100 km |
| Minimum alert severity filter | ✅ Implemented | |
| Default map type selection | ✅ Implemented | Standard, Satellite, Terrain |
| Auto-locate toggle | ✅ Implemented | |
| Government data layer toggle | ✅ Implemented | |
| User disaster layer toggle | ✅ Implemented | |
| Larger text accessibility | ✅ Implemented | |
| Reduced motion accessibility | ✅ Implemented | |
| Settings persistence (localStorage + backend) | ✅ Implemented | |

## Weather

| Feature | Status | Notes |
|---------|--------|-------|
| Live weather by GPS coordinates | ✅ Implemented | |
| OpenWeatherMap API integration | ✅ Implemented | Requires OPENWEATHER_API_KEY |
| Mock data fallback | ❌ Not implemented | WeatherService raises ValueError if no API key |
| 5-minute auto-refresh | ✅ Implemented | |
| Weather display on dashboard | ✅ Implemented | |

## Infrastructure

| Feature | Status | Notes |
|---------|--------|-------|
| Live OSM data via Overpass API | ✅ Implemented | |
| 7 infrastructure categories | ✅ Implemented | hospitals, shelters, community_centres, schools, police, firestations, pharmacies |
| 3-server retry chain | ✅ Implemented | |
| TTL cache (10 min) | ✅ Implemented | |
| Stale cache fallback | 🚧 Partial | Cache is discarded on expiry; no stale-while-revalidate pattern |
| Parallel category fetching | ✅ Implemented | asyncio.gather |

## AI Decision Support

| Feature | Status | Notes |
|---------|--------|-------|
| Gemini-powered recommendations | ✅ Implemented | |
| LangGraph multi-agent pipeline | ✅ Implemented | Weather, Alert, Infrastructure, Route, Coordinator |
| Weather Agent | ✅ Implemented | |
| Alert Agent | ✅ Implemented | |
| Infrastructure Agent | ✅ Implemented | |
| Route Agent | ✅ Implemented | |
| Coordinator Agent | ✅ Implemented | |
| Deterministic fallback | ✅ Implemented | Used if Gemini unavailable or returns degraded response |
| Risk level assessment | ✅ Implemented | Determined by agents + coordinator |
| Destination recommendation | ✅ Implemented | |
| Action checklist | ✅ Implemented | |
| Explainability section | ✅ Implemented | Agent pipeline breakdown in UI |
| Incident memory (incident_id) | ✅ Implemented | LangGraph MemorySaver checkpointing |
| Context-aware follow-up questions | ✅ Implemented | Previous recommendation injected into LLM context |

## Admin

| Feature | Status | Notes |
|---------|--------|-------|
| Admin dashboard | ✅ Implemented | Route guarded by `requireAdmin` |
| Shelter overview table | ✅ Implemented | |
| Hospital overview | ✅ Implemented | |
| Active disaster zones table | ✅ Implemented | |
| System status card | ✅ Implemented | |
| CRUD operations for shelters | ✅ Implemented | GET, POST, PUT, DELETE |
| CRUD operations for hospitals | 🚧 Partial | Only GET and POST exist; no PUT or DELETE |
| CRUD operations for disasters | 🚧 Partial | Only GET, GET /active, POST exist; no PUT or DELETE |
| CRUD operations for alerts | 🚧 Partial | Only GET, POST, GET /history exist; no PUT or DELETE |

## Future Features

| Feature | Status | Notes |
|---------|--------|-------|
| Push notifications | 📋 Planned | |
| Offline support / PWA | 📋 Planned | |
| Analytics dashboard | 📋 Planned | |
| Role-based access control | 📋 Planned | |
| Multi-language support | 📋 Planned | |
| Resource allocation agent | 📋 Planned | |
| Weather forecasting agent | 📋 Planned | |
| Population density agent | 📋 Planned | |
| LangSmith observability | 📋 Planned | |
| Human-in-the-loop approval | 📋 Planned | |
