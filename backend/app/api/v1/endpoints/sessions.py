from fastapi import APIRouter, HTTPException, status, Depends, Query
from app.models.session import (
    SessionStartRequest,
    SessionHeartbeatRequest,
    SessionPauseResumeRequest,
    SessionStopRequest,
    SessionResponse,
    SessionListResponse
)
from app.services.session_service import session_service
from app.api.v1.endpoints.deps import get_current_user
from app.models.user import UserResponse

router = APIRouter(prefix="/sessions", tags=["Screen Session Tracker"])

@router.post(
    "/start",
    response_model=SessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Start a new monitoring session"
)
async def start_session(
    request: SessionStartRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Initiates an active in-app screen monitoring session.
    Automatically closes any previously unfinished active sessions to prevent duplicate active state.
    """
    try:
        return session_service.start_session(user_id=current_user.id, request=request)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post(
    "/heartbeat",
    response_model=SessionResponse,
    summary="Record active screen session heartbeat"
)
async def record_heartbeat(
    request: SessionHeartbeatRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Dispatched by the frontend every 60 seconds of active engaged screen work.
    Increments tracked session duration and evaluates whether a 20-20-20 break is due.
    """
    try:
        return session_service.record_heartbeat(user_id=current_user.id, request=request)
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post(
    "/pause-resume",
    response_model=SessionResponse,
    summary="Pause or resume an active session"
)
async def pause_resume_session(
    request: SessionPauseResumeRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Pauses session tracking (e.g., when the user leaves the computer or switches tabs) or resumes it.
    """
    try:
        return session_service.set_pause_resume(
            user_id=current_user.id,
            session_id=request.session_id,
            action=request.action
        )
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post(
    "/stop",
    response_model=SessionResponse,
    summary="Conclude an active monitoring session"
)
async def stop_session(
    request: SessionStopRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Concludes the screen session and persists final duration and compliance statistics.
    """
    try:
        return session_service.stop_session(user_id=current_user.id, request=request)
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get(
    "/history",
    response_model=SessionListResponse,
    summary="Fetch past session history for current user"
)
async def get_session_history(
    limit: int = Query(default=20, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Retrieves chronological list of completed and active sessions belonging to the authenticated user.
    """
    return session_service.get_user_history(user_id=current_user.id, limit=limit)
