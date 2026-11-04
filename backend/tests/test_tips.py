def test_get_all_tips(client):
    res = client.get("/api/v1/tips")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 7
    assert "BREAKS" in data["categories"]
    assert "DISTANCE" in data["categories"]

def test_get_daily_tip(client):
    res = client.get("/api/v1/tips/daily")
    assert res.status_code == 200
    data = res.json()
    assert "tip" in data
    assert "title" in data["tip"]
    assert "actionable_step" in data["tip"]
    assert "scientific_rationale" in data["tip"]
