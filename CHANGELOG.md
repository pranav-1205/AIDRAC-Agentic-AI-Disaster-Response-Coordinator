# Changelog

## 2026-07 — Light Theme Improvements

- Improved light theme contrast across all pages
- Added CSS variable theming for cards, sidebar, glass panels, inputs, and buttons
- Updated Hospitals, Shelters, and Alerts pages to use semantic CSS variables
- Card shadows and hover effects added for better visual hierarchy

## 2026-07 — Settings Refactoring

- Created `SettingsContext` as single source of truth for all user settings
- Removed settings from `AuthContext`
- Rewrote `SettingsModal` to use `SettingsContext` directly
- Added `NotificationManager` for browser push notification permission requests
- Added notification utility functions (permission request, browser notification, alert sound) — note: `showBrowserNotification` and `playAlertSound` are defined but not yet wired to events
- All pages now read settings from shared context
- CSS variables drive theme, accent, larger text, and reduced motion
- Fixed `Badge` info variant to use accent color

## 2026-07 — Emergency Radius Fix

- Increased backend `/location/nearby` and `/location/safe-destination` radius limit from 50 km to 100 km to match frontend slider
- Dashboard nearby call now uses `settings.emergency_radius` instead of defaulting to 10 km

## 2026-06 — Incident Memory

- Added `IncidentService` for LangGraph checkpoint management
- Optional `incident_id` preserves AgentState across requests via MemorySaver
- Previous recommendation injected into LLM context for follow-up questions

## 2026-06 — Backend OSRM Routing

- Created `RoutingService` abstraction with OSRM provider
- Transparent fallback from OSRM to Haversine straight-line distance
- Turn-by-turn directions and polyline support (used by LangGraph Route Agent)

## 2026-06 — Parallel LangGraph Execution

- Weather, Alert, and Infrastructure agents execute concurrently via LangGraph fan-out
- Fan-in to Route agent waits for all upstream agents
- Fault tolerance: partial state on branch failure

## 2026-06 — AI Decision Support UI

- Card-based recommendation layout in Dashboard AIAssistant
- Color-coded risk badge
- Destination card with icon and type label
- Action checklist with green checkmarks
- Expandable explainability section
- Loading, error, and empty states

## 2026-06 — Gemini Coordinator

- Replaced placeholder Coordinator with real Gemini AI reasoning
- `StateContextBuilder` converts AgentState to compact LLM prompt
- Deterministic fallback when Gemini is unavailable
- Source tracking: "gemini" or "fallback"

## 2026-06 — Service-Backed LangGraph Agents

- Replaced placeholder nodes with real service-backed agents
- Weather Agent calls `WeatherService`
- Alert Agent queries database via `AlertService`
- Infrastructure Agent queries Overpass for 7 categories
- Route Agent computes nearest facility with walking ETA

## 2026-06 — LangGraph Foundation

- Introduced `langgraph/` package with StateGraph-based workflow
- Strongly typed AgentState with 8 sub-models
- 5 nodes: weather, alert, infrastructure, route, coordinator

## 2026-06 — Live OSM Pages

- Migrated Hospitals page to live OSM data via `/location/nearby`
- Migrated Shelters page to live OSM data
- GPS location prompt with "Enable Location" button

## 2026-06 — CAP Alert Ingestion & Background Sync

- Live CAP alert ingestion from IMD RSS feed
- Multi-source merge with NDMA RSS feed
- Background polling every 5 minutes
- Deduplication via `external_id` unique constraint
- Soft-delete for expired alerts with 30-day retention
- In-memory caching with stale fallback
- Location-aware filtering via polygon geofencing (point-in-polygon) with centroid radius fallback

## 2026-05 — AI Decision Support

- Gemini-powered emergency recommendations
- Backend AI package with prompts and context builder
- Dashboard AI Assistant with question input

## 2026-05 — Live Overpass Infrastructure

- Real-time OSM data for 7 infrastructure categories
- Configurable Overpass endpoint with 3-server retry chain
- Safe destination scoring algorithm
- In-memory TTL cache (10-minute)

## 2026-05 — Routing & GPS Features

- Browser GPS geolocation with continuous tracking
- Haversine distance calculations
- OpenRouteService routing with OSRM fallback (frontend)
- Weather by GPS coordinates with auto-refresh
- Location status indicator
- Lazy-loaded map
- Memoized nearest-location calculations

## 2026-04 — Core Platform

- Project scaffolding with monorepo structure
- FastAPI backend with SQLAlchemy ORM
- React + Vite + Tailwind frontend
- PostgreSQL database schema
- JWT authentication (register, login)
- CRUD APIs for shelters, hospitals, disasters, alerts, routes (note: only shelters have full CRUD; others are partial)
- Leaflet interactive map
- Responsive layout with sidebar navigation
- Admin dashboard with system overview
