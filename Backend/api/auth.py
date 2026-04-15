from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from core.database import get_db
from core.security import verify_password, get_password_hash, create_access_token
from models.domain import User
from models.schemas import Token, UserCreate
from datetime import timedelta
from core.config import settings
import jwt
from jwt.exceptions import InvalidTokenError
from motor.motor_asyncio import AsyncIOMotorDatabase

router = APIRouter(prefix="/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token", auto_error=False)

async def get_current_user(token: Optional[str] = Depends(oauth2_scheme), db: AsyncIOMotorDatabase = Depends(get_db)):
    # Always try to find the dummy user first as a baseline
    dummy_email = "dummy@example.com"
    dummy_user_dict = await db["users"].find_one({"email": dummy_email})
    
    if not dummy_user_dict:
        # Maintenance: ensure dummy user exists if it was deleted
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
    
    # If no token, return dummy user immediately for "unrestricted" access
    if not token or token == "dummy":
        return User(**dummy_user_dict)

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("email")
        if email is None:
            return User(**dummy_user_dict)
        
        user_dict = await db["users"].find_one({"email": email})
        if user_dict:
            return User(**user_dict)
        return User(**dummy_user_dict)
            
    except Exception:
        # Fallback to dummy for any error (expired, invalid, etc.)
        return User(**dummy_user_dict)

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
