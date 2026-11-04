import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any
from app.core.firebase import get_firestore_client
from app.core.config import settings
from app.models.distance import (
    DistanceCheckRequest,
    DistanceCheckResponse,
    DistanceHistoryResponse,
    DistanceZoneCategory
)

class DistanceService:
    def __init__(self):
        self.collection_name = "distance_assessments"

    @property
    def db(self):
        return get_firestore_client()

    def evaluate_distance(self, user_id: str, request: DistanceCheckRequest) -> DistanceCheckResponse:
        dist = request.reported_distance_cm
        screen_diag = request.screen_diagonal_inches or 15.6

        # Dynamic ergonomic recommendation calculation based on screen diagonal
        # Rule of thumb: Distance should roughly be 1.5x to 2x the diagonal width in cm, or 50-75 cm standard
        if screen_diag <= 10.0: # Tablets / Mobiles
            rec_min = 35.0
            rec_max = 50.0
        elif screen_diag <= 17.0: # Laptops
            rec_min = 50.0
            rec_max = 70.0
        else: # Large Desktop Monitors (21"+)
            rec_min = 60.0
            rec_max = 85.0

        # Classify zone
        if dist < 35.0:
            zone = DistanceZoneCategory.DANGER_TOO_CLOSE
            status_label = "Dangerously Close"
            ciliary_strain = "Severe (Excessive Accommodation & Ciliary Muscle Spasm Risk)"
            guidance = (
                "Your reported distance is under 35 cm. Viewing digital displays this close forces "
                "the ciliary muscles of your crystalline lens to contract intensely, precipitating "
                "rapid ocular fatigue, headaches, and near-work digital myopia acceleration. "
                "Please push your device back to at least arm's length (50-65 cm)."
            )
        elif dist < rec_min:
            zone = DistanceZoneCategory.WARNING_CLOSE
            status_label = "Borderline Close"
            ciliary_strain = "Moderate to Elevated"
            guidance = (
                f"Your viewing distance ({dist} cm) is below the recommended minimum ({rec_min} cm) for a "
                f"{screen_diag}\" screen. Consider adjusting your chair height or monitor position to reach 50-70 cm."
            )
        elif dist <= rec_max:
            zone = DistanceZoneCategory.OPTIMAL
            status_label = "Optimal Ergonomic Safe Zone"
            ciliary_strain = "Low / Relaxed (Physiologically Balanced)"
            guidance = (
                f"Excellent ergonomic posture! Your distance of {dist} cm allows your eyes to focus with "
                "minimal continuous ciliary contraction. Maintain this comfortable arm's-length positioning."
            )
        else:
            zone = DistanceZoneCategory.TOO_FAR
            status_label = "Extended Viewing Distance"
            ciliary_strain = "Minimal, but verify font readability to avoid squinting"
            guidance = (
                f"You are viewing from {dist} cm. While this relaxes ocular convergence, ensure you are not "
                "squinting or craning your neck forward to read small text. Increase display scaling if needed."
            )

        check_id = str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()

        doc_data = {
            "user_id": user_id,
            "timestamp": now_iso,
            "reported_distance_cm": dist,
            "recommended_min_cm": rec_min,
            "recommended_max_cm": rec_max,
            "zone": zone.value,
            "status_label": status_label,
            "educational_guidance": guidance,
            "ciliary_strain_risk": ciliary_strain,
            "workstation_type": request.workstation_type or "LAPTOP",
            "screen_diagonal_inches": screen_diag
        }

        self.db.collection(self.collection_name).document(check_id).set(doc_data)

        return DistanceCheckResponse(
            id=check_id,
            user_id=user_id,
            timestamp=now_iso,
            reported_distance_cm=dist,
            recommended_min_cm=rec_min,
            recommended_max_cm=rec_max,
            zone=zone,
            status_label=status_label,
            educational_guidance=guidance,
            ciliary_strain_risk=ciliary_strain
        )

    def get_history(self, user_id: str, limit: int = 30) -> DistanceHistoryResponse:
        docs = self.db.collection(self.collection_name)\
            .where("user_id", "==", user_id)\
            .order_by("timestamp", direction="DESCENDING")\
            .limit(limit)\
            .stream()

        results = []
        for d in docs:
            data = d.to_dict()
            results.append(DistanceCheckResponse(
                id=d.id,
                user_id=data["user_id"],
                timestamp=data["timestamp"],
                reported_distance_cm=data["reported_distance_cm"],
                recommended_min_cm=data.get("recommended_min_cm", 50.0),
                recommended_max_cm=data.get("recommended_max_cm", 75.0),
                zone=DistanceZoneCategory(data.get("zone", DistanceZoneCategory.OPTIMAL.value)),
                status_label=data.get("status_label", "Checked"),
                educational_guidance=data.get("educational_guidance", ""),
                ciliary_strain_risk=data.get("ciliary_strain_risk", "Normal")
            ))

        return DistanceHistoryResponse(total_checks=len(results), checks=results)

distance_service = DistanceService()
