from fastapi import APIRouter, HTTPException, status, Depends, Query
from app.models.questionnaire import (
    QuestionnaireQuestionsResponse,
    QuestionnaireSubmitRequest,
    QuestionnaireResultResponse,
    QuestionnaireHistoryResponse
)
from app.services.questionnaire_service import questionnaire_service
from app.api.v1.endpoints.deps import get_current_user
from app.models.user import UserResponse

router = APIRouter(prefix="/assessment", tags=["Eye Health Questionnaire"])

@router.get(
    "/questions",
    response_model=QuestionnaireQuestionsResponse,
    summary="Get 7-question digital eye strain awareness survey"
)
async def get_questions():
    """
    Returns the evidence-informed 7 questions covering tear film evaporation,
    headache incidence, working distance, 20-20-20 break habits, and ambient lighting.
    """
    return questionnaire_service.get_questions()

@router.post(
    "/submit",
    response_model=QuestionnaireResultResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit responses and calculate digital eye strain awareness index"
)
async def submit_questionnaire(
    request: QuestionnaireSubmitRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Processes user responses, computes a normalized strain risk index (0-100%),
    and provides customized educational lifestyle recommendations.
    
    *Notice: Educational questionnaire only. Not a medical ophthalmic diagnosis.*
    """
    try:
        return questionnaire_service.evaluate_submission(user_id=current_user.id, request=request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get(
    "/history",
    response_model=QuestionnaireHistoryResponse,
    summary="Get past questionnaire assessments"
)
async def get_assessment_history(
    limit: int = Query(default=10, ge=1, le=50),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Retrieves previous survey scores and recommendation history for the user.
    """
    return questionnaire_service.get_user_history(user_id=current_user.id, limit=limit)
