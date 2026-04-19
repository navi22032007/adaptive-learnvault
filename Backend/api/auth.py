from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from core.database import get_db
from core.security import verify_password, get_password_hash, create_access_token
from models.domain import User
from models.schemas import Token, UserCreate
from datetime import timedelta, datetime
from core.config import settings
import jwt
from jwt.exceptions import InvalidTokenError
from motor.motor_asyncio import AsyncIOMotorDatabase

router = APIRouter(prefix="/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token", auto_error=False)

# ─── In-memory user cache (avoids repeated DB lookups) ───
_user_cache: dict[str, User] = {}
_dummy_user: Optional[User] = None


async def _get_or_create_dummy(db: AsyncIOMotorDatabase) -> User:
    """Get dummy user from cache or DB. Only hits DB once per server lifetime."""
    global _dummy_user
    if _dummy_user is not None:
        return _dummy_user

    dummy_email = "dummy@example.com"
    dummy_user_dict = await db["users"].find_one({"email": dummy_email})

    if not dummy_user_dict:
        dummy_user_dict = {
            "email": dummy_email,
            "name": "Dummy User",
            "password": get_password_hash("dummy_password"),
            "level": "Beginner",
            "role_name": "Student",
            "streak": 0,
            "todayGoal": 60,
            "todayProgress": 0
        }
        await db["users"].insert_one(dummy_user_dict)

    _dummy_user = User(**dummy_user_dict)
    return _dummy_user


async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    # Fast path: no token or dummy token → return cached dummy user (no DB hit)
    if not token or token == "dummy":
        return await _get_or_create_dummy(db)

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("email")
        if email is None:
            return await _get_or_create_dummy(db)

        # Check in-memory cache first
        if email in _user_cache:
            return _user_cache[email]

        # Cache miss → DB lookup (only once per user per server lifetime)
        user_dict = await db["users"].find_one({"email": email})
        if user_dict:
            user = User(**user_dict)
            # Update streak if needed
            user = await _check_and_update_streak(db, user)
            _user_cache[email] = user
            return user

        dummy_user = await _get_or_create_dummy(db)
        return await _check_and_update_streak(db, dummy_user)

    except Exception:
        dummy_user = await _get_or_create_dummy(db)
        return await _check_and_update_streak(db, dummy_user)

async def _check_and_update_streak(db: AsyncIOMotorDatabase, user: User) -> User:
    """Internal helper to update streak if a new day has started."""
    today = datetime.utcnow().date()
    today_str = today.isoformat()
    
    if user.last_active_date == today_str:
        return user
        
    # Determine new streak
    new_streak = 1
    if user.last_active_date:
        last_date = datetime.fromisoformat(user.last_active_date).date()
        yesterday = today - timedelta(days=1)
        if last_date == yesterday:
            new_streak = user.streak + 1
        elif last_date == today: # Already handled but being safe
            return user
            
    # Update DB
    await db["users"].update_one(
        {"email": user.email},
        {"$set": {"last_active_date": today_str, "streak": new_streak}}
    )
    
    # Update object and cache
    user.last_active_date = today_str
    user.streak = new_streak
    if user.email in _user_cache:
        _user_cache[user.email] = user
        
    return user


def invalidate_user_cache(email: str):
    """Call this when user profile is updated."""
    global _dummy_user
    _user_cache.pop(email, None)
    if email == "dummy@example.com":
        _dummy_user = None


@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncIOMotorDatabase = Depends(get_db)):
    user_dict = await db["users"].find_one({"email": form_data.username})
    if not user_dict:
         raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = User(**user_dict)
    if not verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"email": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=Token)
async def register_user(user_in: UserCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    db_user = await db["users"].find_one({"email": user_in.email})
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # Standard passwords as requested
    password = get_password_hash(user_in.password)
    user = User(
        email=user_in.email, 
        password=password, 
        name=user_in.name,
        role_name="Student"
    )
    
    user_dict = user.model_dump(by_alias=True)
    if "_id" in user_dict and user_dict["_id"] is None:
        del user_dict["_id"]
        
    await db["users"].insert_one(user_dict)
    
    access_token = create_access_token(data={"email": user.email})
    return {"access_token": access_token, "token_type": "bearer"}
