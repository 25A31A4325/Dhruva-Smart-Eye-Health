def test_daily_summary(client, test_user):
    # Perform a session and distance check to generate real telemetry
    start_res = client.post("/api/v1/sessions/start", json={"break_interval_minutes": 20}, headers=test_user["headers"])
    session_id = start_res.json()["id"]

    client.post(
        "/api/v1/sessions/heartbeat",
        json={"session_id": session_id, "active_seconds_delta": 300, "is_window_focused": True},
        headers=test_user["headers"]
    )
    client.post("/api/v1/distance/check", json={"reported_distance_cm": 58.0}, headers=test_user["headers"])

    res = client.get("/api/v1/analytics/daily-summary", headers=test_user["headers"])
    assert res.status_code == 200
    data = res.json()
    assert data["total_screen_seconds"] == 300
    assert data["distance_checks_performed"] == 1
    assert data["latest_distance_cm"] == 58.0
    assert data["eye_health_score"] >= 0.0

def test_weekly_trends(client, test_user):
    res = client.get("/api/v1/analytics/weekly-trends", headers=test_user["headers"])
    assert res.status_code == 200
    data = res.json()
    assert len(data["days"]) == 7
    assert "total_screen_time_hours" in data
    assert "average_eye_health_score" in data

def test_monthly_trends(client, test_user):
    res = client.get("/api/v1/analytics/monthly-trends", headers=test_user["headers"])
    assert res.status_code == 200
    data = res.json()
    assert "month_label" in data
    assert "total_screen_time_hours" in data
    assert len(data["weekly_breakdown"]) >= 1
