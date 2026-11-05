import uuid
from datetime import datetime, timezone
from typing import List, Optional
from app.core.firebase import get_firestore_client
from app.models.camera_wellness import (
    CameraWellnessSummaryCreate,
    CameraWellnessSummaryResponse,
    CameraWellnessHistoryResponse,
    STANDARD_WELLNESS_DISCLAIMER
)

class CameraWellnessService:
    def __init__(self):
        self.collection_name = "camera_wellness_summaries"

    @property
    def db(self):
        return get_firestore_client()

    def _generate_educational_tips(self, summary: CameraWellnessSummaryCreate) -> List[str]:
        tips = [
            "Conscious Blinking: Computer users often blink 50% less frequently. Remember to execute complete blinks to replenish your tear film.",
            "The 20-20-20 Habit: Every 20 minutes of screen work, glance at an object 20 feet away for 20 seconds to relax your ciliary muscles.",
            "Workstation Lighting: Ensure balanced ambient lighting without harsh overhead glare or reflection bouncing directly off your monitor."
        ]

        # Add targeted tips based on apparent framing
        if "close" in summary.relative_position_summary.lower():
            tips.append(
                "Ergonomic Distance: Position your monitor about arm's length away (approximately 50-70 cm) to minimize accommodative fatigue."
            )
        else:
            tips.append(
                "Display Alignment: Keep the top third of your display at or slightly below eye level to maintain a relaxed natural downward gaze."
            )

        return tips

    def save_summary(self, user_id: str, request: CameraWellnessSummaryCreate) -> CameraWellnessSummaryResponse:
        summary_id = str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()
        educational_tips = self._generate_educational_tips(request)

        # Calculate approximate blinks per minute if not provided
        bpm = request.blinks_per_minute
        if bpm is None and request.session_duration_seconds > 0:
            bpm = round((request.approximate_blink_count / request.session_duration_seconds) * 60, 1)

        response_obj = CameraWellnessSummaryResponse(
            id=summary_id,
            user_id=user_id,
            timestamp=now_iso,
            session_duration_seconds=request.session_duration_seconds,
            approximate_blink_count=request.approximate_blink_count,
            blinks_per_minute=bpm,
            face_visibility_summary=request.face_visibility_summary,
            relative_position_summary=request.relative_position_summary,
            lighting_summary=request.lighting_summary,
            user_consent=request.user_consent,
            educational_tips=educational_tips,
            disclaimer=STANDARD_WELLNESS_DISCLAIMER
        )

        # Only persist to database if explicit user consent is provided
        if request.user_consent:
            doc_data = {
                "id": summary_id,
                "user_id": user_id,
                "timestamp": now_iso,
                "session_duration_seconds": request.session_duration_seconds,
                "approximate_blink_count": request.approximate_blink_count,
                "blinks_per_minute": bpm,
                "face_visibility_summary": request.face_visibility_summary,
                "relative_position_summary": request.relative_position_summary,
                "lighting_summary": request.lighting_summary,
                "user_consent": request.user_consent,
                "educational_tips": educational_tips,
                "client_notes": request.client_notes,
                "created_at": now_iso
            }
            self.db.collection(self.collection_name).document(summary_id).set(doc_data)

        return response_obj

    def get_latest(self, user_id: str) -> Optional[CameraWellnessSummaryResponse]:
        docs = list(self.db.collection(self.collection_name)\
            .where("user_id", "==", user_id)\
            .order_by("timestamp", direction="DESCENDING")\
            .limit(1)\
            .stream())

        if not docs:
            return None

        data = docs[0].to_dict()
        return CameraWellnessSummaryResponse(
            id=data.get("id", docs[0].id),
            user_id=data["user_id"],
            timestamp=data["timestamp"],
            session_duration_seconds=data.get("session_duration_seconds", 0),
            approximate_blink_count=data.get("approximate_blink_count", 0),
            blinks_per_minute=data.get("blinks_per_minute"),
            face_visibility_summary=data.get("face_visibility_summary", "Visible"),
            relative_position_summary=data.get("relative_position_summary", "Standard"),
            lighting_summary=data.get("lighting_summary", "Adequate"),
            user_consent=data.get("user_consent", True),
            educational_tips=data.get("educational_tips", []),
            disclaimer=STANDARD_WELLNESS_DISCLAIMER
        )

    def get_history(self, user_id: str, limit: int = 20) -> CameraWellnessHistoryResponse:
        docs = self.db.collection(self.collection_name)\
            .where("user_id", "==", user_id)\
            .order_by("timestamp", direction="DESCENDING")\
            .limit(limit)\
            .stream()

        results = []
        for d in docs:
            data = d.to_dict()
            results.append(CameraWellnessSummaryResponse(
                id=data.get("id", d.id),
                user_id=data["user_id"],
                timestamp=data["timestamp"],
                session_duration_seconds=data.get("session_duration_seconds", 0),
                approximate_blink_count=data.get("approximate_blink_count", 0),
                blinks_per_minute=data.get("blinks_per_minute"),
                face_visibility_summary=data.get("face_visibility_summary", "Visible"),
                relative_position_summary=data.get("relative_position_summary", "Standard"),
                lighting_summary=data.get("lighting_summary", "Adequate"),
                user_consent=data.get("user_consent", True),
                educational_tips=data.get("educational_tips", []),
                disclaimer=STANDARD_WELLNESS_DISCLAIMER
            ))

        return CameraWellnessHistoryResponse(
            total_summaries=len(results),
            summaries=results
        )

camera_wellness_service = CameraWellnessService()
