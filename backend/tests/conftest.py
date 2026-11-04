import pytest
import os
import sys

# Ensure backend root is in sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from fastapi.testclient import TestClient
from app.main import app
from app.core.firebase import reset_mock_db

@pytest.fixture(autouse=True)
def reset_database():
    """Reset the mock database before every test for clean isolation."""
    reset_mock_db()

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def test_user(client):
    """Register a standard test user and return auth headers and user info."""
    user_data = {
        "email": "student@dhruva.edu",
        "password": "SecurePassword123!",
        "full_name": "Arjun Sharma",
        "preferences": {
            "break_interval_minutes": 20,
            "break_duration_seconds": 20,
            "sound_enabled": True,
            "browser_notifications": True,
            "target_daily_screen_hours": 6.0
        }
    }
    response = client.post("/api/v1/auth/register", json=user_data)
    assert response.status_code == 201
    data = response.json()
    token = data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    return {
        "headers": headers,
        "token": token,
        "user": data["user"]
    }
