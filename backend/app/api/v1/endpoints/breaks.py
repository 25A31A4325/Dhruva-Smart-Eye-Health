from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List
from app.models.break_event import (
    BreakPromptRequest,
    BreakAcknowledgeRequest,
    BreakEventResponse,
    BreakStatsResponse
)
from app.services.break_service import break_service
from app.api.v1.endpoints.deps import get_current_user
from app.models.user import UserResponse

router = APIRouter(prefix="/breaks", tags=["20-20-20 Break System"])

@router.post(
    "/log-prompt",
    response_model=BreakEventResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Log that a 20-20-20 break reminder was prompted to the user"
)
async def log_break_prompt(
    request: BreakPromptRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Called by the client when the 20-minute active timer elapses and the 20-second break modal is displayed.
    """
    try:
        return break_service.log_break_prompt(user_id=current_user.id, request=request)
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post(
    "/acknowledge",
    response_model=BreakEventResponse,
    summary="Acknowledge completed or skipped 20-second break"
)
async def acknowledge_break(
    request: BreakAcknowledgeRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Records whether the user fulfilled the 20-second distant gaze or skipped the break prompt.
    """
    try:
        return break_service.acknowledge_break(user_id=current_user.id, request=request)
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get(
    "/history",
    response_model=List[BreakEventResponse],
    summary="Fetch break reminder events history"
)
async def get_break_history(
    limit: int = Query(default=30, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Retrieves logged break events and adherence statuses.
    """
    return break_service.get_user_breaks(user_id=current_user.id, limit=limit)

@router.get(
    "/stats",
    response_model=BreakStatsResponse,
    summary="Get 20-20-20 break compliance statistics and current streak"
)
async def get_break_statistics(current_user: UserResponse = Depends(get_current_user)):
    """
    Returns total prompted, completed, skipped counts, compliance percentage, and current active streak.
    """
    return break_service.get_break_statistics(user_id=current_user.id)
