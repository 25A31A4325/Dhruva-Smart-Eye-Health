from pydantic import BaseModel, Field
from typing import List, Optional

class QuestionOption(BaseModel):
    label: str
    points: int = Field(ge=0, le=3, description="Higher points indicate higher frequency/severity of digital eye strain symptom")

class QuestionItem(BaseModel):
    id: str
    category: str
    question: str
    explanation: str
    options: List[QuestionOption]

class QuestionnaireQuestionsResponse(BaseModel):
    version: str = "1.0"
    total_questions: int
    disclaimer: str
    questions: List[QuestionItem]

class AnswerSubmissionItem(BaseModel):
    question_id: str
    selected_option_index: int = Field(ge=0, le=4)

class QuestionnaireSubmitRequest(BaseModel):
    answers: List[AnswerSubmissionItem] = Field(min_length=7, max_length=7, description="Exact 7 answers required")

class EducationalRecommendation(BaseModel):
    category: str
    title: str
    recommendation: str

class QuestionnaireResultResponse(BaseModel):
    id: str
    user_id: str
    timestamp: str
    raw_score: int
    max_score: int
    strain_index_percent: float # 0% = no strain symptoms, 100% = high strain symptoms
    awareness_grade: str # Low Risk, Mild Risk, Moderate Risk, Significant Strain Risk
    summary_message: str
    recommendations: List[EducationalRecommendation]
    medical_disclaimer: str = (
        "Educational Self-Assessment Notice: This questionnaire is intended for digital ergonomic awareness "
        "and habit improvement only. It does not replace professional consultation with an optometrist or ophthalmologist."
    )

class QuestionnaireHistoryResponse(BaseModel):
    total: int
    history: List[QuestionnaireResultResponse]
