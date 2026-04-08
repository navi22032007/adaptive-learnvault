from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from ..core.database import get_session
from ..models.domain import UserActivity, User
from ..models.schemas import ActivityDataSchema
from .auth import get_current_user
import json

router = APIRouter(prefix="/activity", tags=["activity"])

@router.get("/", response_model=ActivityDataSchema)
def read_activity(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    activity = session.exec(select(UserActivity).where(UserActivity.user_id == current_user.id)).first()
    if not activity:
        # Return default if not found
        return ActivityDataSchema(
            weeklyHours=[0, 0, 0, 0, 0, 0, 0],
            completionRate=0,
            streak=current_user.streak,
            totalCompleted=0,
            currentLevel=current_user.level,
            xp=0,
            nextLevelXp=1000,
            weekLabels=["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        )
    
    # Parse JSON hours
    try:
        hours_dict = json.loads(activity.weekly_hours_json)
        # Defaulting to standard week labels
        labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        hours = [hours_dict.get(label, 0.0) for label in labels]
    except Exception:
        hours = [0, 0, 0, 0, 0, 0, 0]
        labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

    return ActivityDataSchema(
        weeklyHours=hours,
        completionRate=activity.completion_rate,
        streak=current_user.streak,
        totalCompleted=activity.total_completed,
        currentLevel=current_user.level,
        xp=activity.xp,
        nextLevelXp=activity.next_level_xp,
        weekLabels=labels
    )
