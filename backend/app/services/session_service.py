import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from app.core.firebase import get_firestore_client
from app.models.session import (
    SessionStartRequest,
    SessionHeartbeatRequest,
    SessionStopRequest,
    SessionResponse,
    SessionStatusEnum,
    SessionListResponse
)

class SessionService:
    def __init__(self):
        self.collection_name = "screen_sessions"

    @property
    def db(self):
        return get_firestore_client()

    def get_active_session_for_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Find any currently ACTIVE or PAUSED session for this user."""
        docs = self.db.collection(self.collection_name)\
            .where("user_id", "==", user_id)\
            .where("status", "in", [SessionStatusEnum.ACTIVE.value, SessionStatusEnum.PAUSED.value])\
            .stream()
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            return data
        return None

    def start_session(self, user_id: str, request: SessionStartRequest) -> SessionResponse:
        """Start a new monitoring session. Cleanly completes any existing active session to avoid duplicates."""
        existing = self.get_active_session_for_user(user_id)
        now_iso = datetime.now(timezone.utc).isoformat()
        
        if existing:
            # Auto-complete existing session gracefully
            self.stop_session(
                user_id=user_id,
                request=SessionStopRequest(
                    session_id=existing["id"],
                    final_notes="Auto-completed due to new session initiation"
                )
            )

        session_id = str(uuid.uuid4())
        break_interval = request.break_interval_minutes or 20

        session_doc = {
            "user_id": user_id,
            "client_info": request.client_info or "Web Browser",
            "start_time": now_iso,
            "end_time": None,
            "status": SessionStatusEnum.ACTIVE.value,
            "total_duration_seconds": 0,
            "active_duration_seconds": 0,
            "breaks_prompted": 0,
            "breaks_completed": 0,
            "last_heartbeat": now_iso,
            "break_interval_minutes": break_interval,
            "notes": request.notes or ""
        }

        self.db.collection(self.collection_name).document(session_id).set(session_doc)

        return SessionResponse(
            id=session_id,
            user_id=user_id,
            start_time=now_iso,
            end_time=None,
            status=SessionStatusEnum.ACTIVE,
            total_duration_seconds=0,
            active_duration_seconds=0,
            breaks_prompted=0,
            breaks_completed=0,
            last_heartbeat=now_iso,
            break_interval_minutes=break_interval,
            is_break_due=False
        )

    def record_heartbeat(self, user_id: str, request: SessionHeartbeatRequest) -> SessionResponse:
        doc_ref = self.db.collection(self.collection_name).document(request.session_id)
        doc = doc_ref.get()

        if not doc.exists:
            raise ValueError("Session not found.")

        session_data = doc.to_dict()
        if session_data.get("user_id") != user_id:
            raise PermissionError("Access forbidden: session belongs to another user.")

        if session_data.get("status") != SessionStatusEnum.ACTIVE.value:
            raise ValueError(f"Cannot record heartbeat for a session in {session_data.get('status')} state.")

        delta = request.active_seconds_delta
        current_total = session_data.get("total_duration_seconds", 0) + delta
        current_active = session_data.get("active_duration_seconds", 0) + (delta if request.is_window_focused else 0)
        
        now_iso = datetime.now(timezone.utc).isoformat()
        break_interval_sec = session_data.get("break_interval_minutes", 20) * 60
        
        # Check if 20-min break threshold has been reached since last break
        breaks_prompted = session_data.get("breaks_prompted", 0)
        expected_breaks = current_active // break_interval_sec
        is_break_due = expected_breaks > breaks_prompted

        updates = {
            "total_duration_seconds": current_total,
            "active_duration_seconds": current_active,
            "last_heartbeat": now_iso
        }
        doc_ref.update(updates)
        session_data.update(updates)

        return SessionResponse(
            id=doc.id,
            user_id=user_id,
            start_time=session_data["start_time"],
            end_time=session_data.get("end_time"),
            status=SessionStatusEnum(session_data["status"]),
            total_duration_seconds=current_total,
            active_duration_seconds=current_active,
            breaks_prompted=session_data.get("breaks_prompted", 0),
            breaks_completed=session_data.get("breaks_completed", 0),
            last_heartbeat=now_iso,
            break_interval_minutes=session_data.get("break_interval_minutes", 20),
            is_break_due=is_break_due
        )

    def set_pause_resume(self, user_id: str, session_id: str, action: str) -> SessionResponse:
        doc_ref = self.db.collection(self.collection_name).document(session_id)
        doc = doc_ref.get()

        if not doc.exists:
            raise ValueError("Session not found.")

        session_data = doc.to_dict()
        if session_data.get("user_id") != user_id:
            raise PermissionError("Access forbidden.")

        if action.lower() == "pause":
            new_status = SessionStatusEnum.PAUSED.value
        elif action.lower() == "resume":
            new_status = SessionStatusEnum.ACTIVE.value
        else:
            raise ValueError("Action must be either 'pause' or 'resume'.")

        doc_ref.update({
            "status": new_status,
            "last_heartbeat": datetime.now(timezone.utc).isoformat()
        })
        session_data["status"] = new_status

        return SessionResponse(
            id=doc.id,
            user_id=user_id,
            start_time=session_data["start_time"],
            end_time=session_data.get("end_time"),
            status=SessionStatusEnum(new_status),
            total_duration_seconds=session_data.get("total_duration_seconds", 0),
            active_duration_seconds=session_data.get("active_duration_seconds", 0),
            breaks_prompted=session_data.get("breaks_prompted", 0),
            breaks_completed=session_data.get("breaks_completed", 0),
            last_heartbeat=session_data.get("last_heartbeat", datetime.now(timezone.utc).isoformat()),
            break_interval_minutes=session_data.get("break_interval_minutes", 20),
            is_break_due=False
        )

    def stop_session(self, user_id: str, request: SessionStopRequest) -> SessionResponse:
        doc_ref = self.db.collection(self.collection_name).document(request.session_id)
        doc = doc_ref.get()

        if not doc.exists:
            raise ValueError("Session not found.")

        session_data = doc.to_dict()
        if session_data.get("user_id") != user_id:
            raise PermissionError("Access forbidden.")

        now_iso = datetime.now(timezone.utc).isoformat()
        updates = {
            "status": SessionStatusEnum.COMPLETED.value,
            "end_time": now_iso,
            "notes": request.final_notes or session_data.get("notes", "")
        }
        doc_ref.update(updates)
        session_data.update(updates)

        return SessionResponse(
            id=doc.id,
            user_id=user_id,
            start_time=session_data["start_time"],
            end_time=now_iso,
            status=SessionStatusEnum.COMPLETED,
            total_duration_seconds=session_data.get("total_duration_seconds", 0),
            active_duration_seconds=session_data.get("active_duration_seconds", 0),
            breaks_prompted=session_data.get("breaks_prompted", 0),
            breaks_completed=session_data.get("breaks_completed", 0),
            last_heartbeat=now_iso,
            break_interval_minutes=session_data.get("break_interval_minutes", 20),
            is_break_due=False
        )

    def get_user_history(self, user_id: str, limit: int = 50) -> SessionListResponse:
        docs = self.db.collection(self.collection_name)\
            .where("user_id", "==", user_id)\
            .order_by("start_time", direction="DESCENDING")\
            .limit(limit)\
            .stream()

        sessions = []
        for doc in docs:
            d = doc.to_dict()
            sessions.append(SessionResponse(
                id=doc.id,
                user_id=d["user_id"],
                start_time=d["start_time"],
                end_time=d.get("end_time"),
                status=SessionStatusEnum(d.get("status", "COMPLETED")),
                total_duration_seconds=d.get("total_duration_seconds", 0),
                active_duration_seconds=d.get("active_duration_seconds", 0),
                breaks_prompted=d.get("breaks_prompted", 0),
                breaks_completed=d.get("breaks_completed", 0),
                last_heartbeat=d.get("last_heartbeat", d["start_time"]),
                break_interval_minutes=d.get("break_interval_minutes", 20),
                is_break_due=False
            ))

        return SessionListResponse(total=len(sessions), sessions=sessions)

session_service = SessionService()
