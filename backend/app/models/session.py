from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum

class SessionStatusEnum(str, Enum):
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"

class SessionStartRequest(BaseModel):
    client_info: Optional[str] = Field(default="Web Browser", description="User agent or device context")
    break_interval_minutes: Optional[int] = Field(default=20, ge=5, le=60)
    notes: Optional[str] = Field(default=None, max_length=200)

class SessionHeartbeatRequest(BaseModel):
    session_id: str
    active_seconds_delta: int = Field(default=60, ge=1, le=3600, description="Active engaged seconds since last heartbeat")
    is_window_focused: bool = Field(default=True, description="True if tab was active and visible")

class SessionPauseResumeRequest(BaseModel):
    session_id: str
    action: str = Field(description="'pause' or 'resume'")

class SessionStopRequest(BaseModel):
    session_id: str
    final_notes: Optional[str] = None

class SessionResponse(BaseModel):
    id: str
    user_id: str
    start_time: str
    end_time: Optional[str] = None
    status: SessionStatusEnum
    total_duration_seconds: int
    active_duration_seconds: int
    breaks_prompted: int
    breaks_completed: int
    last_heartbeat: str
    break_interval_minutes: int
    is_break_due: bool = False

class SessionListResponse(BaseModel):
    total: int
    sessions: List[SessionResponse]
