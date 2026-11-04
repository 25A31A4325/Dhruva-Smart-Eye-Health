"""
Full End-to-End Integration Test Suite for Dhruva
Verifies complete client-server interactions, data model contracts,
authentication gates, user isolation, and ergonomic calculations.
"""

import sys
import os
import unittest
from fastapi.testclient import TestClient

# Ensure backend root is in sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.main import app
from app.core.firebase import reset_mock_db

class TestDhruvaIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        reset_mock_db()
        cls.client = TestClient(app)

    def test_01_health_and_root(self):
        res_root = self.client.get("/")
        self.assertEqual(res_root.status_code, 200)
        self.assertEqual(res_root.json()["project"], "Dhruva")
        self.assertEqual(res_root.json()["status"], "OPERATIONAL")

        res_health = self.client.get("/health")
        self.assertEqual(res_health.status_code, 200)
        self.assertEqual(res_health.json()["status"], "healthy")

    def test_02_registration_validation_and_duplicate(self):
        # 1. Invalid short password
        short_res = self.client.post("/api/v1/auth/register", json={
            "full_name": "Test User",
            "email": "invalid@test.com",
            "password": "123" # too short
        })
        self.assertEqual(short_res.status_code, 422)

        # 2. Valid Registration
        reg_res = self.client.post("/api/v1/auth/register", json={
            "full_name": "Arjun Sharma",
            "email": "arjun@dhruva.org",
            "password": "SecurePassword123!"
        })
        self.assertEqual(reg_res.status_code, 201)
        data = reg_res.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["user"]["email"], "arjun@dhruva.org")
        self.assertEqual(data["user"]["preferences"]["break_interval_minutes"], 20)

        # 3. Duplicate Registration Rejection
        dup_res = self.client.post("/api/v1/auth/register", json={
            "full_name": "Arjun Sharma",
            "email": "arjun@dhruva.org",
            "password": "AnotherPassword456"
        })
        self.assertEqual(dup_res.status_code, 400)
        self.assertIn("already registered", dup_res.json()["detail"])

    def test_03_login_and_token_handling(self):
        # Register user for this test to ensure idempotence
        self.client.post("/api/v1/auth/register", json={
            "full_name": "Arjun Sharma",
            "email": "arjun@dhruva.org",
            "password": "SecurePassword123!"
        })

        # Invalid credentials
        bad_res = self.client.post("/api/v1/auth/login", json={
            "email": "arjun@dhruva.org",
            "password": "WrongPassword!"
        })
        self.assertEqual(bad_res.status_code, 401)

        # Valid login
        login_res = self.client.post("/api/v1/auth/login", json={
            "email": "arjun@dhruva.org",
            "password": "SecurePassword123!"
        })
        self.assertEqual(login_res.status_code, 200)
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Profile fetch
        me_res = self.client.get("/api/v1/auth/me", headers=headers)
        self.assertEqual(me_res.status_code, 200)
        self.assertEqual(me_res.json()["full_name"], "Arjun Sharma")

        # Protected route rejection without token
        unauth_res = self.client.get("/api/v1/auth/me")
        self.assertEqual(unauth_res.status_code, 401)

        # Update preferences
        pref_res = self.client.put("/api/v1/auth/preferences", json={
            "break_interval_minutes": 25,
            "sound_enabled": False,
            "target_daily_screen_hours": 7.0
        }, headers=headers)
        self.assertEqual(pref_res.status_code, 200)
        self.assertEqual(pref_res.json()["break_interval_minutes"], 25)
        self.assertFalse(pref_res.json()["sound_enabled"])

    def test_04_session_lifecycle_and_visibility(self):
        # Register a second distinct user to verify isolation
        reg_res = self.client.post("/api/v1/auth/register", json={
            "full_name": "Priya Patel",
            "email": "priya@dhruva.org",
            "password": "SecurePassword456!"
        })
        token = reg_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Start session
        start_res = self.client.post("/api/v1/sessions/start", json={
            "client_info": "Chrome on Windows",
            "break_interval_minutes": 20,
            "notes": "Research sprint"
        }, headers=headers)
        self.assertEqual(start_res.status_code, 201)
        session_id = start_res.json()["id"]
        self.assertEqual(start_res.json()["status"], "ACTIVE")

        # Heartbeat 1 (Focused: 60s active)
        hb1 = self.client.post("/api/v1/sessions/heartbeat", json={
            "session_id": session_id,
            "active_seconds_delta": 60,
            "is_window_focused": True
        }, headers=headers)
        self.assertEqual(hb1.status_code, 200)
        self.assertEqual(hb1.json()["total_duration_seconds"], 60)
        self.assertEqual(hb1.json()["active_duration_seconds"], 60)
        self.assertFalse(hb1.json()["is_break_due"])

        # Heartbeat 2 (Unfocused / Blurred tab: 60s total, 0s active increment)
        hb2 = self.client.post("/api/v1/sessions/heartbeat", json={
            "session_id": session_id,
            "active_seconds_delta": 60,
            "is_window_focused": False
        }, headers=headers)
        self.assertEqual(hb2.status_code, 200)
        self.assertEqual(hb2.json()["total_duration_seconds"], 120)
        self.assertEqual(hb2.json()["active_duration_seconds"], 60) # remains 60!

        # Pause and Resume
        p_res = self.client.post("/api/v1/sessions/pause-resume", json={
            "session_id": session_id,
            "action": "pause"
        }, headers=headers)
        self.assertEqual(p_res.status_code, 200)
        self.assertEqual(p_res.json()["status"], "PAUSED")

        r_res = self.client.post("/api/v1/sessions/pause-resume", json={
            "session_id": session_id,
            "action": "resume"
        }, headers=headers)
        self.assertEqual(r_res.status_code, 200)
        self.assertEqual(r_res.json()["status"], "ACTIVE")

        # Stop session
        stop_res = self.client.post("/api/v1/sessions/stop", json={
            "session_id": session_id,
            "final_notes": "Completed successfully"
        }, headers=headers)
        self.assertEqual(stop_res.status_code, 200)
        self.assertEqual(stop_res.json()["status"], "COMPLETED")

        # History check
        hist_res = self.client.get("/api/v1/sessions/history", headers=headers)
        self.assertEqual(hist_res.status_code, 200)
        self.assertEqual(hist_res.json()["total"], 1)

    def test_05_20_20_20_break_flow(self):
        # Create session
        reg = self.client.post("/api/v1/auth/register", json={
            "full_name": "Break Tester",
            "email": "break@dhruva.org",
            "password": "Password123!"
        }).json()
        headers = {"Authorization": f"Bearer {reg['access_token']}"}

        start = self.client.post("/api/v1/sessions/start", json={"break_interval_minutes": 20}, headers=headers).json()
        session_id = start["id"]

        # Prompt 1: Complete
        p1 = self.client.post("/api/v1/breaks/log-prompt", json={"session_id": session_id}, headers=headers).json()
        self.assertEqual(p1["status"], "PENDING")
        ack1 = self.client.post("/api/v1/breaks/acknowledge", json={
            "break_id": p1["id"],
            "completed": True,
            "elapsed_break_seconds": 20
        }, headers=headers).json()
        self.assertEqual(ack1["status"], "COMPLETED")

        # Prompt 2: Skip
        p2 = self.client.post("/api/v1/breaks/log-prompt", json={"session_id": session_id}, headers=headers).json()
        ack2 = self.client.post("/api/v1/breaks/acknowledge", json={
            "break_id": p2["id"],
            "completed": False,
            "elapsed_break_seconds": 0
        }, headers=headers).json()
        self.assertEqual(ack2["status"], "SKIPPED")

        # Stats check
        stats = self.client.get("/api/v1/breaks/stats", headers=headers).json()
        self.assertEqual(stats["total_prompted"], 2)
        self.assertEqual(stats["total_completed"], 1)
        self.assertEqual(stats["total_skipped"], 1)
        self.assertEqual(stats["compliance_rate_percent"], 50.0)

    def test_06_distance_ergonomic_classification(self):
        reg = self.client.post("/api/v1/auth/register", json={
            "full_name": "Ergonomics Tester",
            "email": "ergo@dhruva.org",
            "password": "Password123!"
        }).json()
        headers = {"Authorization": f"Bearer {reg['access_token']}"}

        # 1. Optimal (60cm)
        d_opt = self.client.post("/api/v1/distance/check", json={
            "reported_distance_cm": 60.0,
            "screen_diagonal_inches": 15.6,
            "workstation_type": "LAPTOP"
        }, headers=headers).json()
        self.assertEqual(d_opt["zone"], "OPTIMAL")
        self.assertIn("Optimal Ergonomic Safe Zone", d_opt["status_label"])
        self.assertIn("Educational Guidance Only", d_opt["disclaimer"])

        # 2. Danger (<35cm)
        d_dan = self.client.post("/api/v1/distance/check", json={
            "reported_distance_cm": 30.0,
            "screen_diagonal_inches": 15.6
        }, headers=headers).json()
        self.assertEqual(d_dan["zone"], "DANGER_TOO_CLOSE")
        self.assertIn("Dangerously Close", d_dan["status_label"])
        self.assertIn("ciliary", d_dan["educational_guidance"].lower())

    def test_07_questionnaire_scoring_and_medical_disclaimer(self):
        # Fetch 7 questions
        q_res = self.client.get("/api/v1/assessment/questions").json()
        self.assertEqual(q_res["total_questions"], 7)
        self.assertIn("Educational Self-Assessment", q_res["disclaimer"])
        questions = q_res["questions"]

        reg = self.client.post("/api/v1/auth/register", json={
            "full_name": "Survey Tester",
            "email": "survey@dhruva.org",
            "password": "Password123!"
        }).json()
        headers = {"Authorization": f"Bearer {reg['access_token']}"}

        # Incomplete submission rejection (only 6 answers)
        incomplete_res = self.client.post("/api/v1/assessment/submit", json={
            "answers": [{"question_id": q["id"], "selected_option_index": 0} for q in questions[:6]]
        }, headers=headers)
        self.assertEqual(incomplete_res.status_code, 422)

        # Complete 7-answer submission
        valid_answers = [{"question_id": q["id"], "selected_option_index": 2} for q in questions]
        sub_res = self.client.post("/api/v1/assessment/submit", json={"answers": valid_answers}, headers=headers)
        self.assertEqual(sub_res.status_code, 201)
        sub_data = sub_res.json()
        self.assertEqual(sub_data["raw_score"], 14)
        self.assertEqual(sub_data["max_score"], 21)
        self.assertEqual(sub_data["strain_index_percent"], 66.7)
        self.assertIn("Moderate Digital Eye Strain Risk", sub_data["awareness_grade"])
        self.assertIn("does not replace professional consultation", sub_data["medical_disclaimer"])
        self.assertTrue(len(sub_data["recommendations"]) > 0)

    def test_08_tips_and_daily_rotation(self):
        all_tips = self.client.get("/api/v1/tips").json()
        self.assertGreaterEqual(all_tips["total"], 7)
        self.assertIn("BREAKS", all_tips["categories"])

        daily = self.client.get("/api/v1/tips/daily").json()
        self.assertIn("tip", daily)
        self.assertIn("actionable_step", daily["tip"])
        self.assertIn("scientific_rationale", daily["tip"])

    def test_09_analytics_summaries_and_trends(self):
        reg = self.client.post("/api/v1/auth/register", json={
            "full_name": "Analytics Tester",
            "email": "analytics@dhruva.org",
            "password": "Password123!"
        }).json()
        headers = {"Authorization": f"Bearer {reg['access_token']}"}

        # Daily Summary
        ds = self.client.get("/api/v1/analytics/daily-summary", headers=headers).json()
        self.assertIn("total_screen_seconds", ds)
        self.assertIn("eye_health_score", ds)
        self.assertIn("break_compliance_percent", ds)

        # Weekly Trends
        wt = self.client.get("/api/v1/analytics/weekly-trends", headers=headers).json()
        self.assertEqual(len(wt["days"]), 7)
        self.assertIn("average_eye_health_score", wt)

        # Monthly Trends
        mt = self.client.get("/api/v1/analytics/monthly-trends", headers=headers).json()
        self.assertIn("month_label", mt)
        self.assertGreaterEqual(len(mt["weekly_breakdown"]), 1)

if __name__ == "__main__":
    unittest.main()
