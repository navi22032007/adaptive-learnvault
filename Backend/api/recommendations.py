from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from core.database import get_db
from models.domain import Content, UserContentStatus, User
from models.schemas import RecommendationSchema, ExplainRequest, WhatNextSuggestion
from .auth import get_current_user
import google.generativeai as genai
from core.config import settings
import random
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime

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
async def read_recommendations(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_level = current_user.level
    available_time = 60
    
    # Exclude completed content
    completed_statuses = await db["user_content_status"].find({
        "user_email": current_user.email,
        "completion_status": True
    }).to_list(length=1000)
    
    completed_ids = [status["content_id"] for status in completed_statuses]
    
    # Filter Content
    query = {"duration": {"$lte": available_time}}
    if completed_ids:
        query["_id"] = {"$nin": [ObjectId(cid) if ObjectId.is_valid(cid) else cid for cid in completed_ids]}
        
    cursor = db["content"].find(query)
    all_content = await cursor.to_list(length=100)
    
    # Score and Rank
    level_map = {"Beginner": 1, "Intermediate": 3, "Advanced": 5}
    user_diff = level_map.get(user_level, 1)
    
    scored_content = []
    for c_dict in all_content:
        c = Content(**c_dict)
        diff_score = 5 - abs(c.difficulty - user_diff)
        final_score = diff_score + random.uniform(0, 1)
        scored_content.append((final_score, c))
        
    scored_content.sort(key=lambda x: x[0], reverse=True)
    top_5 = [item[1] for item in scored_content[:5]]
    
    results = []
    for c in top_5:
        # Check user status
        status_dict = await db["user_content_status"].find_one({
            "user_email": current_user.email,
            "content_id": str(c.id)
        })
        progress = status_dict["progress"] if status_dict else 0
        
        reason = generate_ai_reason(c.title, user_level)
        
        results.append(RecommendationSchema(
            id=str(c.id),
            title=c.title,
            type=c.type,
            difficulty=c.difficulty,
            duration=c.duration,
            tags=c.tags,
            reason=reason,
            progress=progress,
            thumbnail=c.thumbnail,
            description=c.description,
            instructor=c.instructor,
            rating=c.rating,
            enrolled=c.enrolled
        ))
        
    return results

@router.get("/what-next", response_model=List[WhatNextSuggestion])
async def get_what_to_learn_next(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch completed content
    completed_statuses = await db["user_content_status"].find({
        "user_email": current_user.email,
        "completion_status": True
    }).to_list(length=10)
    
    completed_titles = []
    for s in completed_statuses:
        content = await db["content"].find_one({"_id": ObjectId(s["content_id"])})
        if content:
            completed_titles.append(content["title"])

    if not settings.GEMINI_API_KEY:
        return [
            WhatNextSuggestion(title="Advanced Algorithms", reason="Based on your level.", relevance=90),
            WhatNextSuggestion(title="System Design", reason="Logical next step.", relevance=85)
        ]

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        history_str = ", ".join(completed_titles) if completed_titles else "None yet"
        prompt = (
            f"User Level: {current_user.level}. Completed topics: {history_str}. "
            f"Suggest 3 specific topics they should learn next. "
            f"Return JSON: [{{'title': '...', 'reason': '...', 'relevance': 0-100}}]"
        )
        response = model.generate_content(prompt)
        text = response.text
        import json
        import re
        match = re.search(r'\[.*\]', text, re.DOTALL)
        if match:
            suggestions = json.loads(match.group())
            return [WhatNextSuggestion(**s) for s in suggestions]
        return []
    except Exception as e:
        print(f"Gemini error: {e}")
        return []

@router.post("/explain")
async def explain_topic(
    req: ExplainRequest,
    current_user: User = Depends(get_current_user)
):
    if not settings.GEMINI_API_KEY:
        return {"explanation": f"This is a placeholder explanation for {req.topic}."}

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = (
            f"Explain '{req.topic}' to a {current_user.level} level student. "
            f"Use one relatable analogy. Keep it under 250 words and well-formatted."
        )
        response = model.generate_content(prompt)
        return {"explanation": response.text.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini failed: {str(e)}")

@router.get("/{recommendation_id}", response_model=RecommendationSchema)
async def read_recommendation(
    recommendation_id: str, 
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        c_dict = await db["content"].find_one({"_id": ObjectId(recommendation_id)})
    except Exception:
        c_dict = await db["content"].find_one({"id": recommendation_id})
        
    if not c_dict:
        raise HTTPException(status_code=404, detail="Content not found")
        
    c = Content(**c_dict)
    
    status_dict = await db["user_content_status"].find_one({
        "user_email": current_user.email,
        "content_id": recommendation_id
    })
    progress = status_dict["progress"] if status_dict else 0
    
    return RecommendationSchema(
        id=str(c.id),
        title=c.title,
        type=c.type,
        difficulty=c.difficulty,
        duration=c.duration,
        tags=c.tags,
        reason="Selected content.",
        progress=progress,
        thumbnail=c.thumbnail,
        description=c.description,
        instructor=c.instructor,
        rating=c.rating,
        enrolled=c.enrolled
    )

@router.patch("/{recommendation_id}/progress", response_model=RecommendationSchema)
async def update_recommendation_progress(
    recommendation_id: str, 
    progress: int, 
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify content exists
    try:
        content_exists = await db["content"].find_one({"_id": ObjectId(recommendation_id)})
    except Exception:
         content_exists = await db["content"].find_one({"id": recommendation_id})
         
    if not content_exists:
        raise HTTPException(status_code=404, detail="Content not found")
        
    completion_status = progress >= 100
    
    await db["user_content_status"].update_one(
        {"user_email": current_user.email, "content_id": recommendation_id},
        {
            "$set": {
                "progress": progress,
                "completion_status": completion_status,
                "last_accessed": datetime.utcnow()
            }
        },
        upsert=True
    )
    
    # If completed, could potentially trigger level up or unlock new topics
    if completion_status:
        # Simple logic: increment xp or similar
        await db["users"].update_one(
            {"email": current_user.email},
            {"$inc": {"todayProgress": 10}} # Dummy progress increment
        )

    return await read_recommendation(recommendation_id, db, current_user)

@router.get("/youtube/search", response_model=List[dict])
async def search_youtube_recommendations(
    topic: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Suggests YouTube videos for a topic using Gemini if no YT API key is present.
    In a real app, this would call the YouTube Search API.
    """
    if not settings.GEMINI_API_KEY:
        # Mock YT results
        return [
            {
                "id": "mock_yt_1",
                "title": f"Mastering {topic} for Beginners",
                "url": f"https://www.youtube.com/results?search_query={topic}",
                "thumbnail": "https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg",
                "instructor": "Learning Expert",
                "duration": "12:30"
            },
            {
                "id": "mock_yt_2",
                "title": f"Advanced {topic} Concepts",
                "url": f"https://www.youtube.com/results?search_query={topic}+advanced",
                "thumbnail": "https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg",
                "instructor": "Tech Guru",
                "duration": "45:10"
            }
        ]
    
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = f"Suggest 3 popular YouTube video titles and short descriptions that would help a {current_user.level} level student understand '{topic}' better. Just give the titles and expected duration."
        response = model.generate_content(prompt)
        # Simulate structured return
        return [
             {
                "id": f"ai_yt_{i}",
                "title": f"Suggested: {topic} Part {i}",
                "url": f"https://www.youtube.com/results?search_query={topic}",
                "thumbnail": "https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg",
                "instructor": "AI Assistant",
                "duration": "15:00"
            } for i in range(1, 4)
        ]
    except Exception:
        return []

