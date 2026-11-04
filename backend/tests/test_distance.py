def test_check_distance_safe_zone(client, test_user):
    payload = {
        "reported_distance_cm": 60.0,
        "screen_diagonal_inches": 15.6,
        "workstation_type": "LAPTOP"
    }
    res = client.post("/api/v1/distance/check", json=payload, headers=test_user["headers"])
    assert res.status_code == 201
    data = res.json()
    assert data["zone"] == "OPTIMAL"
    assert "Optimal" in data["status_label"]
    assert "Educational Guidance Only" in data["disclaimer"]

def test_check_distance_danger_zone(client, test_user):
    payload = {
        "reported_distance_cm": 30.0,
        "screen_diagonal_inches": 15.6,
        "workstation_type": "LAPTOP"
    }
    res = client.post("/api/v1/distance/check", json=payload, headers=test_user["headers"])
    assert res.status_code == 201
    data = res.json()
    assert data["zone"] == "DANGER_TOO_CLOSE"
    assert "Dangerously Close" in data["status_label"]
    assert "ciliary muscles" in data["educational_guidance"].lower()

def test_distance_history(client, test_user):
    client.post("/api/v1/distance/check", json={"reported_distance_cm": 55.0}, headers=test_user["headers"])
    client.post("/api/v1/distance/check", json={"reported_distance_cm": 32.0}, headers=test_user["headers"])

    hist = client.get("/api/v1/distance/history", headers=test_user["headers"])
    assert hist.status_code == 200
    assert hist.json()["total_checks"] == 2
