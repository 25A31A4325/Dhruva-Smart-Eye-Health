from fastapi import APIRouter, HTTPException, status, Depends, Query
from app.models.distance import (
    DistanceCheckRequest,
    DistanceCheckResponse,
    DistanceHistoryResponse
)
from app.services.distance_service import distance_service
from app.api.v1.endpoints.deps import get_current_user
from app.models.user import UserResponse

router = APIRouter(prefix="/distance", tags=["Viewing Distance Awareness"])

@router.post(
    "/check",
    response_model=DistanceCheckResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Evaluate user-entered viewing distance against ergonomic standards"
)
async def check_distance(
    request: DistanceCheckRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Evaluates an estimated or manually verified viewing distance.
    Provides targeted physiological feedback regarding ciliary muscle tension and accommodative stress.
    
    *Notice: Educational guidance only. Does not perform clinical or physical sensor measurement.*
    """
    try:
        return distance_service.evaluate_distance(user_id=current_user.id, request=request)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get(
    "/history",
    response_model=DistanceHistoryResponse,
    summary="Get user distance check assessment history"
)
async def get_distance_history(
    limit: int = Query(default=20, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Retrieves chronological history of distance checks performed by the authenticated user.
    """
    return distance_service.get_history(user_id=current_user.id, limit=limit)
