from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from app.core.firebase import get_firestore_client
from app.models.analytics import (
    DailySummaryResponse,
    DailyDataPoint,
    WeeklyTrendsResponse,
    MonthlyTrendsResponse
)
from app.services.break_service import break_service

class AnalyticsService:
    def __init__(self):
        self.session_col = "screen_sessions"
        self.break_col = "break_events"
        self.distance_col = "distance_assessments"

    @property
    def db(self):
        return get_firestore_client()

    def get_daily_summary(self, user_id: str, target_date_str: Optional[str] = None) -> DailySummaryResponse:
        if not target_date_str:
            target_date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        # Query sessions for this user
        sessions = self.db.collection(self.session_col)\
            .where("user_id", "==", user_id)\
            .stream()

        total_active_seconds = 0
        sessions_completed = 0
        active_sessions_count = 0
        breaks_prompted_today = 0
        breaks_completed_today = 0

        for s in sessions:
            s_data = s.to_dict()
            s_start = s_data.get("start_time", "")
            if s_start.startswith(target_date_str):
                total_active_seconds += s_data.get("active_duration_seconds", 0)
                if s_data.get("status") == "COMPLETED":
                    sessions_completed += 1
                elif s_data.get("status") in ("ACTIVE", "PAUSED"):
                    active_sessions_count += 1

        # Query break events today
        breaks = self.db.collection(self.break_col)\
            .where("user_id", "==", user_id)\
            .stream()

        for b in breaks:
            b_data = b.to_dict()
            p_time = b_data.get("prompted_at", "")
            if p_time.startswith(target_date_str):
                breaks_prompted_today += 1
                if b_data.get("completed") is True:
                    breaks_completed_today += 1

        # Streak calculation
        stats = break_service.get_break_statistics(user_id)
        current_streak = stats.current_streak

        compliance_rate = (
            (breaks_completed_today / breaks_prompted_today * 100.0)
            if breaks_prompted_today > 0 else 100.0 if total_active_seconds < 1200 else 0.0
        )

        # Eye Health Awareness Score calculation (0 - 100)
        # Based on break adherence, reasonable screen pacing, and distance checks
        # Pacing factor: Screen hours per break
        hours = total_active_seconds / 3600.0
        pacing_penalty = 0.0
        if hours > 2.0 and breaks_completed_today == 0:
            pacing_penalty = 30.0

        eye_health_score = max(0.0, min(100.0, (compliance_rate * 0.7) + (30.0 - pacing_penalty)))
        eye_health_score = round(eye_health_score, 1)

        if eye_health_score >= 80.0:
            status_label = "Optimal"
        elif eye_health_score >= 60.0:
            status_label = "Good"
        else:
            status_label = "Needs Attention"

        # Latest distance check
        distance_checks = self.db.collection(self.distance_col)\
            .where("user_id", "==", user_id)\
            .order_by("timestamp", direction="DESCENDING")\
            .limit(1)\
            .stream()

        latest_dist_cm = None
        latest_dist_zone = None
        dist_count = 0

        for d in distance_checks:
            dist_data = d.to_dict()
            latest_dist_cm = dist_data.get("reported_distance_cm")
            latest_dist_zone = dist_data.get("zone")
            dist_count += 1

        return DailySummaryResponse(
            user_id=user_id,
            date=target_date_str,
            total_screen_seconds=total_active_seconds,
            total_screen_hours=round(total_active_seconds / 3600.0, 2),
            sessions_completed=sessions_completed,
            active_sessions_count=active_sessions_count,
            breaks_prompted=breaks_prompted_today,
            breaks_completed=breaks_completed_today,
            break_compliance_percent=round(compliance_rate, 1),
            current_break_streak=current_streak,
            eye_health_score=eye_health_score,
            health_score_status=status_label,
            distance_checks_performed=dist_count,
            latest_distance_cm=latest_dist_cm,
            latest_distance_zone=latest_dist_zone
        )

    def get_weekly_trends(self, user_id: str) -> WeeklyTrendsResponse:
        today = datetime.now(timezone.utc).date()
        days_data: List[DailyDataPoint] = []
        total_seconds = 0
        total_prompted = 0
        total_completed = 0
        total_score_sum = 0.0

        # Gather last 7 days
        for i in range(6, -1, -1):
            d = today - timedelta(days=i)
            d_str = d.strftime("%Y-%m-%d")
            day_name = d.strftime("%a")

            summary = self.get_daily_summary(user_id=user_id, target_date_str=d_str)
            total_seconds += summary.total_screen_seconds
            total_prompted += summary.breaks_prompted
            total_completed += summary.breaks_completed
            total_score_sum += summary.eye_health_score

            days_data.append(DailyDataPoint(
                date=d_str,
                day_name=day_name,
                screen_time_minutes=round(summary.total_screen_seconds / 60.0, 1),
                breaks_prompted=summary.breaks_prompted,
                breaks_completed=summary.breaks_completed,
                compliance_rate=summary.break_compliance_percent,
                eye_health_score=summary.eye_health_score
            ))

        total_hours = round(total_seconds / 3600.0, 2)
        avg_hours = round(total_hours / 7.0, 2)
        overall_compliance = (
            round((total_completed / total_prompted * 100.0), 1)
            if total_prompted > 0 else 100.0
        )
        avg_score = round(total_score_sum / 7.0, 1)

        return WeeklyTrendsResponse(
            period_start=(today - timedelta(days=6)).strftime("%Y-%m-%d"),
            period_end=today.strftime("%Y-%m-%d"),
            total_screen_time_hours=total_hours,
            average_daily_screen_time_hours=avg_hours,
            overall_break_compliance_percent=overall_compliance,
            average_eye_health_score=avg_score,
            days=days_data
        )

    def get_monthly_trends(self, user_id: str) -> MonthlyTrendsResponse:
        now = datetime.now(timezone.utc)
        month_label = now.strftime("%B %Y")
        
        # 4 weeks breakdown
        weeks: List[WeeklyTrendsResponse] = []
        # Current week
        current_week = self.get_weekly_trends(user_id)
        weeks.append(current_week)

        # Totals
        total_hrs = current_week.total_screen_time_hours
        total_prompted = sum(d.breaks_prompted for d in current_week.days)
        total_completed = sum(d.breaks_completed for d in current_week.days)
        compliance = (round(total_completed / total_prompted * 100.0, 1) if total_prompted > 0 else 100.0)

        # Count total sessions for user
        sessions = self.db.collection(self.session_col)\
            .where("user_id", "==", user_id)\
            .stream()
        session_count = len(list(sessions))

        return MonthlyTrendsResponse(
            month_label=month_label,
            total_screen_time_hours=total_hrs,
            total_sessions=session_count,
            total_breaks_prompted=total_prompted,
            total_breaks_completed=total_completed,
            overall_compliance_percent=compliance,
            average_health_score=current_week.average_eye_health_score,
            weekly_breakdown=weeks
        )

analytics_service = AnalyticsService()
