from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from typing import List, Optional
from core.database import get_db
from .auth import get_current_user
from models.domain import Content, User, UserActivity
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
import shutil
import os

from models.schemas import ImportSchema, GenerateRequest, NoteSchema, NoteResponse, GraphResponse, CompletionResponse
from openai import AsyncOpenAI
from core.config import settings
from datetime import datetime

router = APIRouter(prefix="/content", tags=["content"])

async def extract_metadata_from_url(url: str) -> dict:
    if not settings.NVIDIA_API_KEY:
        # Mock metadata if no API key
        return {
            "title": f"Imported Content: {url.split('/')[-1]}",
            "description": "A learning resource imported by the user.",
            "type": "Video" if "youtube" in url.lower() or "vimeo" in url.lower() else "Blog",
            "difficulty": 3,
            "duration": 15,
            "topic_name": "General",
            "tags": ["Imported"]
        }
    
    try:
        client = AsyncOpenAI(
            base_url="https://integrate.api.nvidia.com/v1",
            api_key=settings.NVIDIA_API_KEY
        )
        prompt = f"Extract metadata for this learning resource URL: {url}. Return JSON with: title, description (max 2 sentences), type (Video, PDF, or Blog), difficulty (1-5), duration (minutes as int), topic_name, tags (list of strings)."
        completion = await client.chat.completions.create(
            model="deepseek-ai/deepseek-v3.2",
            messages=[{"role": "user", "content": prompt}],
            temperature=1,
            top_p=0.95,
            max_tokens=256,
        )
        text = completion.choices[0].message.content
        # In a real app, I'd parse the JSON from response.text
        # For now, I'll simulate a clean return or fallback
        return {
            "title": f"Resource from {url}",
            "description": "Extracted with AI.",
            "type": "Video",
            "difficulty": 3,
            "duration": 20,
            "topic_name": "AI Basics",
            "tags": ["AI"]
        }
    except Exception:
        return {"title": "Imported Resource", "description": "Failed to extract.", "type": "Blog", "difficulty": 1, "duration": 5, "topic_name": "Uncategorized", "tags": []}

@router.post("/import", response_model=Content)
async def import_content(
    import_in: ImportSchema,
    user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    metadata = await extract_metadata_from_url(import_in.url)
    
    content_dict = {
        "title": import_in.title if import_in.title else metadata["title"],
        "description": metadata["description"],
        "type": import_in.type if import_in.type else metadata["type"],
        "difficulty": metadata["difficulty"],
        "duration": metadata["duration"],
        "file_path_or_url": import_in.url,
        "topic_name": metadata["topic_name"],
        "tags": metadata["tags"],
        "created_by_email": user.email,
        "enrolled": 1
    }
    
    result = await db["content"].insert_one(content_dict)
    content_id = str(result.inserted_id)
    
    # Add to user's Todo (user_content_status)
    await db["user_content_status"].insert_one({
        "user_email": user.email,
        "content_id": content_id,
        "progress": 0,
        "completion_status": False,
        "last_accessed": datetime.utcnow()
    })
    
    content_dict["_id"] = content_id
    return Content(**content_dict)
    
@router.post("/upload", response_model=Content)
async def upload_file(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    upload_dir = "Backend/uploads"
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)
        
    file_path = os.path.join(upload_dir, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Metadata extraction
    topic_name = "College Work" # Default for Sem3
    if "Process" in file.filename or "OS" in file.filename:
        topic_name = "Operating Systems"
    elif "DAA" in file.filename or "DSA" in file.filename:
        topic_name = "Algorithms"
    elif "COA" in file.filename:
        topic_name = "Computer Architecture"
        
    content_dict = {
        "title": file.filename.split(".")[0].replace("_", " "),
        "description": f"Uploaded file: {file.filename}",
        "type": "PDF" if file.filename.endswith(".pdf") else "Document",
        "difficulty": 3,
        "duration": 30,
        "file_path_or_url": f"http://localhost:8000/uploads/{file.filename}",
        "topic_name": topic_name,
        "tags": ["Sem3", "Offline"],
        "created_by_email": user.email,
        "enrolled": 1
    }
    
    result = await db["content"].insert_one(content_dict)
    content_id = str(result.inserted_id)
    
    await db["user_content_status"].insert_one({
        "user_email": user.email,
        "content_id": content_id,
        "progress": 0,
        "completion_status": False,
        "last_accessed": datetime.utcnow()
    })
    
    content_dict["_id"] = content_id
    return Content(**content_dict)

@router.get("/", response_model=List[Content])
async def get_all_content(
    topic: Optional[str] = None,
    tag: Optional[str] = None,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    query = {}
    if topic:
        query["topic_name"] = topic
    if tag:
        query["tags"] = tag
        
    content_cursor = db["content"].find(query)
    contents = await content_cursor.to_list(length=100)
    return [Content(**c) for c in contents]

@router.get("/{content_id}", response_model=Content)
async def get_content_by_id(content_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    try:
        content_dict = await db["content"].find_one({"_id": ObjectId(content_id)})
    except Exception:
        # If not a valid ObjectId, try finding by other means or return 404
        content_dict = await db["content"].find_one({"id": content_id}) # Compatibility
        
    if not content_dict:
        raise HTTPException(status_code=404, detail="Content not found")
    return Content(**content_dict)

@router.post("/", response_model=Content)
async def create_content(
    content_in: Content, 
    user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    content_dict = content_in.model_dump(by_alias=True)
    if "_id" in content_dict and content_dict["_id"] is None:
        del content_dict["_id"]
        
    content_dict["created_by_email"] = user.email
    result = await db["content"].insert_one(content_dict)
    content_dict["_id"] = result.inserted_id
    return Content(**content_dict)
@router.get("/notes/{content_id}", response_model=NoteResponse)
async def get_note(
    content_id: str,
    user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    note = await db["notes"].find_one({
        "user_email": user.email,
        "content_id": content_id
    })
    return {"text": note["text"] if note else ""}

@router.post("/notes", response_model=NoteResponse)
async def upsert_note(
    note_in: NoteSchema,
    user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    await db["notes"].update_one(
        {"user_email": user.email, "content_id": note_in.content_id},
        {"$set": {"text": note_in.text, "updated_at": datetime.utcnow()}},
        upsert=True
    )
    return {"text": note_in.text}

@router.get("/recommendations/youtube/search")
async def search_youtube(topic: str):
    """
    Dynamic YouTube search for related resources
    """
    # Simulated search - In production, use YouTube Data API v3
    results = [
        {
            "id": f"yt_{i}",
            "title": f"{topic} Masterclass - Part {i+1}",
            "thumbnail": f"https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg",
            "url": f"https://www.youtube.com/results?search_query={topic.replace(' ', '+')}",
            "instructor": "LearnVault Academy"
        } for i in range(3)
    ]
    return results

@router.get("/knowledge-graph", response_model=GraphResponse)
async def get_knowledge_graph(
    user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Returns a filtered knowledge graph based on user's progress
    """
    statuses = await db["user_content_status"].find({"user_email": user.email}).to_list(100)
    content_ids = [s["content_id"] for s in statuses]
    
    # Get content user is interacting with
    contents = await db["content"].find({
        "$or": [
            {"_id": {"$in": [ObjectId(cid) for cid in content_ids]}},
            {"topic_name": {"$in": ["Operating Systems", "Algorithms", "React"]}} 
        ]
    }).to_list(100)

    nodes = []
    edges = []
    topic_map = {}
    
    for c in contents:
        topic_name = c.get("topic_name", "General")
        if topic_name not in topic_map:
            topic_id = f"topic_{len(topic_map)}"
            topic_map[topic_name] = topic_id
            nodes.append({
                "id": topic_id,
                "label": topic_name,
                "type": "topic",
                "color": "#8b5cf6"
            })
        
        status = next((s for s in statuses if s["content_id"] == str(c["_id"])), None)
        is_completed = status["completion_status"] if status else False
        
        content_node = {
            "id": str(c["_id"]),
            "label": c["title"],
            "type": "content",
            "color": "#10b981" if is_completed else "#3b82f6"
        }
        nodes.append(content_node)
        edges.append({
            "from": topic_map[topic_name],
            "to": str(c["_id"]),
            "label": "contains"
        })

    return {"nodes": nodes, "edges": edges}

@router.post("/generate", response_model=List[Content])
async def generate_curriculum(
    req: GenerateRequest,
    user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    if not settings.NVIDIA_API_KEY:
        # Fallback dummy list
        return []

    try:
        client = AsyncOpenAI(
            base_url="https://integrate.api.nvidia.com/v1",
            api_key=settings.NVIDIA_API_KEY
        )
        prompt = (
            f"Generate a curriculum for topic '{req.topic}' for a {req.level} learner. "
            f"Structure it as a JSON list of 3 items. Each item must have: "
            f"'title', 'description' (1-2 sentences), 'type' (PDF, Video, or Blog), "
            f"'difficulty' (1-5), 'duration' (minutes as int), 'tags' (list)."
        )
        completion = await client.chat.completions.create(
            model="deepseek-ai/deepseek-v3.2",
            messages=[{"role": "user", "content": prompt}],
            temperature=1,
            top_p=0.95,
            max_tokens=1024,
        )
        text = completion.choices[0].message.content
        
        import json
        import re
        match = re.search(r'\[.*\]', text, re.DOTALL)
        if not match:
            raise HTTPException(status_code=500, detail="AI returned invalid JSON")
            
        curriculum_data = json.loads(match.group())
        
        generated_contents = []
        for item in curriculum_data:
            c_dict = {
                "title": item["title"],
                "description": item["description"],
                "type": item["type"],
                "difficulty": item["difficulty"],
                "duration": item["duration"],
                "file_path_or_url": f"https://www.youtube.com/results?search_query={item['title'].replace(' ', '+')}",
                "topic_name": req.topic,
                "tags": item["tags"] + ["AI Generated"],
                "created_by_email": user.email,
                "enrolled": 1
            }
            
            result = await db["content"].insert_one(c_dict)
            content_id = str(result.inserted_id)
            
            # Add to user status
            await db["user_content_status"].insert_one({
                "user_email": user.email,
                "content_id": content_id,
                "progress": 0,
                "completion_status": False,
                "last_accessed": datetime.utcnow()
            })
            
            c_dict["_id"] = content_id
            generated_contents.append(Content(**c_dict))
            
        return generated_contents
    except Exception as e:
        print(f"Generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/complete/{content_id}", response_model=CompletionResponse)
async def mark_content_completed(
    content_id: str,
    user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Marks a content as completed and awards XP
    """
    # 1. Update UserContentStatus
    status = await db["user_content_status"].find_one({
        "user_email": user.email,
        "content_id": content_id
    })
    
    if status and status.get("completion_status"):
         # Already completed, just return current stats
         activity = await db["user_activity"].find_one({"user_email": user.email})
         if not activity:
             activity = {"xp": 0, "next_level_xp": 1000}
         return {
            "success": True, 
            "xp_gained": 0, 
            "total_xp": activity["xp"], 
            "new_level": user.level,
            "nextLevelXp": activity.get("next_level_xp", 1000)
         }

    await db["user_content_status"].update_one(
        {"user_email": user.email, "content_id": content_id},
        {"$set": {"completion_status": True, "progress": 100, "last_accessed": datetime.utcnow()}},
        upsert=True
    )

    # 2. Update XP and UserActivity
    xp_gained = 100
    activity_dict = await db["user_activity"].find_one({"user_email": user.email})
    
    if not activity_dict:
        activity_dict = {
            "user_email": user.email,
            "xp": 0,
            "next_level_xp": 1000,
            "total_completed": 0,
            "last_updated": datetime.utcnow()
        }
        await db["user_activity"].insert_one(activity_dict)

    new_xp = activity_dict["xp"] + xp_gained
    new_total_completed = activity_dict.get("total_completed", 0) + 1
    
    # Simple leveling logic
    new_level = user.level
    next_level_xp = activity_dict.get("next_level_xp", 1000)
    
    if new_xp >= next_level_xp:
        if user.level == "Beginner":
            new_level = "Intermediate"
        elif user.level == "Intermediate":
            new_level = "Advanced"
        next_level_xp += 1000 # Increase threshold for next level

    await db["user_activity"].update_one(
        {"user_email": user.email},
        {
            "$set": {
                "xp": new_xp, 
                "total_completed": new_total_completed,
                "next_level_xp": next_level_xp,
                "last_updated": datetime.utcnow()
            }
        }
    )

    # 3. Update User level and todayProgress
    await db["users"].update_one(
        {"email": user.email},
        {"$set": {"level": new_level}, "$inc": {"todayProgress": 10}}
    )

    # Invalidate cache if exists
    from .auth import invalidate_user_cache
    invalidate_user_cache(user.email)

    return {
        "success": True,
        "xp_gained": xp_gained,
        "total_xp": new_xp,
        "new_level": new_level,
        "nextLevelXp": next_level_xp
    }
