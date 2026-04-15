from fastapi import APIRouter, Depends
from core.database import get_db
from .auth import get_current_user
from models.domain import User
from motor.motor_asyncio import AsyncIOMotorDatabase

router = APIRouter(prefix="/user", tags=["user"])

@router.get("/profile")
async def get_user_profile(user: User = Depends(get_current_user)):
    # User object is already fetched in get_current_user
    return user

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
    updated_user = await db["users"].find_one({"email": user.email})
    return User(**updated_user)
