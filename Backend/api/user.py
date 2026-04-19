from fastapi import APIRouter, Depends
from core.database import get_db
from .auth import get_current_user, invalidate_user_cache
from models.domain import User
from motor.motor_asyncio import AsyncIOMotorDatabase

from models.schemas import UserProfileSchema, NoteSchema
from datetime import datetime

router = APIRouter(prefix="/user", tags=["user"])

@router.get("/profile", response_model=UserProfileSchema)
async def get_user_profile(
    user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    # 1. Update Streak Logic
    today = datetime.utcnow().strftime("%Y-%m-%d")
    last_active = user.last_active_date
    
    new_streak = user.streak
    if not last_active:
        new_streak = 1
    elif last_active != today:
        from datetime import datetime as dt, timedelta
        last_dt = dt.strptime(last_active, "%Y-%m-%d")
        today_dt = dt.strptime(today, "%Y-%m-%d")
        
        if (today_dt - last_dt).days == 1:
            new_streak += 1
        elif (today_dt - last_dt).days > 1:
            new_streak = 1
            
    # Save streak and today's activity
    if new_streak != user.streak or last_active != today:
        await db["users"].update_one(
            {"email": user.email},
            {"$set": {"streak": new_streak, "last_active_date": today}}
        )
        invalidate_user_cache(user.email)
        # Fetch updated user if needed or just use values
        user.streak = new_streak
        user.last_active_date = today

    # 2. Fetch activity data to get XP
    activity = await db["user_activity"].find_one({"user_email": user.email})
    
    xp = 0
    next_level_xp = 1000
    if activity:
        xp = activity.get("xp", 0)
        next_level_xp = activity.get("next_level_xp", 1000)
    else:
        # Create default activity if missing
        await db["user_activity"].insert_one({
            "user_email": user.email,
            "weekly_hours": {"Mon": 0, "Tue": 0, "Wed": 0, "Thu": 0, "Fri": 0, "Sat": 0, "Sun": 0},
            "completion_rate": 0.0,
            "total_completed": 0,
            "xp": 0,
            "next_level_xp": 1000,
            "last_updated": datetime.utcnow()
        })
        
    return {
        "id": str(user.id),
        "name": user.name,
        "avatar": user.avatar,
        "level": user.level,
        "streak": new_streak,
        "todayGoal": user.todayGoal,
        "todayProgress": user.todayProgress,
        "xp": xp,
        "nextLevelXp": next_level_xp
    }

@router.put("/profile")
async def update_user_profile(
    profile_update: dict, 
    user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    await db["users"].update_one(
        {"email": user.email},
        {"$set": profile_update}
    )
    invalidate_user_cache(user.email)
    updated_user = await db["users"].find_one({"email": user.email})
    return User(**updated_user)
from models.schemas import NoteSchema
from datetime import datetime

@router.get("/notes/{content_id}")
async def get_user_notes(
    content_id: str,
    user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    note = await db["user_notes"].find_one({"user_email": user.email, "content_id": content_id})
    if not note:
        return {"text": ""}
    return {"text": note["text"]}

@router.post("/notes/{content_id}")
async def save_user_notes(
    content_id: str,
    note_req: NoteSchema,
    user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    await db["user_notes"].update_one(
        {"user_email": user.email, "content_id": content_id},
        {"$set": {
            "text": note_req.text,
            "updated_at": datetime.utcnow()
        }},
        upsert=True
    )
    return {"success": True}
