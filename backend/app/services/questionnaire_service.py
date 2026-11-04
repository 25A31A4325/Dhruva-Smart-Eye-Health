import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any
from app.core.firebase import get_firestore_client
from app.models.questionnaire import (
    QuestionItem,
    QuestionOption,
    QuestionnaireQuestionsResponse,
    QuestionnaireSubmitRequest,
    QuestionnaireResultResponse,
    QuestionnaireHistoryResponse,
    EducationalRecommendation
)

QUESTION_DATA: List[Dict[str, Any]] = [
    {
        "id": "q1_dryness",
        "category": "Ocular Surface & Tear Film",
        "question": "How often do you experience dry, gritty, or stinging sensations in your eyes during or after digital device use?",
        "explanation": "Blink rates plummet by up to 60% during screen immersion, evaporating the protective tear film layer.",
        "options": [
            {"label": "Never or rarely", "points": 0},
            {"label": "Occasionally (1-2 days/week)", "points": 1},
            {"label": "Frequently (3-5 days/week)", "points": 2},
            {"label": "Almost daily or constant", "points": 3}
        ]
    },
    {
        "id": "q2_headache",
        "category": "Ciliary Accommodation & Convergence",
        "question": "Do you notice brow ache or tension headaches radiating behind your eyes after extended computer or study sessions?",
        "explanation": "Continuous close-focus work overworks the ciliary muscle that flexes your eye's internal lens.",
        "options": [
            {"label": "Never", "points": 0},
            {"label": "Only after marathon sessions (>4 hours)", "points": 1},
            {"label": "Regularly by afternoon or evening", "points": 2},
            {"label": "Severe or daily", "points": 3}
        ]
    },
    {
        "id": "q3_distance",
        "category": "Working Distance & Posture",
        "question": "What is your typical viewing distance between your eyes and your primary computer/laptop display?",
        "explanation": "Maintaining at least an arm's length (50-70 cm) significantly relieves ocular convergence stress.",
        "options": [
            {"label": "Comfortably at arm's length (55-70 cm)", "points": 0},
            {"label": "Slightly close (45-55 cm)", "points": 1},
            {"label": "Very close (<40 cm, leaning forward)", "points": 2},
            {"label": "Unaware / subconscious slouching very close", "points": 3}
        ]
    },
    {
        "id": "q4_breaks",
        "category": "Break Discipline (20-20-20 Rule)",
        "question": "How frequently do you take visual breaks to gaze into the distance (at least 20 feet away) while working?",
        "explanation": "The 20-20-20 rule prompts the ciliary muscles to fully relax to their natural infinity focal state.",
        "options": [
            {"label": "Consistently every 20-30 minutes", "points": 0},
            {"label": "Every hour or two", "points": 1},
            {"label": "Only when eye fatigue forces me to stop", "points": 2},
            {"label": "Almost never take intentional eye breaks", "points": 3}
        ]
    },
    {
        "id": "q5_lighting",
        "category": "Ambient Lighting & Glare",
        "question": "Is your digital display significantly brighter than your ambient room lighting, or do you work in dark rooms?",
        "explanation": "Extreme contrast between a bright monitor and dark surroundings forces the iris sphincter muscle to constantly oscillate.",
        "options": [
            {"label": "Well-balanced indirect lighting, no screen glare", "points": 0},
            {"label": "Mild glare or occasionally unbalanced lighting", "points": 1},
            {"label": "Frequently work with harsh overhead glare or window reflection", "points": 2},
            {"label": "Often work in pitch darkness with maximum screen brightness", "points": 3}
        ]
    },
    {
        "id": "q6_blur",
        "category": "Transient Visual Acuity",
        "question": "Do you experience temporary blurred vision when shifting focus from your screen to distant objects?",
        "explanation": "Accommodative spasm occurs when the ciliary muscle temporarily locks up after prolonged near-focus work.",
        "options": [
            {"label": "Never - focus shifts instantaneously", "points": 0},
            {"label": "Takes 2-3 seconds to refocus after long sessions", "points": 1},
            {"label": "Noticeable blur lasting several minutes", "points": 2},
            {"label": "Persistent blur requiring rubbing eyes", "points": 3}
        ]
    },
    {
        "id": "q7_blinking",
        "category": "Conscious Blink Dynamics",
        "question": "Do you practice conscious complete blinking or keep hydrating artificial tears nearby if needed?",
        "explanation": "Incomplete micro-blinks are common during reading, leaving the lower third of the cornea desiccated.",
        "options": [
            {"label": "Yes, highly conscious of blinking and ocular hydration", "points": 0},
            {"label": "Occasionally remember to blink fully", "points": 1},
            {"label": "Rarely think about blinking habits", "points": 2},
            {"label": "Never - experience severe eye redness/burning", "points": 3}
        ]
    }
]

class QuestionnaireService:
    def __init__(self):
        self.collection_name = "questionnaire_responses"

    @property
    def db(self):
        return get_firestore_client()

    def get_questions(self) -> QuestionnaireQuestionsResponse:
        questions_list = []
        for q in QUESTION_DATA:
            opts = [QuestionOption(label=o["label"], points=o["points"]) for o in q["options"]]
            questions_list.append(QuestionItem(
                id=q["id"],
                category=q["category"],
                question=q["question"],
                explanation=q["explanation"],
                options=opts
            ))

        return QuestionnaireQuestionsResponse(
            version="1.0",
            total_questions=len(questions_list),
            disclaimer=(
                "Educational Self-Assessment: This tool evaluates behavioral habits and self-reported "
                "symptoms of digital eye strain. It is not an ophthalmic clinical diagnosis."
            ),
            questions=questions_list
        )

    def evaluate_submission(self, user_id: str, request: QuestionnaireSubmitRequest) -> QuestionnaireResultResponse:
        q_map = {q["id"]: q for q in QUESTION_DATA}
        raw_score = 0
        max_possible_score = len(QUESTION_DATA) * 3 # 21 points
        recommendations: List[EducationalRecommendation] = []

        for item in request.answers:
            q_def = q_map.get(item.question_id)
            if not q_def:
                raise ValueError(f"Unknown question ID: {item.question_id}")
            
            if item.selected_option_index >= len(q_def["options"]):
                raise ValueError(f"Invalid option index for question {item.question_id}")

            selected_opt = q_def["options"][item.selected_option_index]
            points = selected_opt["points"]
            raw_score += points

            # Generate targeted educational guidance for high-score items
            if points >= 2:
                if "dryness" in item.question_id or "blinking" in item.question_id:
                    recommendations.append(EducationalRecommendation(
                        category="Tear Film Protection",
                        title="Practice Deliberate Full Blinking",
                        recommendation="Every 15 minutes, perform 5 slow, deliberate full-eyelid closures to redistribute meibomian oil across your cornea."
                    ))
                elif "distance" in item.question_id:
                    recommendations.append(EducationalRecommendation(
                        category="Ergonomic Distance",
                        title="Establish Arm's-Length Barrier",
                        recommendation="Push your display back to 50-70 cm. Extend your arm; your fingertips should just touch the screen surface."
                    ))
                elif "breaks" in item.question_id:
                    recommendations.append(EducationalRecommendation(
                        category="20-20-20 Habit",
                        title="Activate Dhruva Break Reminders",
                        recommendation="Enable automatic in-app and browser notifications to enforce 20-second distant gazing breaks every 20 minutes."
                    ))
                elif "lighting" in item.question_id:
                    recommendations.append(EducationalRecommendation(
                        category="Lighting Balance",
                        title="Eliminate High Contrast & Dark Room Working",
                        recommendation="Never work in pitch darkness. Ensure ambient light is soft and diffuse, roughly matching your screen's brightness."
                    ))

        # Percentage strain index (0% = perfect habits, 100% = high strain)
        strain_percent = round((raw_score / max_possible_score) * 100.0, 1)

        if strain_percent < 25.0:
            grade = "Low Digital Strain Risk"
            summary = "Commendable digital wellness habits! Your visual ergonomics and break routines are well within healthy limits."
        elif strain_percent < 50.0:
            grade = "Mild Digital Strain Risk"
            summary = "Mild symptoms detected. Minor adjustments to your viewing distance and conscious blink frequency will prevent chronic fatigue."
        elif strain_percent < 75.0:
            grade = "Moderate Digital Eye Strain Risk"
            summary = "Noticeable ocular fatigue indicators present. Prioritize the 20-20-20 rule and push your screen back to arm's length."
        else:
            grade = "Significant Strain Risk (Habit Intervention Recommended)"
            summary = "High frequency of eye strain symptoms reported. Strongly adopt mandatory hourly breaks, ergonomic distance, and consider having an optometric vision checkup."

        if not recommendations:
            recommendations.append(EducationalRecommendation(
                category="Maintenance",
                title="Sustain Current Habits",
                recommendation="Continue your excellent work-rest balance and maintain consistent workstation ergonomics."
            ))

        result_id = str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()

        doc_data = {
            "user_id": user_id,
            "timestamp": now_iso,
            "raw_score": raw_score,
            "max_score": max_possible_score,
            "strain_index_percent": strain_percent,
            "awareness_grade": grade,
            "summary_message": summary,
            "recommendations": [r.model_dump() for r in recommendations],
            "answers": [a.model_dump() for a in request.answers]
        }

        self.db.collection(self.collection_name).document(result_id).set(doc_data)

        return QuestionnaireResultResponse(
            id=result_id,
            user_id=user_id,
            timestamp=now_iso,
            raw_score=raw_score,
            max_score=max_possible_score,
            strain_index_percent=strain_percent,
            awareness_grade=grade,
            summary_message=summary,
            recommendations=recommendations
        )

    def get_user_history(self, user_id: str, limit: int = 10) -> QuestionnaireHistoryResponse:
        docs = self.db.collection(self.collection_name)\
            .where("user_id", "==", user_id)\
            .order_by("timestamp", direction="DESCENDING")\
            .limit(limit)\
            .stream()

        results = []
        for d in docs:
            data = d.to_dict()
            recs = [EducationalRecommendation(**r) for r in data.get("recommendations", [])]
            results.append(QuestionnaireResultResponse(
                id=d.id,
                user_id=data["user_id"],
                timestamp=data["timestamp"],
                raw_score=data["raw_score"],
                max_score=data["max_score"],
                strain_index_percent=data["strain_index_percent"],
                awareness_grade=data["awareness_grade"],
                summary_message=data["summary_message"],
                recommendations=recs
            ))

        return QuestionnaireHistoryResponse(total=len(results), history=results)

questionnaire_service = QuestionnaireService()
