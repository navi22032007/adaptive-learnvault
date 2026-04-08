from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from ..core.database import get_session
from ..models.domain import Content, User, Tag, ContentTag, UserContentStatus
from ..models.schemas import RecommendationSchema
from .auth import get_current_user
from ..core.config import settings
import google.generativeai as genai
from pydantic import BaseModel
from typing import List
import json

router = APIRouter(prefix="/content", tags=["content"])

class ContentImport(BaseModel):
    title: str
    url: str
    type: str # Video, PDF, Blog, etc.
    description: Optional[str] = ""
    tags: List[str] = []

class TopicGenerate(BaseModel):
    topic: str

if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

@router.post("/import", response_model=RecommendationSchema)
def import_user_content(
    item: ContentImport,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Create the content record
    new_content = Content(
        title=item.title,
        file_path_or_url=item.url,
        type=item.type,
        description=item.description or f"Imported by {current_user.name}",
        difficulty=3, # Default
        duration=15,  # Default
        created_by_id=current_user.id
    )
    
    # Handle tags
    for tag_name in item.tags:
        tag = session.exec(select(Tag).where(Tag.name == tag_name)).first()
        if not tag:
            tag = Tag(name=tag_name)
            session.add(tag)
            session.commit()
            session.refresh(tag)
        new_content.tags.append(tag)
        
    session.add(new_content)
    session.commit()
    session.refresh(new_content)
    
    # Initialize status for this user
    status = UserContentStatus(user_id=current_user.id, content_id=new_content.id, progress=0)
    session.add(status)
    session.commit()
    
    return RecommendationSchema(
        id=new_content.id,
        title=new_content.title,
        type=new_content.type,
        difficulty=new_content.difficulty,
        duration=new_content.duration,
        tags=item.tags,
        reason="Manually imported content.",
        progress=0,
        description=new_content.description,
        instructor=current_user.name,
        rating=0.0,
        enrolled=1
    )

@router.post("/generate", response_model=List[RecommendationSchema])
def generate_topic_resources(
    req: TopicGenerate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured")
        
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = f"""
        Act as an expert curator. For the topic '{req.topic}', provide a list of 3 high-quality learning resources.
        Return ONLY a JSON list of objects with these fields:
        - title: Specific title of the resource
        - type: either 'Video' or 'PDF'
        - url: A placeholder or real example URL (e.g. YouTube or educational link)
        - description: 1-sentence summary
        - difficulty: number 1-5
        - duration: estimated minutes to consume
        - tags: list of 3 strings
        """
        
        response = model.generate_content(prompt)
        # Extract JSON from potential markdown blocks
        raw_text = response.text.strip()
        if "```json" in raw_text:
            raw_text = raw_text.split("```json")[1].split("```")[0].strip()
        
        resources = json.loads(raw_text)
        
        results = []
        for res in resources:
            # Check if content already exists
            db_content = session.exec(select(Content).where(Content.title == res['title'])).first()
            if not db_content:
                db_content = Content(
                    title=res['title'],
                    file_path_or_url=res['url'],
                    type=res['type'],
                    description=res['description'],
                    difficulty=res['difficulty'],
                    duration=res['duration'],
                    created_by_id=current_user.id
                )
                # Tags
                for tag_name in res['tags']:
                    tag = session.exec(select(Tag).where(Tag.name == tag_name.lower())).first()
                    if not tag:
                        tag = Tag(name=tag_name.lower())
                        session.add(tag)
                        session.commit()
                        session.refresh(tag)
                    db_content.tags.append(tag)
                
                session.add(db_content)
                session.commit()
                session.refresh(db_content)
            
            # Link to user
            status = session.exec(select(UserContentStatus).where(
                UserContentStatus.user_id == current_user.id,
                UserContentStatus.content_id == db_content.id
            )).first()
            if not status:
                status = UserContentStatus(user_id=current_user.id, content_id=db_content.id, progress=0)
                session.add(status)
                session.commit()
            
            results.append(RecommendationSchema(
                id=db_content.id,
                title=db_content.title,
                type=db_content.type,
                difficulty=db_content.difficulty,
                duration=db_content.duration,
                tags=res['tags'],
                reason=f"AI generated for your request: '{req.topic}'",
                progress=status.progress,
                description=db_content.description,
                instructor="AI Curator",
                rating=4.5,
                enrolled=100
            ))
            
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
