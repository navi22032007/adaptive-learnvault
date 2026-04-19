from fastapi import APIRouter, Depends
from core.database import get_db
from .auth import get_current_user
from models.domain import User, UserActivity
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime

router = APIRouter(prefix="/activity", tags=["activity"])

from models.schemas import ActivityDataSchema

@router.get("/", response_model=ActivityDataSchema)
async def get_user_activity(
    user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    activity_dict = await db["user_activity"].find_one({"user_email": user.email})
    if not activity_dict:
        # Create empty activity if not exists
        activity_dict = {
            "user_email": user.email,
            "weekly_hours": {"Mon": 0, "Tue": 0, "Wed": 0, "Thu": 0, "Fri": 0, "Sat": 0, "Sun": 0},
            "completion_rate": 0.0,
            "total_completed": 0,
            "xp": 0,
            "next_level_xp": 1000
        }
        await db["user_activity"].insert_one(activity_dict)
    
    # Map to ActivityDataSchema
    weekly_hours_dict = activity_dict.get("weekly_hours", {})
    labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    hours = [weekly_hours_dict.get(l, 0) for l in labels]
    
    return {
        "weeklyHours": hours,
        "weekLabels": labels,
        "completionRate": float(activity_dict.get("completion_rate", 0)),
        "totalCompleted": int(activity_dict.get("total_completed", 0)),
        "xp": int(activity_dict.get("xp", 0)),
        "nextLevelXp": int(activity_dict.get("next_level_xp", 1000)),
        "streak": int(user.streak),
        "currentLevel": str(user.level)
    }


@router.post("/record")
async def record_activity(
    duration_minutes: float,
    day_label: str, # "Mon", "Tue", etc.
    user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    await db["user_activity"].update_one(
        {"user_email": user.email},
        {
            "$inc": {f"weekly_hours.{day_label}": duration_minutes / 60.0},
            "$set": {"last_updated": datetime.utcnow()}
        },
        upsert=True
    )
    return {"message": "Activity recorded"}
