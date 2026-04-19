from typing import List, Optional
import asyncio
from fastapi import APIRouter, Depends, HTTPException
from core.database import get_db
from models.domain import Content, UserContentStatus, User
from models.schemas import RecommendationSchema, ExplainRequest, WhatNextSuggestion
from .auth import get_current_user
from openai import AsyncOpenAI
from core.config import settings
import random
import requests
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/recommendations", tags=["recommendations"])

# ─── Reusable AI client (singleton, not created per-request) ───
_ai_client: Optional[AsyncOpenAI] = None

def _get_ai_client() -> Optional[AsyncOpenAI]:
    global _ai_client
    if not settings.NVIDIA_API_KEY:
        return None
    if _ai_client is None:
        _ai_client = AsyncOpenAI(
            base_url="https://integrate.api.nvidia.com/v1",
            api_key=settings.NVIDIA_API_KEY,
            timeout=120.0,           # NVIDIA DeepSeek is slow (~30-40s+)
            max_retries=1,
        )
    return _ai_client


# ─── Static reason templates (instant, no AI call) ───
_REASON_TEMPLATES = [
    "Perfectly aligned with your current skill trajectory.",
    "Great match for your learning level – builds on what you know.",
    "Recommended based on your learning history and goals.",
    "This will strengthen your foundations for advanced topics.",
    "Popular among learners at your level – highly rated.",
]

def _static_reason(title: str, index: int) -> str:
    return _REASON_TEMPLATES[index % len(_REASON_TEMPLATES)]


async def generate_ai_reason(content_title: str, user_level: str) -> str:
    client = _get_ai_client()
    if not client:
        return "Recommended based on your learning history."
    try:
        prompt = f"Write a short, encouraging 1-sentence reason why a {user_level} level student should learn '{content_title}'."
        completion = await asyncio.wait_for(
            client.chat.completions.create(
                model="deepseek-ai/deepseek-v3.2",
                messages=[{"role": "user", "content": prompt}],
                temperature=1,
                top_p=0.95,
                max_tokens=128,
            ),
            timeout=5.0,
        )
        return completion.choices[0].message.content.strip()
    except Exception:
        return "Recommended based on your learning history."


# ─── Helper: build recommendations WITHOUT AI (fast) ───
async def _get_scored_recommendations(
    db: AsyncIOMotorDatabase,
    current_user: User,
    limit: int = 5,
) -> List[RecommendationSchema]:
    user_level = current_user.level

    # Exclude completed content
    completed_statuses = await db["user_content_status"].find({
        "user_email": current_user.email,
        "completion_status": True
    }).to_list(length=500)

    completed_ids = [status["content_id"] for status in completed_statuses]

    query = {"duration": {"$lte": 60}}
    if completed_ids:
        query["_id"] = {"$nin": [ObjectId(cid) if ObjectId.is_valid(cid) else cid for cid in completed_ids]}

    all_content = await db["content"].find(query).to_list(length=100)

    level_map = {"Beginner": 1, "Intermediate": 3, "Advanced": 5}
    user_diff = level_map.get(user_level, 1)

    scored = []
    for c_dict in all_content:
        c = Content(**c_dict)
        diff_score = 5 - abs(c.difficulty - user_diff)
        final_score = diff_score + random.uniform(0, 1)
        scored.append((final_score, c))

    scored.sort(key=lambda x: x[0], reverse=True)
    top = [item[1] for item in scored[:limit]]

    # Batch-fetch user statuses for all top items in ONE query
    top_ids = [str(c.id) for c in top]
    statuses = await db["user_content_status"].find({
        "user_email": current_user.email,
        "content_id": {"$in": top_ids}
    }).to_list(length=limit)
    status_map = {s["content_id"]: s for s in statuses}

    results = []
    for i, c in enumerate(top):
        status = status_map.get(str(c.id))
        progress = status["progress"] if status else 0
        results.append(RecommendationSchema(
            id=str(c.id),
            title=c.title,
            type=c.type,
            difficulty=c.difficulty,
            duration=c.duration,
            tags=c.tags,
            reason=_static_reason(c.title, i),
            progress=progress,
            thumbnail=c.thumbnail,
            description=c.description,
            instructor=c.instructor,
            rating=c.rating,
            enrolled=c.enrolled,
        ))

    return results


@router.get("/", response_model=List[RecommendationSchema])
async def read_recommendations(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fast endpoint – returns recommendations with static reasons (instant)."""
    return await _get_scored_recommendations(db, current_user)


@router.post("/enrich-reasons")
async def enrich_reasons(
    ids: List[str],
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Lazy AI enrichment – called AFTER the dashboard has rendered.
    Accepts a list of content IDs and returns AI-generated reasons.
    """
    if not _get_ai_client():
        return {}

    # Fetch titles
    oid_list = []
    for cid in ids:
        try:
            oid_list.append(ObjectId(cid))
        except Exception:
            pass

    contents = await db["content"].find({"_id": {"$in": oid_list}}).to_list(length=10)
    title_map = {str(c["_id"]): c["title"] for c in contents}

    async def _get_reason(cid: str):
        title = title_map.get(cid, "Unknown Topic")
        reason = await generate_ai_reason(title, current_user.level)
        return (cid, reason)

    tasks = [_get_reason(cid) for cid in ids if cid in title_map]
    pairs = await asyncio.gather(*tasks, return_exceptions=True)

    result = {}
    for pair in pairs:
        if isinstance(pair, tuple):
            result[pair[0]] = pair[1]
    return result


@router.get("/what-next", response_model=List[WhatNextSuggestion])
async def get_what_to_learn_next(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    completed_statuses = await db["user_content_status"].find({
        "user_email": current_user.email,
        "completion_status": True
    }).to_list(length=10)

    completed_titles = []
    for s in completed_statuses:
        try:
            content = await db["content"].find_one({"_id": ObjectId(s["content_id"])})
            if content:
                completed_titles.append(content["title"])
        except Exception:
            pass

    client = _get_ai_client()
    if not client:
        return [
            WhatNextSuggestion(title="Advanced Algorithms", reason="Based on your level.", relevance=90),
            WhatNextSuggestion(title="System Design", reason="Logical next step.", relevance=85),
        ]

    try:
        history_str = ", ".join(completed_titles) if completed_titles else "None yet"
        prompt = (
            f"User Level: {current_user.level}. Completed topics: {history_str}. "
            f"Suggest 3 specific topics they should learn next. "
            f"Return JSON: [{{'title': '...', 'reason': '...', 'relevance': 0-100}}]"
        )
        completion = await asyncio.wait_for(
            client.chat.completions.create(
                model="deepseek-ai/deepseek-v3.2",
                messages=[{"role": "user", "content": prompt}],
                temperature=1,
                top_p=0.95,
                max_tokens=512,
            ),
            timeout=8.0,
        )
        text = completion.choices[0].message.content
        import json, re
        match = re.search(r'\[.*\]', text, re.DOTALL)
        if match:
            suggestions = json.loads(match.group())
            return [WhatNextSuggestion(**s) for s in suggestions[:3]]
        return []
    except Exception as e:
        print(f"What-next AI error: {e}")
        return [
            WhatNextSuggestion(title="Advanced Algorithms", reason="Based on your level.", relevance=90),
            WhatNextSuggestion(title="System Design", reason="Logical next step.", relevance=85),
        ]


@router.post("/explain")
async def explain_topic(
    req: ExplainRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    client = _get_ai_client()
    if not client:
        return {"explanation": "AI service not configured. Please set NVIDIA_API_KEY in .env"}

    # 1. Check Cache
    meta = req.metadata or {}
    content_id = meta.get("content_id")
    if content_id:
        status = await db["user_content_status"].find_one({
            "user_email": current_user.email,
            "content_id": content_id
        })
        if status and status.get("ai_explanation"):
            return {"explanation": status["ai_explanation"]}

    try:
        # Build rich context from metadata
        content_type = meta.get("type", "Topic")
        description = meta.get("description", "")
        tags = meta.get("tags", [])
        topic_name = meta.get("topic_name", "")
        difficulty = meta.get("difficulty", 3)
        
        tags_str = ", ".join(tags) if tags else "general"

        prompt = f"""You are an expert academic tutor and technical specialist. A {current_user.level}-level student is studying a {content_type} titled **"{req.topic}"**.

Context:
- Description: {description}
- Subject Area: {topic_name}
- Tags: {tags_str}
- Difficulty Level: {difficulty}/5

Generate a **highly technical and structured Logic Decipher** for this resource. Focus on deep technical details, specific methodologies, and actionable lesson plans.

Structure your response EXACTLY as follows using Markdown:

## 📖 Deep Overview
A technical 3-4 sentence summary of exactly what logic, architecture, or core principles this resource covers.

## 🧱 The Technical Logic (Detailed)
Cover ALL important technical topics in this resource in great detail using an indented point-by-point system:
- **[Core Principle/Topic 1]**: Thorough explanation of the logic.
  - *Technical Sub-point*: Deep dive into implementation or mechanism.
  - *Mechanism detail*: How it interacts with other components.
- **[Core Principle/Topic 2]**: Next major element...
(Cover at least 5-8 major technical logic blocks)

## 📅 Actionable Lesson Plan
Provide a structured method to master this specific content:
- **Phase 1: Foundation (Hours 0-2)**: What to read first, what concepts to lock in.
- **Phase 2: Deep Dive (Hours 2-5)**: Implementation details, complex edge cases.
- **Phase 3: Validation**: How to test if you've mastered this (e.g. "Build X", "Solve Y").

## 📐 Formulas, Algorithms & Specifications
List all critical formulas, algorithms, or technical specs. Use syntax-highlighted code blocks:
```python
# Example algorithm or pseudocode
```

## 🧠 Topics to Study Next
What are the prerequisite or follow-up topics that branch out from this logic?

## 💡 Learning Methods & Pro-Tips
- Which learning methodology works best for this (e.g. Feynman technique, Spaced Repetition)?
- Common technical pitfalls and how to avoid them.

Be **extremely technical, point-based, and granular**. Avoid fluff. Assume the user needs to implement or be tested on this immediately."""

        completion = await asyncio.wait_for(
            client.chat.completions.create(
                model="meta/llama-3.1-70b-instruct",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3, # Lower temperature for more technical accuracy
                top_p=0.9,
                max_tokens=4096,
            ),
            timeout=120.0,
        )
        text = completion.choices[0].message.content.strip()

        # 2. Save to Cache
        if content_id:
            await db["user_content_status"].update_one(
                {"user_email": current_user.email, "content_id": content_id},
                {"$set": {"ai_explanation": text}},
                upsert=True
            )

        return {"explanation": text}
    except asyncio.TimeoutError:
        return {"explanation": "⏱️ The AI service timed out. Please click 'Synthesize' again to retry."}
    except Exception as e:
        print(f"Explain error: {e}")
        return {"explanation": f"Failed to generate analysis. Error: {str(e)[:100]}\n\nPlease try again."}


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
    ai_explanation = status_dict.get("ai_explanation") if status_dict else None

    return RecommendationSchema(
        id=str(c.id),
        title=c.title,
        type=c.type,
        difficulty=c.difficulty,
        duration=c.duration,
        tags=c.tags,
        reason="Selected content.",
        progress=progress,
        ai_explanation=ai_explanation,
        thumbnail=c.thumbnail,
        description=c.description,
        instructor=c.instructor,
        rating=c.rating,
        enrolled=c.enrolled,
    )


@router.patch("/{recommendation_id}/progress", response_model=RecommendationSchema)
async def update_recommendation_progress(
    recommendation_id: str,
    progress: int,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
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

    if completion_status:
        await db["users"].update_one(
            {"email": current_user.email},
            {"$inc": {"todayProgress": 10}}
        )

    return await read_recommendation(recommendation_id, db, current_user)


async def search_youtube_recommendations(
    topic: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    api_key = settings.YOUTUBE_API_KEY or "AIzaSyDqjiX02HzQXfCnJwoF5qq6jL05MyqNLfI"
    if not api_key:
        return []

    try:
        url = "https://www.googleapis.com/youtube/v3/search"
        params = {
            "q": topic,
            "part": "snippet",
            "type": "video",
            "maxResults": 3,
            "key": api_key
        }
        res = requests.get(url, params=params, timeout=5)
        data = res.json()

        results = []
        for item in data.get("items", []):
            snippet = item["snippet"]
            results.append({
                "id": item["id"]["videoId"],
                "title": snippet["title"],
                "url": f"https://www.youtube.com/watch?v={item['id']['videoId']}",
                "thumbnail": snippet["thumbnails"]["high"]["url"],
                "instructor": snippet["channelTitle"],
                "description": snippet["description"]
            })
        return results
    except Exception as e:
        print(f"YouTube Search Error: {e}")
        return []
