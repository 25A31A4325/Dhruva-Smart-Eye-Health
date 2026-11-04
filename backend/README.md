# Dhruva: Backend Service API

**National Innovation Challenge Project (Swasth & Samavesh Bharat)**  
**Version:** 2.0.0 (100% Software-Based Architecture)  
**Framework:** Python 3.11+ / FastAPI / Pydantic v2 / Firebase Firestore

---

## Overview

The **Dhruva Backend** is a high-performance RESTful API powering an intelligent, non-invasive digital eye health awareness and ergonomic monitoring platform. It manages user authentication, active in-app screen work sessions, 20-20-20 rule compliance tracking, ergonomic viewing distance assessments, and evidence-informed digital eye strain questionnaires.

> **Medical Disclaimer:** This system provides behavioral awareness and ergonomic habit coaching. It does not perform clinical diagnosis, measure intraocular pressure, or replace licensed ophthalmic examinations.

---

## Directory Structure

```
backend/
├── app/
│   ├── main.py                  # FastAPI initialization, CORS, and root health check
│   ├── core/
│   │   ├── config.py            # Environment settings and ergonomic thresholds
│   │   ├── security.py          # bcrypt password hashing & JWT encoding/decoding
│   │   └── firebase.py          # Production Firestore & in-memory Mock Firestore
│   ├── models/
│   │   ├── user.py              # Pydantic schemas for Auth & Preferences
│   │   ├── session.py           # Pydantic schemas for Screen Sessions & Heartbeats
│   │   ├── break_event.py       # Pydantic schemas for 20-20-20 Prompts & Acknowledgments
│   │   ├── distance.py          # Pydantic schemas for Distance Checks & Guidance
│   │   ├── questionnaire.py     # Pydantic schemas for 7-Point Strain Assessment
│   │   ├── tips.py              # Pydantic schemas for Eye Care Guidelines
│   │   └── analytics.py         # Pydantic schemas for Daily & Weekly Trends
│   ├── services/
│   │   ├── auth_service.py      # Registration, verification, JWT issuance
│   │   ├── session_service.py   # Active session lifecycle & duplicate prevention
│   │   ├── break_service.py     # 20-20-20 compliance rate & streak calculation
│   │   ├── distance_service.py  # Viewing distance classification & ciliary fatigue models
│   │   ├── questionnaire_service.py # 7-point scoring rubric & personalized recommendations
│   │   ├── tips_service.py      # Curated eye care tips & daily rotator
│   │   └── analytics_service.py # Aggregation engine & Eye Health Awareness Index
│   └── api/
│       └── v1/
│           ├── router.py        # Master API v1 router
│           └── endpoints/       # Modular endpoint routers
├── tests/                       # Complete Pytest test suite
├── requirements.txt             # Python dependency manifest
├── .env.example                 # Sample environment variables
└── README.md
```

---

## Quickstart & Local Execution

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run the Development Server
From the `backend` directory:
```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Alternatively, from the project root:
```bash
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 3. Interactive API Documentation
Once the server is running, access Swagger UI documentation at:
- **Swagger UI:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc UI:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## Running the Automated Test Suite

Run all Pytest test cases:
```bash
cd backend
pytest -v
```

---

## Firebase Firestore Setup (Production)

1. Create a Firebase project at [https://console.firebase.google.com](https://console.firebase.google.com).
2. Generate a Private Key under **Project Settings > Service accounts > Firebase Admin SDK**.
3. Save the JSON file as `serviceAccountKey.json` inside the `backend` directory.
4. Set the path in your `.env` file:
   ```env
   FIREBASE_CREDENTIALS_PATH=serviceAccountKey.json
   FIREBASE_PROJECT_ID=your-firebase-project-id
   ```
*Note: If no Firebase credentials are provided, Dhruva automatically activates an in-memory high-fidelity mock Firestore database, allowing complete local development and testing without any cloud setup.*
