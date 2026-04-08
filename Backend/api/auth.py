from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlmodel import Session, select
from ..core.database import get_session
from ..core.security import verify_password, get_password_hash, create_access_token
from ..models.domain import User, Role
from ..models.schemas import Token, UserCreate
from datetime import timedelta
from ..core.config import settings
import jwt
from jwt.exceptions import InvalidTokenError

router = APIRouter(prefix="/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("email")
        if email is None:
            raise credentials_exception
    except InvalidTokenError:
        raise credentials_exception
        
    user = session.exec(select(User).where(User.email == email)).first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/token", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
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
def register_user(user_in: UserCreate, session: Session = Depends(get_session)):
    db_user = session.exec(select(User).where(User.email == user_in.email)).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # Get or create student role
    role = session.exec(select(Role).where(Role.name == "Student")).first()
    if not role:
        role = Role(name="Student")
        session.add(role)
        session.commit()
        session.refresh(role)
        
    hashed_password = get_password_hash(user_in.password)
    user = User(email=user_in.email, hashed_password=hashed_password, name=user_in.name, role_id=role.id)
    session.add(user)
    session.commit()
    
    access_token = create_access_token(data={"email": user.email})
    return {"access_token": access_token, "token_type": "bearer"}
