from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum

class BreakComplianceStatus(str, Enum):
    COMPLETED = "COMPLETED"
    SKIPPED = "SKIPPED"
    PENDING = "PENDING"

class BreakPromptRequest(BaseModel):
    session_id: str
    prompt_message: Optional[str] = "20-20-20 Rule Reminder: Look 20 feet away for 20 seconds!"

class BreakAcknowledgeRequest(BaseModel):
    break_id: str
    completed: bool = Field(description="True if user followed through the 20-second distant gaze")
    elapsed_break_seconds: Optional[int] = Field(default=20, ge=0, le=300)
    user_feedback: Optional[str] = None

class BreakEventResponse(BaseModel):
    id: str
    session_id: str
    user_id: str
    prompted_at: str
    acknowledged_at: Optional[str] = None
    completed: bool
    status: BreakComplianceStatus
    duration_seconds: int

class BreakStatsResponse(BaseModel):
    total_prompted: int
    total_completed: int
    total_skipped: int
    compliance_rate_percent: float
    current_streak: int
    best_streak: int
