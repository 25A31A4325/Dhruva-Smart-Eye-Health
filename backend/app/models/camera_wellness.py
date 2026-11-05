from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, Field

STANDARD_WELLNESS_DISCLAIMER = (
    "This camera-based feature provides basic eye wellness awareness only. "
    "It is not a medical examination, eyesight test, or diagnostic tool. "
    "Camera estimates may be inaccurate. Consult a qualified eye-care "
    "professional if you have concerns about your vision."
)

class CameraWellnessSummaryCreate(BaseModel):
    session_duration_seconds: int = Field(..., ge=1, description="Duration of the wellness check session in seconds")
    approximate_blink_count: int = Field(..., ge=0, description="Approximate number of blinks detected during session")
    blinks_per_minute: Optional[float] = Field(None, ge=0.0, description="Estimated blink rate per minute")
    face_visibility_summary: str = Field(..., description="Summary of face visibility (e.g., 'Consistently visible', 'Intermittently visible')")
    relative_position_summary: str = Field(..., description="Apparent face-to-camera distance observation (no cm measurement)")
    lighting_summary: Optional[str] = Field("Adequate illumination", description="General lighting condition observation")
    user_consent: bool = Field(True, description="Explicit user consent to store non-image metrics")
    client_notes: Optional[str] = Field(None, max_length=500)

class CameraWellnessSummaryResponse(BaseModel):
    id: str
    user_id: str
    timestamp: str
    session_duration_seconds: int
    approximate_blink_count: int
    blinks_per_minute: Optional[float] = None
    face_visibility_summary: str
    relative_position_summary: str
    lighting_summary: Optional[str] = "Adequate illumination"
    user_consent: bool = True
    educational_tips: List[str] = Field(default_factory=list)
    disclaimer: str = STANDARD_WELLNESS_DISCLAIMER

class CameraWellnessHistoryResponse(BaseModel):
    total_summaries: int
    summaries: List[CameraWellnessSummaryResponse]
