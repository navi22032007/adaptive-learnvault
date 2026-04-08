from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from ..core.database import get_session
from ..models.domain import User
from ..models.schemas import UserProfileSchema
from .auth import get_current_user

router = APIRouter(prefix="/user", tags=["user"])

@router.get("/", response_model=UserProfileSchema)
def read_user(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    return UserProfileSchema(
        id=current_user.id,
        name=current_user.name,
        avatar=current_user.avatar,
        level=current_user.level,
        streak=current_user.streak,
        todayGoal=current_user.todayGoal,
        todayProgress=current_user.todayProgress
    )
