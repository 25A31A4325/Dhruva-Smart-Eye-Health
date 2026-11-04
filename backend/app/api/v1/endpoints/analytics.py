from fastapi import APIRouter, Depends, Query
from typing import Optional
from app.models.analytics import (
    DailySummaryResponse,
    WeeklyTrendsResponse,
    MonthlyTrendsResponse
)
from app.services.analytics_service import analytics_service
from app.api.v1.endpoints.deps import get_current_user
from app.models.user import UserResponse

router = APIRouter(prefix="/analytics", tags=["Reports & Analytics"])

@router.get(
    "/daily-summary",
    response_model=DailySummaryResponse,
    summary="Get today's screen time, break compliance, and health score"
)
async def get_daily_summary(
    date: Optional[str] = Query(default=None, description="ISO Date string YYYY-MM-DD. Defaults to today."),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Computes real-time daily metrics:
    - In-app active screen duration (seconds and hours)
    - Completed vs active sessions
    - 20-20-20 breaks prompted and adhered to
    - Composite Eye Health Awareness Score (0 to 100)
    - Latest distance check metrics
    """
    return analytics_service.get_daily_summary(user_id=current_user.id, target_date_str=date)

@router.get(
    "/weekly-trends",
    response_model=WeeklyTrendsResponse,
    summary="Get 7-day chronological usage and compliance trends"
)
async def get_weekly_trends(current_user: UserResponse = Depends(get_current_user)):
    """
    Retrieves day-by-day active time, break compliance percentages, and health scores
    for plotting responsive trend charts.
    """
    return analytics_service.get_weekly_trends(user_id=current_user.id)

@router.get(
    "/monthly-trends",
    response_model=MonthlyTrendsResponse,
    summary="Get 30-day aggregated monthly overview"
)
async def get_monthly_trends(current_user: UserResponse = Depends(get_current_user)):
    """
    Retrieves month-level macro trends, total sessions completed, and overall break adherence rate.
    """
    return analytics_service.get_monthly_trends(user_id=current_user.id)
