from typing import Optional
from fastapi import APIRouter, HTTPException, status, Depends, Query
from app.models.camera_wellness import (
    CameraWellnessSummaryCreate,
    CameraWellnessSummaryResponse,
    CameraWellnessHistoryResponse
)
from app.services.camera_wellness_service import camera_wellness_service
from app.api.v1.endpoints.deps import get_current_user
from app.models.user import UserResponse

router = APIRouter(prefix="/camera-wellness", tags=["Camera Wellness Awareness"])

@router.post(
    "/summary",
    response_model=CameraWellnessSummaryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Save camera wellness check non-image summary"
)
def save_camera_wellness_summary(
    request: CameraWellnessSummaryCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Saves or evaluates an educational non-image summary from an in-browser camera wellness check.
    Zero image, video, biometric, or landmark data is received or retained.
    Respects user consent: if user_consent is false, the summary is evaluated for educational tips
    without being persisted in the database.
    """
    try:
        return camera_wellness_service.save_summary(user_id=current_user.id, request=request)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get(
    "/latest",
    response_model=Optional[CameraWellnessSummaryResponse],
    summary="Get latest camera wellness check summary"
)
def get_latest_camera_wellness_summary(
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Retrieves the most recent consented camera wellness summary for the authenticated user.
    """
    return camera_wellness_service.get_latest(user_id=current_user.id)

@router.get(
    "/history",
    response_model=CameraWellnessHistoryResponse,
    summary="Get camera wellness check summary history"
)
def get_camera_wellness_history(
    limit: int = Query(default=20, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Retrieves chronological history of saved non-image camera wellness summaries for the authenticated user.
    """
    return camera_wellness_service.get_history(user_id=current_user.id, limit=limit)
