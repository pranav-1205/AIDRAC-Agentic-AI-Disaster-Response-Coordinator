# Roadmap

## ✅ Completed

- **JWT Authentication** — registration, login, token-based sessions
- **Interactive Map** — Leaflet with standard/satellite/terrain layers, POI markers, disaster circles
- **Nearby Infrastructure** — live OSM data for hospitals, shelters, police, fire, pharmacies, community centres, schools
- **Frontend Routing** — walking routes via OpenRouteService and OSRM with turn-by-turn directions
- **Backend Routing** — OSRM routing with straight-line Haversine fallback
- **Safe Destination Scoring** — weighted algorithm for best nearby facility
- **Live Weather** — OpenWeatherMap with GPS-based auto-refresh
- **Settings Persistence** — theme, accent, notifications, radius, map type, accessibility
- **Theme System** — dark mode, light mode, system-aware, CSS variable-based theming
- **Accent Color System** — sapphire, amber, emerald palettes
- **CAP Alert Ingestion** — IMD and NDMA RSS feeds with background polling, deduplication, caching
- **Dashboard** — status strip, nearest resources, weather, AI assistant, emergency contacts, active disasters
- **Admin Dashboard** — shelter/hospital/disaster overview tables, system status
- **AI Decision Support** — Gemini-powered multi-agent system via LangGraph
- **Parallel Agent Execution** — Weather, Alert, Infrastructure agents running concurrently
- **Incident Memory** — optional incident_id for state preservation across requests
- **CAP Alert Polygons** — ingested, stored, rendered on map with severity coloring, centroid icons, and popups
- **Location-Aware Alert Filtering** — polygon-based geofencing (point-in-polygon) with centroid radius fallback

## 🔄 In Progress

- **Browser Notification Delivery** — `showBrowserNotification()` exists but is not wired to any event
- **Alert Sound Wiring** — `playAlertSound()` exists but is not wired to any event
- **Hospital Admin CRUD** — only GET and POST exist; no PUT or DELETE endpoints
- **Disaster Admin CRUD** — only GET, GET /active, POST exist; no PUT or DELETE endpoints
- **Alert Admin CRUD** — only GET, POST, GET /history exist; no PUT or DELETE endpoints
- **Frontend Routing Error Handling** — no fallback if both ORS and OSRM fail

## 📋 Planned

- **Push Notifications** — browser push alerts for critical emergencies
- **Offline Support / PWA** — service worker caching and offline-accessible emergency resources
- **Analytics Dashboard** — historical disaster trends, response metrics, alert statistics
- **Role-Based Access Control** — granular permissions for admin, responder, and citizen roles
- **Multi-Language Support** — i18n for regional language accessibility
- **Resource Allocation Agent** — AI agent for resource distribution optimization
- **Weather Forecasting Agent** — multi-day forecast integration
- **Population Density Agent** — demographic data for evacuation planning
- **Human-in-the-Loop** — coordinator approval breakpoints for critical recommendations
- **LangSmith Observability** — agent tracing, monitoring, and debugging
