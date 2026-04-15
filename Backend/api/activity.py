from fastapi import APIRouter, Depends
from core.database import get_db
from .auth import get_current_user
from models.domain import User, UserActivity
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime

router = APIRouter(prefix="/activity", tags=["activity"])

@router.get("/", response_model=UserActivity)
async def get_user_activity(
    user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    activity_dict = await db["activities"].find_one({"user_email": user.email})
    if not activity_dict:
        # Create empty activity if not exists
        activity = UserActivity(user_email=user.email)
        activity_dict = activity.model_dump(by_alias=True)
        if "_id" in activity_dict and activity_dict["_id"] is None:
            del activity_dict["_id"]
        await db["activities"].insert_one(activity_dict)
        return activity
        
    return UserActivity(**activity_dict)

@router.post("/record")
async def record_activity(
    duration_minutes: float,
    day_label: str, # "Mon", "Tue", etc.
    user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    await db["activities"].update_one(
        {"user_email": user.email},
        {
            "$inc": {f"weekly_hours.{day_label}": duration_minutes / 60.0},
            "$set": {"last_updated": datetime.utcnow()}
        },
        upsert=True
    )
    return {"message": "Activity recorded"}
