from pydantic import BaseModel
from typing import List, Optional

class EyeCareTip(BaseModel):
    id: str
    category: str # "BREAKS", "DISTANCE", "LIGHTING", "BLINKING", "HYDRATION", "POSTURE"
    title: str
    content: str
    actionable_step: str
    scientific_rationale: str
    icon_name: str

class DailyTipResponse(BaseModel):
    date: str
    tip: EyeCareTip
    total_available_tips: int

class TipsListResponse(BaseModel):
    total: int
    categories: List[str]
    tips: List[EyeCareTip]
