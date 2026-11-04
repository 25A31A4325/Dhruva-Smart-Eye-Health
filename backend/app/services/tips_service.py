from datetime import datetime, timezone
from typing import List
from app.models.tips import EyeCareTip, DailyTipResponse, TipsListResponse

CURATED_TIPS: List[EyeCareTip] = [
    EyeCareTip(
        id="tip_01",
        category="BREAKS",
        title="The Golden 20-20-20 Rule",
        content="For every 20 minutes spent staring at a digital display, redirect your gaze to an object at least 20 feet away for at least 20 seconds.",
        actionable_step="Set your Dhruva timer to 20 minutes and glance out of a window or across the hallway whenever the reminder sounds.",
        scientific_rationale="Gazing at optical infinity (6+ meters) allows the ciliary muscle inside your eye to completely relax from its near-focus contracted state.",
        icon_name="Clock"
    ),
    EyeCareTip(
        id="tip_02",
        category="DISTANCE",
        title="The Arm's Length Rule",
        content="Position your computer monitor approximately 50 to 70 centimeters away from your face (approximately an arm's length).",
        actionable_step="Extend your arm forward while seated upright. Your fingertips should gently brush the center of your screen.",
        scientific_rationale="Closer distances exponentially multiply the convergence effort demanded from both medial rectus extraocular muscles.",
        icon_name="Maximize2"
    ),
    EyeCareTip(
        id="tip_03",
        category="LIGHTING",
        title="Balance Contrast, Banish Glare",
        content="Ensure your ambient room illumination roughly matches the luminance of your computer monitor, and avoid direct glare reflections.",
        actionable_step="Never work in pitch black rooms with high screen brightness. Turn on soft background or warm bias desk lighting.",
        scientific_rationale="Severe luminance contrast forces your pupils into continuous micro-oscillations (pupillary hippus), creating deep ocular fatigue.",
        icon_name="Sun"
    ),
    EyeCareTip(
        id="tip_04",
        category="BLINKING",
        title="Conscious Complete Blinks",
        content="Blink intentionally and completely every few minutes. Screen use naturally cuts blink frequency from 18 times/minute down to 5-7 times/minute.",
        actionable_step="Take 5 slow, deliberate full-eyelid blinks right now, ensuring the upper eyelid makes gentle contact with the lower eyelid.",
        scientific_rationale="Complete blinks express meibum from the eyelid glands, locking in moisture and preventing dry eye syndrome.",
        icon_name="Eye"
    ),
    EyeCareTip(
        id="tip_05",
        category="POSTURE",
        title="Slightly Downward Gaze Angle",
        content="The top edge of your monitor screen should be at or slightly below eye level, creating a 15 to 20 degree downward viewing angle.",
        actionable_step="Lower your monitor stand or elevate your chair so that your eyes naturally rest looking downward toward the screen center.",
        scientific_rationale="A downward viewing angle exposes significantly less corneal surface area to ambient air, slowing down tear film evaporation.",
        icon_name="Compass"
    ),
    EyeCareTip(
        id="tip_06",
        category="HYDRATION",
        title="Systemic & Corneal Hydration",
        content="Keep a water bottle on your desk. Dehydration directly impairs aqueous tear production, leading to scratchy, gritty eyes.",
        actionable_step="Drink a glass of water during your hourly 20-20-20 break.",
        scientific_rationale="The tear film requires optimal systemic hydration to maintain its tripartite (mucin, aqueous, lipid) protective barrier.",
        icon_name="Droplets"
    ),
    EyeCareTip(
        id="tip_07",
        category="HABITS",
        title="Font Scaling & Clean Optics",
        content="Increase display text scaling to 110-125% rather than leaning forward, and wipe finger smudges and dust from your monitor glass.",
        actionable_step="Use Ctrl + Plus in your browser to scale text so you can read effortlessly from 60 cm away.",
        scientific_rationale="Low-contrast, blurry smudged text degrades retinal image acuity, inducing subconscious accommodative struggle.",
        icon_name="Type"
    )
]

class TipsService:
    def get_all_tips(self) -> TipsListResponse:
        categories = list({t.category for t in CURATED_TIPS})
        return TipsListResponse(
            total=len(CURATED_TIPS),
            categories=sorted(categories),
            tips=CURATED_TIPS
        )

    def get_daily_tip(self) -> DailyTipResponse:
        now = datetime.now(timezone.utc)
        # Select daily tip deterministically based on day of year
        day_of_year = now.timetuple().tm_yday
        tip_index = day_of_year % len(CURATED_TIPS)
        selected_tip = CURATED_TIPS[tip_index]

        return DailyTipResponse(
            date=now.strftime("%Y-%m-%d"),
            tip=selected_tip,
            total_available_tips=len(CURATED_TIPS)
        )

tips_service = TipsService()
