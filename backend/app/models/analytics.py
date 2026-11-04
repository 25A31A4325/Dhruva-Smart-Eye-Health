from pydantic import BaseModel
from typing import List, Optional

class DailySummaryResponse(BaseModel):
    user_id: str
    date: str
    total_screen_seconds: int
    total_screen_hours: float
    sessions_completed: int
    active_sessions_count: int
    breaks_prompted: int
    breaks_completed: int
    break_compliance_percent: float
    current_break_streak: int
    eye_health_score: float # 0 to 100 composite score
    health_score_status: str # "Optimal", "Good", "Needs Attention"
    distance_checks_performed: int
    latest_distance_cm: Optional[float] = None
    latest_distance_zone: Optional[str] = None

class DailyDataPoint(BaseModel):
    date: str
    day_name: str
    screen_time_minutes: float
    breaks_prompted: int
    breaks_completed: int
    compliance_rate: float
    eye_health_score: float

class WeeklyTrendsResponse(BaseModel):
    period_start: str
    period_end: str
    total_screen_time_hours: float
    average_daily_screen_time_hours: float
    overall_break_compliance_percent: float
    average_eye_health_score: float
    days: List[DailyDataPoint]

class MonthlyTrendsResponse(BaseModel):
    month_label: str
    total_screen_time_hours: float
    total_sessions: int
    total_breaks_prompted: int
    total_breaks_completed: int
    overall_compliance_percent: float
    average_health_score: float
    weekly_breakdown: List[WeeklyTrendsResponse]
