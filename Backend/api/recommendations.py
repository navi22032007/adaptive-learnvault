from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from ..core.database import get_session
from ..models.domain import Content, UserContentStatus, User, Tag
from ..models.schemas import RecommendationSchema
from .auth import get_current_user
import google.generativeai as genai
from ..core.config import settings
import random

router = APIRouter(prefix="/recommendations", tags=["recommendations"])

if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

def generate_ai_reason(content_title: str, user_level: str) -> str:
    if not settings.GEMINI_API_KEY:
        return "Recommended based on your learning history."
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = f"Write a short, encouraging 1-sentence reason why a {user_level} level student should learn '{content_title}'."
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return "Recommended based on your learning history."

@router.get("/", response_model=List[RecommendationSchema])
def read_recommendations(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Step 1: Fetch User Profile
    user_level = current_user.level
    available_time = 60 # Defaulting to 60 mins for MVP
    
    # Exclude completed content
    completed_statuses = session.exec(
        select(UserContentStatus).where(
            UserContentStatus.user_id == current_user.id,
            UserContentStatus.completion_status == True
        )
    ).all()
    completed_ids = [status.content_id for status in completed_statuses]
    
    # Step 2: Filter Content (Duration <= available_time)
    stmt = select(Content).where(Content.duration <= available_time)
    if completed_ids:
        stmt = stmt.where(Content.id.not_in(completed_ids))
        
    all_content = session.exec(stmt).all()
    
    # Step 3 & 4: Score and Rank
    # Simplified scoring: random shuffle for prototype, but prioritizing matching difficulty
    level_map = {"Beginner": 1, "Intermediate": 3, "Advanced": 5}
    user_diff = level_map.get(user_level, 1)
    
    scored_content = []
    for c in all_content:
        # Score based on difficulty match
        diff_score = 5 - abs(c.difficulty - user_diff)
        # Add slight random noise for diversity
        final_score = diff_score + random.uniform(0, 1)
        scored_content.append((final_score, c))
        
    scored_content.sort(key=lambda x: x[0], reverse=True)
    top_5 = [item[1] for item in scored_content[:5]]
    
    # Map to schema
    results = []
    for c in top_5:
        # Check user status
        status = session.exec(
            select(UserContentStatus).where(
                UserContentStatus.user_id == current_user.id,
                UserContentStatus.content_id == c.id
            )
        ).first()
        progress = status.progress if status else 0
        
        # Tags
        tags = [tag.name for tag in c.tags] if c.tags else []
        
        # AI Reason
        reason = generate_ai_reason(c.title, user_level)
        
        results.append(RecommendationSchema(
            id=c.id,
            title=c.title,
            type=c.type,
            difficulty=c.difficulty,
            duration=c.duration,
            tags=tags,
            reason=reason,
            progress=progress,
            thumbnail=c.thumbnail,
            description=c.description,
            instructor=c.instructor,
            rating=c.rating,
            enrolled=c.enrolled
        ))
        
    return results

@router.get("/{recommendation_id}", response_model=RecommendationSchema)
def read_recommendation(
    recommendation_id: int, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    c = session.get(Content, recommendation_id)
    if not c:
        raise HTTPException(status_code=404, detail="Content not found")
        
    status = session.exec(
        select(UserContentStatus).where(
            UserContentStatus.user_id == current_user.id,
            UserContentStatus.content_id == c.id
        )
    ).first()
    progress = status.progress if status else 0
    tags = [tag.name for tag in c.tags] if c.tags else []
    
    return RecommendationSchema(
        id=c.id,
        title=c.title,
        type=c.type,
        difficulty=c.difficulty,
        duration=c.duration,
        tags=tags,
        reason="Selected content.",
        progress=progress,
        thumbnail=c.thumbnail,
        description=c.description,
        instructor=c.instructor,
        rating=c.rating,
        enrolled=c.enrolled
    )

@router.patch("/{recommendation_id}/progress", response_model=RecommendationSchema)
def update_recommendation_progress(
    recommendation_id: int, 
    progress: int, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    c = session.get(Content, recommendation_id)
    if not c:
        raise HTTPException(status_code=404, detail="Content not found")
        
    status = session.exec(
        select(UserContentStatus).where(
            UserContentStatus.user_id == current_user.id,
            UserContentStatus.content_id == c.id
        )
    ).first()
    
    if not status:
        status = UserContentStatus(user_id=current_user.id, content_id=c.id, progress=progress)
        session.add(status)
    else:
        status.progress = progress
        if progress >= 100:
            status.completion_status = True
            
    session.commit()
    
    return read_recommendation(recommendation_id, session, current_user)
