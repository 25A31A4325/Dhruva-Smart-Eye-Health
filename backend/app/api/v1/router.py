from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    sessions,
    breaks,
    distance,
    assessment,
    tips,
    analytics,
    camera_wellness
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(sessions.router)
api_router.include_router(breaks.router)
api_router.include_router(distance.router)
api_router.include_router(assessment.router)
api_router.include_router(tips.router)
api_router.include_router(analytics.router)
api_router.include_router(camera_wellness.router)
