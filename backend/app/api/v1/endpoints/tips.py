from fastapi import APIRouter
from app.models.tips import TipsListResponse, DailyTipResponse
from app.services.tips_service import tips_service

router = APIRouter(prefix="/tips", tags=["Eye Care Tips & Education"])

@router.get(
    "",
    response_model=TipsListResponse,
    summary="List all curated digital eye health guidelines"
)
async def get_all_tips():
    """
    Returns curated guidelines covering the 20-20-20 rule, viewing distance ergonomics,
    ambient lighting contrast, deliberate blinking, and display scaling.
    """
    return tips_service.get_all_tips()

@router.get(
    "/daily",
    response_model=DailyTipResponse,
    summary="Get featured tip of the day"
)
async def get_daily_tip():
    """
    Returns the featured daily eye wellness tip based on current calendar date.
    """
    return tips_service.get_daily_tip()
