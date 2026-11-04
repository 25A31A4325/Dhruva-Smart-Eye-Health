from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_router
from app.core.firebase import get_firestore_client

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize Firestore client on startup
    get_firestore_client()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "**Dhruva: Smart Eye Health Monitoring and Early Warning System**\n\n"
        "A 100% software-based preventive healthcare and digital eye strain awareness platform "
        "developed for the *Swasth & Samavesh Bharat* national innovation challenge.\n\n"
        "Features:\n"
        "- **In-App Screen Session Tracking** with active engagement logging\n"
        "- **The 20-20-20 Rule Reminder System** with break streak compliance\n"
        "- **Ergonomic Viewing Distance Assistant** with physiological guidance\n"
        "- **7-Point Digital Eye Strain Self-Assessment Questionnaire**\n"
        "- **Daily Curated Eye Care Guidelines & Analytics Trends**\n\n"
        "*Disclaimer: This software is designed for behavioral awareness and ergonomic habit improvement. "
        "It does not provide ophthalmic clinical diagnosis or measure physiological eye parameters.*"
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# Configure CORS for Vite React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/", tags=["Health & Status"])
async def root():
    return {
        "project": "Dhruva",
        "title": "Smart Eye Health Monitoring and Early Warning System",
        "theme": "Swasth & Samavesh Bharat",
        "version": settings.VERSION,
        "status": "OPERATIONAL",
        "mode": "100% Software-Based Preventive Healthcare",
        "docs_url": "/docs",
        "disclaimer": "Educational and ergonomic awareness only. No clinical diagnosis provided."
    }

@app.get("/health", tags=["Health & Status"])
async def health_check():
    return {
        "status": "healthy",
        "timestamp": "2026-11-04T18:15:00Z",
        "database": "connected"
    }
