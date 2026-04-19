from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from core.database import get_db
from models.domain import User
from models.schemas import ChatSessionSchema, ChatMessageSchema, AgentChatRequest
from .auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from openai import AsyncOpenAI
from core.config import settings
from datetime import datetime
import asyncio

router = APIRouter(prefix="/agent", tags=["agent"])

# ─── Singleton async client (reuse across requests) ───
_agent_client: Optional[AsyncOpenAI] = None

def _get_client() -> Optional[AsyncOpenAI]:
    global _agent_client
    if not settings.NVIDIA_API_KEY:
        return None
    if _agent_client is None:
        _agent_client = AsyncOpenAI(
            base_url="https://integrate.api.nvidia.com/v1",
            api_key=settings.NVIDIA_API_KEY,
            timeout=120.0,
            max_retries=1,
        )
    return _agent_client


# ─── Expert System Prompt ───
SYSTEM_INSTRUCTION = """You are **LearnVault AI** — an elite Adaptive Learning Agent and Curriculum Architect.

You serve as a personal academic tutor, study planner, and knowledge synthesizer. Your responses must be **structured, actionable, and technically rich**.

## Your Core Capabilities

### 1. Lesson Plans & Study Roadmaps
When a user asks to learn a topic, generate a **structured lesson plan** in this format:
-  Learning Objective: What the student will achieve
-  Prerequisites: What they should already know
-  Study Roadmap (numbered phases with estimated time):
  - Phase 1: Foundation (Week 1-2) — list specific subtopics
  - Phase 2: Core Concepts (Week 3-4)  
  - Phase 3: Advanced & Application (Week 5-6)
-  Recommended Resources: Books, channels, documentation links
-  Practice Strategy: How to practice (projects, problems, labs)
-  Milestones & Checkpoints: How to verify mastery at each stage

### 2. Doubt Clearing & Concept Explanation
When asked to explain a concept:
- Start with a **one-line definition**
- Give an **intuitive analogy** the student can relate to
- Provide a **technical deep-dive** with key formulas/algorithms if applicable
- List **common misconceptions** students have
- End with **"Try This"** — a quick exercise to test understanding

### 3. Topic Breakdown & Exam Preparation
When a topic or subject is mentioned:
- Break it into **all major units/chapters**
- For each unit, list **key concepts, definitions, and important theorems/formulas**
- Highlight **frequently asked exam questions** and **high-weightage areas**
- Provide **memory aids** (mnemonics, visual cues) where helpful

### 4. Study Methods & Techniques  
Recommend evidence-based study techniques:
- Spaced repetition schedules
- Active recall strategies  
- Feynman technique application
- Pomodoro-based study sessions

## Response Formatting Rules
- Always use **Markdown** with clear headings, bullet points, and numbered lists
- Use emojis sparingly for section headers (🎯📋🗺️📚🧪✅)
- Keep explanations **concise but complete** — avoid filler
- Use **code blocks** for algorithms, formulas, or pseudocode
- Use **tables** for comparisons or structured data
- When mentioning time estimates, be realistic and specific

## Tone
Professional yet encouraging. You are a mentor, not a textbook. Be direct, skip unnecessary pleasantries after the first message, and focus on delivering maximum value per response.
"""


@router.get("/sessions", response_model=List[ChatSessionSchema])
async def get_sessions(
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: User = Depends(get_current_user)
):
    cursor = db["chat_sessions"].find({"user_email": user.email}).sort("updated_at", -1)
    sessions = await cursor.to_list(100)
    
    result = []
    for s in sessions:
        result.append(ChatSessionSchema(
            id=str(s["_id"]),
            title=s.get("title", "New Chat"),
            messages=[]
        ))
    return result

@router.get("/sessions/{session_id}", response_model=ChatSessionSchema)
async def get_session_history(
    session_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: User = Depends(get_current_user)
):
    session = await db["chat_sessions"].find_one({"_id": ObjectId(session_id), "user_email": user.email})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    messages_cursor = db["chat_messages"].find({"session_id": session_id}).sort("timestamp", 1)
    messages = await messages_cursor.to_list(1000)
    
    msg_list = [
        ChatMessageSchema(role=m["role"], content=m["content"]) 
        for m in messages
    ]
    
    return ChatSessionSchema(
        id=str(session["_id"]),
        title=session.get("title", "New Chat"),
        messages=msg_list
    )

@router.post("/chat", response_model=ChatSessionSchema)
async def chat_with_agent(
    req: AgentChatRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: User = Depends(get_current_user)
):
    client = _get_client()
    if not client:
        raise HTTPException(status_code=500, detail="NVIDIA API Key not configured")
        
    session_id = req.session_id
    is_new = False
    session = None
    
    if not session_id:
        # Create new session
        title = req.message[:40] + "..." if len(req.message) > 40 else req.message
        res = await db["chat_sessions"].insert_one({
            "user_email": user.email,
            "title": title,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
        session_id = str(res.inserted_id)
        is_new = True
    else:
        # Verify session
        session = await db["chat_sessions"].find_one({"_id": ObjectId(session_id), "user_email": user.email})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
            
    # Save User message
    await db["chat_messages"].insert_one({
        "session_id": session_id,
        "role": "user",
        "content": req.message,
        "timestamp": datetime.utcnow()
    })
    
    # Retrieve conversation context (last 20 messages for context window efficiency)
    messages_cursor = db["chat_messages"].find({"session_id": session_id}).sort("timestamp", -1).limit(20)
    history_docs = await messages_cursor.to_list(20)
    history_docs.reverse()  # Oldest first
    
    # Build messages for the AI
    formatted_history = [{"role": "system", "content": SYSTEM_INSTRUCTION}]
    
    # Add user context
    formatted_history.append({
        "role": "system", 
        "content": f"Student Profile: Level={user.level}, Name={user.name}. Tailor complexity to their level."
    })
    
    for doc in history_docs:
        role = "user" if doc["role"] == "user" else "assistant"
        formatted_history.append({"role": role, "content": doc["content"]})
        
    try:
        # Use non-streaming async call — NVIDIA API is slow (~30-40s)
        completion = await asyncio.wait_for(
            client.chat.completions.create(
                model="meta/llama-3.1-70b-instruct",
                messages=formatted_history,
                temperature=0.7,
                top_p=0.9,
                max_tokens=4096,
            ),
            timeout=120.0,
        )
        
        bot_response = completion.choices[0].message.content.strip()
        
    except asyncio.TimeoutError:
        bot_response = "⏱️ The AI service is taking too long. Please try again — your question has been saved."
    except Exception as e:
        print(f"Agent chat error: {e}")
        bot_response = f"I encountered a temporary issue connecting to the AI service. Please try again in a moment.\n\n*Technical detail: {str(e)[:100]}*"
    
    # Save Bot message
    await db["chat_messages"].insert_one({
        "session_id": session_id,
        "role": "bot",
        "content": bot_response,
        "timestamp": datetime.utcnow()
    })
    
    await db["chat_sessions"].update_one(
        {"_id": ObjectId(session_id)},
        {"$set": {"updated_at": datetime.utcnow()}}
    )
    
    # Return full conversation
    new_cursor = db["chat_messages"].find({"session_id": session_id}).sort("timestamp", 1)
    all_msgs = await new_cursor.to_list(1000)
    
    session_title = req.message[:40] + "..." if is_new else (session["title"] if session else req.message[:40])
    
    return ChatSessionSchema(
        id=session_id,
        title=session_title,
        messages=[ChatMessageSchema(role=m["role"], content=m["content"]) for m in all_msgs]
    )
