def test_start_session(client, test_user):
    payload = {
        "client_info": "Chrome 120 on Windows 11",
        "break_interval_minutes": 20,
        "notes": "Coding innovation challenge"
    }
    res = client.post("/api/v1/sessions/start", json=payload, headers=test_user["headers"])
    assert res.status_code == 201
    data = res.json()
    assert data["status"] == "ACTIVE"
    assert data["user_id"] == test_user["user"]["id"]
    assert data["total_duration_seconds"] == 0

def test_heartbeat_and_break_due_trigger(client, test_user):
    # Start session
    start_res = client.post(
        "/api/v1/sessions/start",
        json={"break_interval_minutes": 20},
        headers=test_user["headers"]
    )
    session_id = start_res.json()["id"]

    # Heartbeat 1 (60s active)
    hb_res1 = client.post(
        "/api/v1/sessions/heartbeat",
        json={"session_id": session_id, "active_seconds_delta": 60, "is_window_focused": True},
        headers=test_user["headers"]
    )
    assert hb_res1.status_code == 200
    assert hb_res1.json()["total_duration_seconds"] == 60
    assert hb_res1.json()["active_duration_seconds"] == 60
    assert hb_res1.json()["is_break_due"] is False

    # Simulate accumulated 20 minutes (1200 seconds)
    hb_res2 = client.post(
        "/api/v1/sessions/heartbeat",
        json={"session_id": session_id, "active_seconds_delta": 1140, "is_window_focused": True},
        headers=test_user["headers"]
    )
    assert hb_res2.status_code == 200
    assert hb_res2.json()["active_duration_seconds"] == 1200
    assert hb_res2.json()["is_break_due"] is True

def test_pause_and_resume_session(client, test_user):
    start_res = client.post(
        "/api/v1/sessions/start",
        json={"break_interval_minutes": 20},
        headers=test_user["headers"]
    )
    session_id = start_res.json()["id"]

    # Pause
    pause_res = client.post(
        "/api/v1/sessions/pause-resume",
        json={"session_id": session_id, "action": "pause"},
        headers=test_user["headers"]
    )
    assert pause_res.status_code == 200
    assert pause_res.json()["status"] == "PAUSED"

    # Resume
    resume_res = client.post(
        "/api/v1/sessions/pause-resume",
        json={"session_id": session_id, "action": "resume"},
        headers=test_user["headers"]
    )
    assert resume_res.status_code == 200
    assert resume_res.json()["status"] == "ACTIVE"

def test_stop_session(client, test_user):
    start_res = client.post(
        "/api/v1/sessions/start",
        json={"break_interval_minutes": 20},
        headers=test_user["headers"]
    )
    session_id = start_res.json()["id"]

    stop_res = client.post(
        "/api/v1/sessions/stop",
        json={"session_id": session_id, "final_notes": "Completed session"},
        headers=test_user["headers"]
    )
    assert stop_res.status_code == 200
    assert stop_res.json()["status"] == "COMPLETED"
    assert stop_res.json()["end_time"] is not None

def test_session_history(client, test_user):
    # Create two sessions
    client.post("/api/v1/sessions/start", json={"break_interval_minutes": 20}, headers=test_user["headers"])
    client.post("/api/v1/sessions/start", json={"break_interval_minutes": 25}, headers=test_user["headers"])

    hist_res = client.get("/api/v1/sessions/history", headers=test_user["headers"])
    assert hist_res.status_code == 200
    data = hist_res.json()
    assert data["total"] == 2
    assert len(data["sessions"]) == 2
