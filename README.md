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
│   │   ├── config/          # Application settings
│   │   ├── database/        # DB connection & seed data
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── routers/         # API route handlers
│   │   ├── services/        # Business logic layer
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
- **Enhanced Emergency Button** — finds nearest shelter + hospital, computes safest route, zooms map
- **Location status indicator** showing GPS state (acquiring, denied, unsupported, active)
- **Route Panel** with turn-by-turn directions, distance, and estimated walking time
- **Lazy-loaded map** for faster initial page load
- **Memoized nearest-location calculations** to avoid unnecessary re-renders
- **Graceful error handling** —cached data on API failure, straight-line fallback on routing failure, GPS permission denied messaging

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
| GET | `/api/alerts` | List all alerts |
| POST | `/api/alerts` | Create alert (admin) |
| GET | `/api/routes` | List evacuation routes |
| POST | `/api/routes` | Create route |

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
| `VITE_ORS_API_KEY` | No | OpenRouteService API key (OSRM fallback if empty) |

### Demo Credentials
- **Admin:** admin@aidrac.com / admin123
- **User:** user@aidrac.com / user123

## Phase 3 Roadmap
- Agentic AI integration (LangGraph/CrewAI)
- Autonomous disaster response coordination
- LLM-powered decision support
- Predictive analytics for disaster forecasting
- Multi-agent coordination for resource allocation
