import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from app.core.firebase import get_firestore_client
from app.models.break_event import (
    BreakPromptRequest,
    BreakAcknowledgeRequest,
    BreakEventResponse,
    BreakStatsResponse,
    BreakComplianceStatus
)

class BreakService:
    def __init__(self):
        self.collection_name = "break_events"
        self.session_col = "screen_sessions"

    @property
    def db(self):
        return get_firestore_client()

    def log_break_prompt(self, user_id: str, request: BreakPromptRequest) -> BreakEventResponse:
        # Validate that session exists and belongs to user
        session_ref = self.db.collection(self.session_col).document(request.session_id)
        session_doc = session_ref.get()
        if not session_doc.exists:
            raise ValueError("Associated session not found.")
        if session_doc.to_dict().get("user_id") != user_id:
            raise PermissionError("Access forbidden: session belongs to another user.")

        break_id = str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()

        break_data = {
            "session_id": request.session_id,
            "user_id": user_id,
            "prompted_at": now_iso,
            "acknowledged_at": None,
            "completed": False,
            "status": BreakComplianceStatus.PENDING.value,
            "duration_seconds": 20,
            "prompt_message": request.prompt_message or ""
        }

        self.db.collection(self.collection_name).document(break_id).set(break_data)

        # Increment breaks_prompted in session
        current_prompted = session_doc.to_dict().get("breaks_prompted", 0)
        session_ref.update({"breaks_prompted": current_prompted + 1})

        return BreakEventResponse(
            id=break_id,
            session_id=request.session_id,
            user_id=user_id,
            prompted_at=now_iso,
            acknowledged_at=None,
            completed=False,
            status=BreakComplianceStatus.PENDING,
            duration_seconds=20
        )

    def acknowledge_break(self, user_id: str, request: BreakAcknowledgeRequest) -> BreakEventResponse:
        doc_ref = self.db.collection(self.collection_name).document(request.break_id)
        doc = doc_ref.get()

        if not doc.exists:
            raise ValueError("Break event not found.")

        break_data = doc.to_dict()
        if break_data.get("user_id") != user_id:
            raise PermissionError("Access forbidden.")

        now_iso = datetime.now(timezone.utc).isoformat()
        status_val = BreakComplianceStatus.COMPLETED.value if request.completed else BreakComplianceStatus.SKIPPED.value
        elapsed = request.elapsed_break_seconds if request.completed else 0

        updates = {
            "completed": request.completed,
            "status": status_val,
            "acknowledged_at": now_iso,
            "duration_seconds": elapsed,
            "user_feedback": request.user_feedback or ""
        }
        doc_ref.update(updates)
        break_data.update(updates)

        # If completed, increment breaks_completed on session
        if request.completed:
            session_ref = self.db.collection(self.session_col).document(break_data["session_id"])
            s_doc = session_ref.get()
            if s_doc.exists:
                c = s_doc.to_dict().get("breaks_completed", 0)
                session_ref.update({"breaks_completed": c + 1})

        return BreakEventResponse(
            id=doc.id,
            session_id=break_data["session_id"],
            user_id=user_id,
            prompted_at=break_data["prompted_at"],
            acknowledged_at=now_iso,
            completed=request.completed,
            status=BreakComplianceStatus(status_val),
            duration_seconds=elapsed
        )

    def get_user_breaks(self, user_id: str, limit: int = 50) -> List[BreakEventResponse]:
        docs = self.db.collection(self.collection_name)\
            .where("user_id", "==", user_id)\
            .order_by("prompted_at", direction="DESCENDING")\
            .limit(limit)\
            .stream()

        results = []
        for d in docs:
            b = d.to_dict()
            results.append(BreakEventResponse(
                id=d.id,
                session_id=b["session_id"],
                user_id=b["user_id"],
                prompted_at=b["prompted_at"],
                acknowledged_at=b.get("acknowledged_at"),
                completed=b.get("completed", False),
                status=BreakComplianceStatus(b.get("status", "PENDING")),
                duration_seconds=b.get("duration_seconds", 20)
            ))
        return results

    def get_break_statistics(self, user_id: str) -> BreakStatsResponse:
        docs = self.db.collection(self.collection_name)\
            .where("user_id", "==", user_id)\
            .order_by("prompted_at", direction="ASCENDING")\
            .stream()

        total_prompted = 0
        total_completed = 0
        total_skipped = 0
        current_streak = 0
        best_streak = 0

        for d in docs:
            b = d.to_dict()
            total_prompted += 1
            if b.get("completed") is True:
                total_completed += 1
                current_streak += 1
                if current_streak > best_streak:
                    best_streak = current_streak
            else:
                total_skipped += 1
                current_streak = 0

        rate = (total_completed / total_prompted * 100.0) if total_prompted > 0 else 0.0

        return BreakStatsResponse(
            total_prompted=total_prompted,
            total_completed=total_completed,
            total_skipped=total_skipped,
            compliance_rate_percent=round(rate, 1),
            current_streak=current_streak,
            best_streak=best_streak
        )

break_service = BreakService()
