def test_get_assessment_questions(client):
    res = client.get("/api/v1/assessment/questions")
    assert res.status_code == 200
    data = res.json()
    assert data["total_questions"] == 7
    assert len(data["questions"]) == 7
    assert "Educational Self-Assessment" in data["disclaimer"]

def test_submit_assessment_and_scoring(client, test_user):
    # Fetch questions to get valid question IDs
    q_res = client.get("/api/v1/assessment/questions").json()
    questions = q_res["questions"]

    # Build 7 answers (mixture of mild and zero points)
    answers = [
        {"question_id": q["id"], "selected_option_index": 1}
        for q in questions
    ]

    res = client.post(
        "/api/v1/assessment/submit",
        json={"answers": answers},
        headers=test_user["headers"]
    )
    assert res.status_code == 201
    data = res.json()
    assert data["raw_score"] == 7
    assert data["max_score"] == 21
    assert data["strain_index_percent"] == 33.3
    assert "Mild Digital Strain Risk" in data["awareness_grade"]
    assert len(data["recommendations"]) > 0
    assert "does not replace professional consultation" in data["medical_disclaimer"]

def test_assessment_history(client, test_user):
    q_res = client.get("/api/v1/assessment/questions").json()
    answers = [{"question_id": q["id"], "selected_option_index": 0} for q in q_res["questions"]]

    client.post("/api/v1/assessment/submit", json={"answers": answers}, headers=test_user["headers"])

    hist = client.get("/api/v1/assessment/history", headers=test_user["headers"])
    assert hist.status_code == 200
    assert hist.json()["total"] == 1
