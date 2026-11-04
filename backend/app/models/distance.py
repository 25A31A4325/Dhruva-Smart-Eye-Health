from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum

class DistanceZoneCategory(str, Enum):
    OPTIMAL = "OPTIMAL"          # 50 - 75 cm
    ACCEPTABLE = "ACCEPTABLE"    # 45 - 50 cm or 75 - 85 cm
    WARNING_CLOSE = "WARNING_CLOSE" # 35 - 45 cm
    DANGER_TOO_CLOSE = "DANGER_TOO_CLOSE" # < 35 cm
    TOO_FAR = "TOO_FAR"          # > 85 cm

class DistanceCheckRequest(BaseModel):
    reported_distance_cm: float = Field(ge=15.0, le=200.0, description="Manually estimated distance between eyes and screen in cm")
    screen_diagonal_inches: Optional[float] = Field(default=15.6, ge=5.0, le=65.0, description="Screen size in inches")
    workstation_type: Optional[str] = Field(default="LAPTOP", description="LAPTOP, DESKTOP_MONITOR, TABLET, or SMARTPHONE")
    notes: Optional[str] = None

class DistanceCheckResponse(BaseModel):
    id: str
    user_id: str
    timestamp: str
    reported_distance_cm: float
    recommended_min_cm: float
    recommended_max_cm: float
    zone: DistanceZoneCategory
    status_label: str
    educational_guidance: str
    ciliary_strain_risk: str
    disclaimer: str = (
        "Educational Guidance Only: This assessment is based on user-entered data and standardized "
        "optometric ergonomic guidelines. It is not an optical sensor measurement and does not provide clinical diagnosis."
    )

class DistanceHistoryResponse(BaseModel):
    total_checks: int
    checks: List[DistanceCheckResponse]
