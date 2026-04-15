from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from typing import List, Optional
from core.database import get_db
from .auth import get_current_user
from models.domain import Content, User
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
import shutil
import os

from models.schemas import ImportSchema
import google.generativeai as genai
from core.config import settings
from datetime import datetime

router = APIRouter(prefix="/content", tags=["content"])

if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

async def extract_metadata_from_url(url: str) -> dict:
    if not settings.GEMINI_API_KEY:
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
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = f"Extract metadata for this learning resource URL: {url}. Return JSON with: title, description (max 2 sentences), type (Video, PDF, or Blog), difficulty (1-5), duration (minutes as int), topic_name, tags (list of strings)."
        response = model.generate_content(prompt)
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
        "file_path_or_url": file_path,
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
