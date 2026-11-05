import os
import sys
import pytest

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.core.firebase import reset_mock_db
from app.services.camera_wellness_service import camera_wellness_service
from app.models.camera_wellness import CameraWellnessSummaryCreate

@pytest.fixture(autouse=True)
def clean_db():
    reset_mock_db()

def test_camera_wellness_save_with_consent():
    user_id = "user-test-123"
    req = CameraWellnessSummaryCreate(
        session_duration_seconds=60,
        approximate_blink_count=15,
        blinks_per_minute=15.0,
        face_visibility_summary="Consistently visible throughout session",
        relative_position_summary="Comfortable apparent distance",
        lighting_summary="Good illumination",
        user_consent=True
    )

    res = camera_wellness_service.save_summary(user_id=user_id, request=req)

    assert res.id is not None
    assert res.user_id == user_id
    assert res.approximate_blink_count == 15
    assert res.blinks_per_minute == 15.0
    assert res.user_consent is True
    assert len(res.educational_tips) > 0
    assert "basic eye wellness awareness only" in res.disclaimer

    # Verify latest retrieval
    latest = camera_wellness_service.get_latest(user_id=user_id)
    assert latest is not None
    assert latest.id == res.id
    assert latest.approximate_blink_count == 15

    # Verify history
    history = camera_wellness_service.get_history(user_id=user_id)
    assert history.total_summaries == 1
    assert history.summaries[0].id == res.id

def test_camera_wellness_save_without_consent():
    user_id = "user-no-consent"
    req = CameraWellnessSummaryCreate(
        session_duration_seconds=45,
        approximate_blink_count=8,
        face_visibility_summary="Visible",
        relative_position_summary="Relatively close to camera",
        lighting_summary="Low lighting",
        user_consent=False
    )

    res = camera_wellness_service.save_summary(user_id=user_id, request=req)

    # Educational response is still provided to user
    assert res.approximate_blink_count == 8
    assert res.user_consent is False
    assert any("arm's length" in tip.lower() for tip in res.educational_tips)

    # But not persisted in Firestore
    latest = camera_wellness_service.get_latest(user_id=user_id)
    assert latest is None

    history = camera_wellness_service.get_history(user_id=user_id)
    assert history.total_summaries == 0

import pytest
from app.api.v1.endpoints.camera_wellness import (
    save_camera_wellness_summary,
    get_latest_camera_wellness_summary,
    get_camera_wellness_history
)
from app.models.user import UserResponse

def test_camera_wellness_endpoints():
    mock_user = UserResponse(
        id="user-endpoint-test",
        email="user@test.org",
        full_name="Endpoint Tester",
        is_active=True,
        created_at="2026-11-05T00:00:00Z",
        preferences={}
    )
    req = CameraWellnessSummaryCreate(
        session_duration_seconds=30,
        approximate_blink_count=6,
        face_visibility_summary="Fully detected",
        relative_position_summary="Well positioned",
        user_consent=True
    )

    # Test POST
    res = save_camera_wellness_summary(request=req, current_user=mock_user)
    assert res.user_id == mock_user.id
    assert res.approximate_blink_count == 6

    # Test GET latest
    latest = get_latest_camera_wellness_summary(current_user=mock_user)
    assert latest is not None
    assert latest.id == res.id

    # Test GET history
    history = get_camera_wellness_history(limit=5, current_user=mock_user)
    assert history.total_summaries == 1
    assert history.summaries[0].id == res.id
