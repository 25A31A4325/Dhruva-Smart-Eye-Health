import os
from typing import List

class Settings:
    PROJECT_NAME: str = "Dhruva - Smart Eye Health Monitoring System"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment mode: "development" | "production" | "testing"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development").lower()
    
    # Port (Render and other cloud platforms inject $PORT)
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # Security / JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dhruva-super-secret-jwt-key-2026-swasth-bharat-innovation")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")) # 24 hours
    
    # CORS Origins
    # Reads comma-separated URLs from FRONTEND_URL or CORS_ORIGINS in production
    _env_origins = os.getenv("CORS_ORIGINS") or os.getenv("FRONTEND_URL")
    if _env_origins:
        # Production origins supplied via environment (e.g. "https://dhruva.vercel.app")
        BACKEND_CORS_ORIGINS: List[str] = [origin.strip() for origin in _env_origins.split(",") if origin.strip()]
    else:
        # Default local development origins
        BACKEND_CORS_ORIGINS: List[str] = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5174",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:4173",
            "http://127.0.0.1:4173"
        ]
    
    # Firebase Firestore Configuration
    # Supported methods:
    # 1. Path to service account file (e.g., Render Secret File: /etc/secrets/serviceAccountKey.json)
    # 2. Raw JSON string in environment variable (FIREBASE_CREDENTIALS_JSON)
    FIREBASE_CREDENTIALS_PATH: str = os.getenv("FIREBASE_CREDENTIALS_PATH", "")
    FIREBASE_CREDENTIALS_JSON: str = os.getenv("FIREBASE_CREDENTIALS_JSON", "")
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "dhruva-eye-health")
    
    # In development/testing, falls back to in-memory mock Firestore if no credentials exist.
    # In production, USE_MOCK_FIRESTORE must be False.
    USE_MOCK_FIRESTORE: bool = os.getenv("USE_MOCK_FIRESTORE", "false").lower() in ("true", "1", "yes")

    # Ergonomic Defaults (20-20-20 Rule)
    DEFAULT_BREAK_INTERVAL_MINUTES: int = 20
    DEFAULT_BREAK_DURATION_SECONDS: int = 20
    MIN_RECOMMENDED_DISTANCE_CM: float = 50.0
    MAX_RECOMMENDED_DISTANCE_CM: float = 75.0
    DANGER_DISTANCE_THRESHOLD_CM: float = 35.0

settings = Settings()
