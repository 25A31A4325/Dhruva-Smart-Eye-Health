def test_break_prompt_and_acknowledgment(client, test_user):
    # Start a session first
    start_res = client.post(
        "/api/v1/sessions/start",
        json={"break_interval_minutes": 20},
        headers=test_user["headers"]
    )
    session_id = start_res.json()["id"]

    # Log prompt
    prompt_res = client.post(
        "/api/v1/breaks/log-prompt",
        json={"session_id": session_id, "prompt_message": "Time for 20-20-20 break!"},
        headers=test_user["headers"]
    )
    assert prompt_res.status_code == 201
    break_id = prompt_res.json()["id"]
    assert prompt_res.json()["status"] == "PENDING"
    assert prompt_res.json()["completed"] is False

    # Acknowledge completed
    ack_res = client.post(
        "/api/v1/breaks/acknowledge",
        json={"break_id": break_id, "completed": True, "elapsed_break_seconds": 20},
        headers=test_user["headers"]
    )
    assert ack_res.status_code == 200
    assert ack_res.json()["status"] == "COMPLETED"
    assert ack_res.json()["completed"] is True

def test_break_statistics_and_streak(client, test_user):
    start_res = client.post("/api/v1/sessions/start", json={"break_interval_minutes": 20}, headers=test_user["headers"])
    session_id = start_res.json()["id"]

    # Prompt and complete 2 breaks
    for _ in range(2):
        p = client.post("/api/v1/breaks/log-prompt", json={"session_id": session_id}, headers=test_user["headers"]).json()
        client.post("/api/v1/breaks/acknowledge", json={"break_id": p["id"], "completed": True}, headers=test_user["headers"])

    # Prompt and skip 1 break
    p_skip = client.post("/api/v1/breaks/log-prompt", json={"session_id": session_id}, headers=test_user["headers"]).json()
    client.post("/api/v1/breaks/acknowledge", json={"break_id": p_skip["id"], "completed": False}, headers=test_user["headers"])

    stats_res = client.get("/api/v1/breaks/stats", headers=test_user["headers"])
    assert stats_res.status_code == 200
    data = stats_res.json()
    assert data["total_prompted"] == 3
    assert data["total_completed"] == 2
    assert data["total_skipped"] == 1
    assert data["best_streak"] == 2
    assert data["compliance_rate_percent"] == 66.7
