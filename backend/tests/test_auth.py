def test_register_user_success(client):
    payload = {
        "email": "innovator@swasth.org",
        "password": "Password789!",
        "full_name": "Priya Patel"
    }
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "innovator@swasth.org"
    assert data["user"]["full_name"] == "Priya Patel"
    assert data["user"]["preferences"]["break_interval_minutes"] == 20

def test_register_duplicate_email_fails(client, test_user):
    payload = {
        "email": "student@dhruva.edu", # already registered in fixture
        "password": "AnotherPassword123",
        "full_name": "Duplicate User"
    }
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 400
    assert "already registered" in res.json()["detail"]

def test_login_success(client, test_user):
    payload = {
        "email": "student@dhruva.edu",
        "password": "SecurePassword123!"
    }
    res = client.post("/api/v1/auth/login", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "student@dhruva.edu"

def test_login_invalid_password_fails(client, test_user):
    payload = {
        "email": "student@dhruva.edu",
        "password": "WrongPassword!"
    }
    res = client.post("/api/v1/auth/login", json=payload)
    assert res.status_code == 401
    assert "Invalid email or password" in res.json()["detail"]

def test_get_current_user_profile(client, test_user):
    res = client.get("/api/v1/auth/me", headers=test_user["headers"])
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "student@dhruva.edu"
    assert data["full_name"] == "Arjun Sharma"

def test_update_user_preferences(client, test_user):
    updates = {
        "break_interval_minutes": 25,
        "sound_enabled": False,
        "target_daily_screen_hours": 7.5
    }
    res = client.put("/api/v1/auth/preferences", json=updates, headers=test_user["headers"])
    assert res.status_code == 200
    data = res.json()
    assert data["break_interval_minutes"] == 25
    assert data["sound_enabled"] is False
    assert data["target_daily_screen_hours"] == 7.5
