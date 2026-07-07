# 🚨 AIDRAC – Agentic AI Disaster Response Coordinator

> **Autonomous AI for Smarter, Faster, and Safer Disaster Response**

> 🚧 **Project Status:** Phase 1 Completed | Phase 2 (Agentic AI) In Progress

![Python](https://img.shields.io/badge/Python-3.12-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green)
![React](https://img.shields.io/badge/React-18-61DAFB)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 🌍 Sustainable Development Goals (SDGs)

- 🏙️ **SDG 11 – Sustainable Cities & Communities**
- 🌱 **SDG 13 – Climate Action**

---

# 📖 Overview

AIDRAC (Agentic AI Disaster Response Coordinator) is a full-stack disaster management platform designed to assist citizens and emergency authorities during natural disasters such as floods, cyclones, earthquakes, and fires.

The platform provides real-time disaster information, nearby shelters, hospitals, emergency alerts, weather information, and interactive maps to support emergency response.

> **Phase 1** focuses on building a robust disaster management platform.  
> **Phase 2** introduces Agentic AI capable of autonomous disaster coordination using multiple AI agents.

---

# ✨ Features

## 🔐 Authentication

- JWT Authentication
- User Registration
- Secure Login
- Role-Based Access (Admin/User)
- Protected Routes

---

## 📊 Dashboard

- Disaster Overview
- Live Weather Information
- Active Alerts
- Emergency Statistics
- Quick Access Actions

---

## 🗺️ Interactive Maps

- User Location
- Shelter Locations
- Hospital Locations
- Disaster Zones
- Severity Indicators
- OpenStreetMap Integration

---

## 🏠 Shelter Management

- View Available Shelters
- Capacity Monitoring
- Occupancy Tracking
- Contact Details
- Location Information

---

## 🏥 Hospital Management

- Nearby Hospitals
- Emergency Availability
- Contact Information
- Interactive Map Integration

---

## 🚨 Disaster Management

- Active Disaster Tracking
- Disaster Severity Levels
- Emergency Alerts
- Disaster Status Monitoring

---

## 👨‍💼 Admin Dashboard

- Manage Shelters
- Manage Hospitals
- Monitor Active Disasters
- View Emergency Alerts
- System Overview

---

# 🛠️ Tech Stack

## Frontend

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router v6
- React Leaflet
- Axios
- Lucide React

---

## Backend

- FastAPI
- SQLAlchemy 2.0 (Async)
- PostgreSQL
- Pydantic v2
- Alembic
- JWT Authentication
- bcrypt Password Hashing

---

## DevOps

- Docker
- Docker Compose
- NGINX

---

# 🏗️ System Architecture

```text
                User
                  │
                  ▼
        React Frontend (Vite)
                  │
           REST API (Axios)
                  │
                  ▼
          FastAPI Backend
                  │
      ┌───────────┴───────────┐
      │                       │
 Authentication         Business Logic
      │                       │
      └───────────┬───────────┘
                  ▼
          PostgreSQL Database
```

---

# 📂 Project Structure

```text
aidrac/
├── backend/
│   ├── app/
│   │   ├── config/
│   │   ├── database/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── routers/
│   │   ├── services/
│   │   ├── utils/
│   │   └── main.py
│   ├── alembic/
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   ├── hooks/
│   │   └── types/
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
│
├── docker-compose.yml
└── README.md
```

---

# 📡 REST API

| Method | Endpoint | Description |
|----------|-------------------------|--------------------------|
| POST | `/api/auth/register` | Register User |
| POST | `/api/auth/login` | User Login |
| GET | `/api/users/me` | Current User |
| GET | `/api/weather` | Weather Data |
| GET | `/api/shelters` | List Shelters |
| POST | `/api/shelters` | Create Shelter |
| PUT | `/api/shelters/{id}` | Update Shelter |
| DELETE | `/api/shelters/{id}` | Delete Shelter |
| GET | `/api/hospitals` | List Hospitals |
| POST | `/api/hospitals` | Create Hospital |
| GET | `/api/disasters` | List Disasters |
| GET | `/api/disasters/active` | Active Disasters |
| POST | `/api/disasters` | Create Disaster |
| GET | `/api/alerts` | List Alerts |
| POST | `/api/alerts` | Create Alert |
| GET | `/api/routes` | List Routes |
| POST | `/api/routes` | Create Route |

---

# 🚀 Getting Started

## Prerequisites

- Python 3.12+
- Node.js 20+
- PostgreSQL 16+
- Docker Desktop (Recommended)

---

## Clone Repository

```bash
git clone https://github.com/<your-username>/AIDRAC.git

cd AIDRAC
```

---

## Run with Docker (Recommended)

```bash
docker compose up --build
```

### Access the application

Frontend

```
http://localhost
```

Backend

```
http://localhost:8000
```

Swagger API Documentation

```
http://localhost:8000/docs
```

---

## Run Locally

### Backend

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

# Linux/macOS
source venv/bin/activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

---

### Frontend

```bash
cd frontend

npm install

npm run dev
```

---

# 🔑 Demo Credentials

## 👨‍💼 Admin

```
Email:
admin@aidrac.com

Password:
admin123
```

---

## 👤 User

```
Email:
user@aidrac.com

Password:
user123
```

---

# 📸 Screenshots

> Add screenshots of:

- Landing Page
- Login
- Dashboard
- Interactive Map
- Shelter Page
- Hospital Page
- Admin Dashboard
- Swagger API

---

# ✅ Phase 1 Completed

- JWT Authentication
- User Registration & Login
- PostgreSQL Integration
- Interactive Maps
- Disaster Dashboard
- Shelter Management
- Hospital Management
- Emergency Alerts
- REST APIs
- Docker Deployment
- Swagger Documentation
- Responsive UI

---

# 🚀 Phase 2 Roadmap (Agentic AI)

- Gemini API Integration
- LangGraph Orchestrator
- Weather Agent
- Route Planning Agent
- Shelter Recommendation Agent
- Medical Assistance Agent
- Emergency Alert Agent
- Dynamic Evacuation Planning
- Intelligent Decision Support

---

# 🌟 Future Enhancements

- Drone Integration
- Satellite Imagery Analysis
- IoT Sensor Integration
- Voice Assistant
- Government API Integration
- Predictive Disaster Analytics
- SMS & WhatsApp Notifications
- Offline Emergency Mode

---

# 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push the branch
5. Open a Pull Request

---

# 📄 License

This project is licensed under the **MIT License**.

---

# 👨‍💻 Author

**Pranav Vivek Sadwelkar**

- GitHub: https://github.com/<your-username>
- LinkedIn: https://linkedin.com/in/<your-linkedin>

---

⭐ **If you found this project helpful, please consider giving it a Star on GitHub!**