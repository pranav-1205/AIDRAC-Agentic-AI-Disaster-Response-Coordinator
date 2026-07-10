# API Reference

Base URL: `/api`

Authentication: Bearer token via `Authorization: Bearer <token>` header for protected endpoints.

---

## Health

### GET /api/health

Returns server status and version.

**Authentication:** None

**Response:**
```json
{
  "status": "ok",
  "version": "1.0.0"
}
```

---

## Authentication

### POST /api/auth/register

Register a new user account.

**Authentication:** None

**Request Body:**
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "securepass"
}
```

**Response (201):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "full_name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### POST /api/auth/login

Log in with email and password.

**Authentication:** None

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepass"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "full_name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

---

## Users

### GET /api/users/me

Get the current authenticated user's profile.

**Authentication:** Required (user)

**Response:**
```json
{
  "id": 1,
  "full_name": "John Doe",
  "email": "john@example.com",
  "role": "user"
}
```

### GET /api/users/settings

Get the current user's settings. Auto-creates default settings if they don't exist.

**Authentication:** Required (user)

**Response:**
```json
{
  "id": 1,
  "user_id": 1,
  "theme": "dark",
  "accent_color": "sapphire",
  "notifications_enabled": true,
  "email_notifications": true,
  "push_notifications": true,
  "sound_alerts": true,
  "emergency_radius": 25,
  "min_alert_severity": "info",
  "default_map_type": "standard",
  "auto_locate": true,
  "show_gov_alerts": true,
  "show_user_disasters": true,
  "larger_text": false,
  "reduced_motion": false
}
```

### PUT /api/users/settings

Update the current user's settings. Partial update supported.

**Authentication:** Required (user)

**Request Body** (all fields optional):
```json
{
  "theme": "light",
  "accent_color": "emerald",
  "notifications_enabled": false
}
```

**Response:** Returns the complete updated settings object.

---

## Shelters

### GET /api/shelters

List all shelters from the database.

**Authentication:** None

**Response:**
```json
[
  {
    "id": 1,
    "name": "Community Shelter A",
    "latitude": 28.6139,
    "longitude": 77.2090,
    "capacity": 500,
    "occupancy": 120,
    "phone": "+91-1234567890",
    "address": "New Delhi"
  }
]
```

### POST /api/shelters

Create a new shelter.

**Authentication:** Required (admin)

**Request Body:**
```json
{
  "name": "New Shelter",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "capacity": 300,
  "occupancy": 0,
  "phone": "+91-9876543210",
  "address": "New Delhi"
}
```

### PUT /api/shelters/{shelter_id}

Update an existing shelter.

**Authentication:** Required (admin)

### DELETE /api/shelters/{shelter_id}

Delete a shelter.

**Authentication:** Required (admin)

**Response:** 204 No Content

---

## Hospitals

### GET /api/hospitals

List all hospitals from the database.

**Authentication:** None

**Response:**
```json
[
  {
    "id": 1,
    "name": "General Hospital",
    "latitude": 28.6139,
    "longitude": 77.2090,
    "emergency_available": true,
    "phone": "+91-1234567890",
    "address": "New Delhi"
  }
]
```

### POST /api/hospitals

Create a new hospital.

**Authentication:** Required (admin)

**Request Body:**
```json
{
  "name": "New Hospital",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "emergency_available": true,
  "phone": "+91-9876543210",
  "address": "New Delhi"
}
```

**Note:** No PUT or DELETE endpoints exist for hospitals.

---

## Disasters

### GET /api/disasters

List all disasters.

**Authentication:** None

**Response:**
```json
[
  {
    "id": 1,
    "type": "flood",
    "severity": "critical",
    "latitude": 28.6139,
    "longitude": 77.2090,
    "description": "Severe flooding in low-lying areas",
    "status": "active",
    "created_at": "2026-01-01T00:00:00"
  }
]
```

### GET /api/disasters/active

List only active disasters.

**Authentication:** None

### POST /api/disasters

Create a new disaster record.

**Authentication:** Required (admin)

**Request Body:**
```json
{
  "type": "flood",
  "severity": "critical",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "description": "Severe flooding in low-lying areas"
}
```

---

## Alerts

### GET /api/alerts

Get active alerts. Optionally filtered by location.

**Authentication:** None

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lat` | float | No | Latitude for location filtering |
| `lng` | float | No | Longitude for location filtering |
| `all` | bool | No | Set to `true` to include all alerts including expired |

**Response:**
```json
[
  {
    "id": 1,
    "title": "Severe Thunderstorm Warning",
    "message": "A severe thunderstorm is expected...",
    "disaster_id": null,
    "severity": "warning",
    "created_at": "2026-01-01T00:00:00",
    "external_id": "imd-12345",
    "expires_at": "2026-01-02T00:00:00",
    "event": "Thunderstorm",
    "urgency": "expected",
    "certainty": "likely",
    "area": "New Delhi",
    "is_active": true,
    "expired_at": null,
    "polygons": "28.6139 77.2090 28.7139 77.2090 28.7139 77.3090 28.6139 77.3090",
    "source": "imd"
  }
]
```

### POST /api/alerts

Create a new alert.

**Authentication:** Required (admin)

**Request Body:**
```json
{
  "title": "Severe Thunderstorm Warning",
  "message": "A severe thunderstorm is expected...",
  "severity": "critical",
  "disaster_id": null
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Alert title (1-255 characters) |
| `message` | string | Yes | Alert message body |
| `severity` | string | No | Severity level (default: "info") |
| `disaster_id` | int | No | Optional FK to a disaster record |

### GET /api/alerts/history

Get paginated alert history (expired/deactivated alerts).

**Authentication:** None

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | int | No | 50 | Number of alerts per page (max 200) |
| `offset` | int | No | 0 | Pagination offset |

---

## Weather

### GET /api/weather

Get current weather for a location.

**Authentication:** None

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `lat` | float | No | 28.6139 | Latitude |
| `lng` | float | No | 77.2090 | Longitude |

**Response:**
```json
{
  "temperature": 32.5,
  "feels_like": 34.0,
  "humidity": 55,
  "wind_speed": 4.5,
  "description": "scattered clouds",
  "icon": "03d",
  "rain": 0.0,
  "city": "New Delhi"
}
```

---

## Routes

### GET /api/routes

List all routes, ordered by ID.

**Authentication:** None

**Response:**
```json
[
  {
    "id": 1,
    "source_lat": 28.6139,
    "source_lng": 77.2090,
    "destination_lat": 28.7041,
    "destination_lng": 77.1025,
    "estimated_time": 45.0,
    "distance_km": 3.2
  }
]
```

### POST /api/routes

Create a new route.

**Authentication:** None

**Request Body:**
```json
{
  "source_lat": 28.6139,
  "source_lng": 77.2090,
  "destination_lat": 28.7041,
  "destination_lng": 77.1025,
  "estimated_time": 45.0,
  "distance_km": 3.2
}
```

---

## Location (OpenStreetMap)

### GET /api/location/nearby

Get nearby infrastructure from OpenStreetMap via Overpass API. Returns up to 7 categories: hospitals, shelters, community centres, schools, police stations, fire stations, and pharmacies.

**Authentication:** None

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `lat` | float | Yes | — | Latitude (-90 to 90) |
| `lng` | float | Yes | — | Longitude (-180 to 180) |
| `radius` | int | No | 10000 | Search radius in meters (100 to 100000) |

**Response:**
```json
{
  "hospitals": [
    {
      "name": "General Hospital",
      "latitude": 28.6268,
      "longitude": 77.2183,
      "distance": 2.189,
      "address": "40, Tolstoy Rd, New Delhi"
    }
  ],
  "shelters": [],
  "community_centres": [],
  "schools": [],
  "police": [],
  "firestations": [],
  "pharmacies": []
}
```

### GET /api/location/safe-destination

Get the single best safe destination scored by weighted distance.

**Authentication:** None

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `lat` | float | Yes | — | Latitude (-90 to 90) |
| `lng` | float | Yes | — | Longitude (-180 to 180) |
| `radius` | int | No | 10000 | Search radius in meters (100 to 100000) |

**Scoring Weights:** shelter=1.0, community_centre=1.3, school=1.5, hospital=2.0, police=2.3, firestation=2.6

---

## AI

### POST /api/ai/recommendation

Get an AI-powered disaster recommendation. Routes through a LangGraph multi-agent pipeline (Weather, Alert, Infrastructure, Route, Coordinator agents). Returns structured recommendation with risk level, summary, destination, reasoning, and actionable steps.

**Authentication:** None

**Request Body:**
```json
{
  "question": "Should I evacuate?",
  "lat": 28.6139,
  "lng": 77.2090,
  "incident_id": "uuid-string"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `question` | string | Yes | User's emergency question |
| `lat` | float | No | User's current latitude |
| `lng` | float | No | User's current longitude |
| `incident_id` | string | No | UUID for incident memory preservation |

**Response:**
```json
{
  "riskLevel": "high",
  "summary": "Severe weather conditions detected in your area.",
  "recommendedDestination": {
    "type": "shelter",
    "name": "Community Shelter A"
  },
  "reason": "Multiple factors indicate elevated risk...",
  "actions": [
    "Move to higher ground immediately",
    "Take emergency supply kit",
    "Proceed to nearest shelter: Community Shelter A (1.2 km)"
  ]
}
```
