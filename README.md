# 🇮🇳 VALOR — Veteran AI Longitudinal Operational Recovery

> **AI-Assisted Gamified Recovery, Peer Connection & Clinical Trauma Tracking Platform for Indian Armed Forces Veterans & Specialists.**

---

## 📌 Project Summary

**VALOR** is a comprehensive, trauma-informed digital health and peer-support ecosystem engineered specifically for military veterans, ex-servicemen, and clinical trauma supervisors. 

The platform bridges the critical transition from active defense service to civilian wellness by combining:
- **Gamified Daily Recovery Drills**: Evidence-based somatic, mental, and physical challenges that award XP and streak rewards while capturing soldier reflections.
- **Longitudinal Clinical Tracking**: Objective baseline tracking and distress trajectory evaluation that alerts assigned specialists in real time when high distress thresholds are reached.
- **Squadrons & Comradeship Network**: Peer support circles, squad wellness drills, and an anti-spam cheer board with over 100 authentic Indian Armed Forces veteran profiles.
- **24/7 Immediate De-escalation**: Integrated 4-phase interactive Box Breathing grounding widget and direct one-touch connectivity to national Indian emergency lines (**112**, Tele-MANAS **14416**, Army ECHS **1902**).

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend API** | **Python 3.11+**, **FastAPI**, **SQLAlchemy** (Async ORM), **SQLite** / **PostgreSQL**, **Pydantic v2**, **Uvicorn**, **Pytest** |
| **Web Frontend** | **React 18**, **TypeScript**, **Vite**, **Tailwind CSS**, **Lucide Icons** |
| **Mobile App** | **React Native**, **Expo SDK 50**, **React Navigation** (Bottom Tabs & Stack), **AsyncStorage**, **Ionicons** |
| **Security & Auth** | Role-Based Access Control (RBAC), SHA-256 password hashing with strength enforcement, Caseload access isolation |

---

## 📂 Project Structure

```text
SAH-real-/
├── app/                            # FastAPI Backend Service
│   ├── api/                        # REST API Route Controllers
│   │   ├── auth.py                 # Authentication, registration & password validation
│   │   ├── chat.py                 # Counselor & direct messaging endpoints
│   │   ├── checkins.py             # Periodic wellness surveys & signals
│   │   ├── counselor.py            # Clinical caseload & alert management
│   │   ├── friends.py              # Comrade peer network & friend requests
│   │   ├── gps.py                  # GPS route tracking for physical tasks
│   │   ├── groups.py               # Squadrons, activities & anti-spam cheer boards
│   │   └── veterans.py             # Veteran dossiers, assessments & tasks
│   ├── engine/                     # Core Business Logic & AI Engines
│   │   ├── ai_alert_engine.py      # Automated distress evaluation & alerting
│   │   ├── baseline_engine.py      # HTQ clinical baseline computation
│   │   ├── deviation_model.py      # Statistical deviation & trajectory scoring
│   │   └── escalation_logic.py     # Priority routing & clinical recommendations
│   ├── models/                     # SQLAlchemy Database Models
│   │   ├── chat.py                 # Chat conversations & counselor profiles
│   │   └── gamified.py             # Veteran profiles, tasks, squads, rewards
│   ├── config.py                   # Application settings & environment configuration
│   ├── database.py                 # Async database session factory & engine
│   └── main.py                     # FastAPI application entrypoint & middleware
│
├── frontend/                       # React Web Application (Vite + TypeScript)
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/               # Login, registration & password strength meter
│   │   │   ├── common/             # Header, Sidebar, CrisisModal, BoxBreathingWidget
│   │   │   ├── counselor/          # Caseload overview, AI alert center, analytics
│   │   │   └── veteran/            # Today's journey, squads, assessments, profile settings
│   │   ├── context/                # AppContext global state management
│   │   ├── data/                   # Mock dossiers, starter drills & presets
│   │   ├── services/               # Typed API client with auto-failover
│   │   ├── App.tsx                 # Root router & role-based view dispatcher
│   │   └── main.tsx                # React DOM mount point
│   ├── package.json
│   └── vite.config.ts
│
├── veteran-app/                    # React Native / Expo Mobile Application
│   ├── src/
│   │   ├── constants/              # VALOR design system theme tokens & palette
│   │   ├── screens/                # Mobile screen views
│   │   │   ├── DashboardScreen.js  # Today's recovery journey & streak summary
│   │   │   ├── TasksScreen.js      # Daily physical/mental drills with reflection inputs
│   │   │   ├── GroupsScreen.js     # Squad discovery, drills & peer cheer dispatches
│   │   │   ├── FriendsScreen.js    # Comrades roster & friend requests
│   │   │   ├── DMScreen.js         # Peer-to-peer direct messaging
│   │   │   ├── AssessmentScreen.js # Harvard Trauma Questionnaire intake
│   │   │   ├── CrisisScreen.js     # Indian crisis helplines (112, 14416, 1902)
│   │   │   ├── PointsScreen.js     # Valor vault, reward tiers & honors
│   │   │   ├── ProfileScreen.js    # Military dossier & recovery motto
│   │   │   └── LoginScreen.js      # Strict authentication & credentials validation
│   │   └── services/               # AsyncStorage & API communication client
│   ├── App.js                      # Root navigation & authentication provider
│   └── package.json
│
├── tests/                          # Automated Pytest Suite (108 Tests)
│   ├── test_baseline.py
│   ├── test_deviation.py
│   ├── test_escalation.py
│   └── test_topic_sensitivity.py
│
├── sah_local.db                    # Pre-seeded SQLite database with 100 Indian comrades
└── requirements.txt                # Python backend dependencies
```

---

## 🚀 Quick Start Guide

### 1. Backend Server (FastAPI)
```bash
# Install Python dependencies
pip install -r requirements.txt

# Start FastAPI server on port 8000
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- **API Base URL**: `http://localhost:8000/api`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **Health Check**: `http://localhost:8000/health`

---

### 2. Web Portal (React + Vite)
```bash
# Navigate to web frontend
cd frontend

# Install dependencies & run development server
npm install
npm run dev
```
- **Web App URL**: `http://localhost:5173`

---

### 3. Mobile App (React Native / Expo)
```bash
# Navigate to mobile app
cd veteran-app

# Install dependencies & start Metro bundler
npm install
npx expo start
```
- **Web Emulation**: Open `http://localhost:8081` in your browser.
- **Physical Phone**: Scan the QR code or enter `exp://<your-ip>:8081` in the **Expo Go** mobile app.

---

## 🔑 Verified Demo Credentials

| Role | Name | Email | Password | Details / Focus |
| :--- | :--- | :--- | :--- | :--- |
| **Veteran (Stable)** | Col. Rajesh Sharma | `rajesh.sharma@veterans.org` | `Valor@2026` | 4th Gorkha Rifles, 14-day streak, active drills |
| **Veteran (Urgent)** | WO Vikram Verma | `vikram.verma@veterans.org` | `Valor@2026` | IAF Support, elevated distress evaluation |
| **Veteran (Para SF)** | Major Vikram Rathore | `vikram.rathore@army.gov.in` | `Valor@2026` | 9 Para SF, custom avatar & recovery creed |
| **Clinical Specialist** | Dr. Ananya Nair | `a.nair@amrita-health.org` | `Doctor@2026` | Lead Supervisor, AI Alert Center, Live Outreach |
