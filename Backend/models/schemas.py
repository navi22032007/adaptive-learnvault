from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class RecommendationSchema(BaseModel):
    id: str
    title: str
    type: str
    difficulty: int
    duration: int
    tags: List[str]
    reason: str
    progress: int
    thumbnail: Optional[str]
    description: str
    instructor: str
    rating: float
    enrolled: int
    ai_explanation: Optional[str] = None

class ActivityDataSchema(BaseModel):
    weeklyHours: List[float]
    completionRate: float
    streak: int
    totalCompleted: int
    currentLevel: str
    xp: int
    nextLevelXp: int
    weekLabels: List[str]

class UserProfileSchema(BaseModel):
    id: str
    name: str
    avatar: Optional[str]
    level: str
    streak: int
    todayGoal: int
    todayProgress: int
    xp: Optional[int] = 0
    nextLevelXp: Optional[int] = 1000

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class ImportSchema(BaseModel):
    url: str
    title: Optional[str] = None
    type: Optional[str] = None

class ExplainRequest(BaseModel):
    topic: str
    metadata: Optional[Dict[str, Any]] = None

class WhatNextSuggestion(BaseModel):
    title: str
    reason: str
    relevance: int

class GenerateRequest(BaseModel):
    topic: str
    level: Optional[str] = "Beginner"

class NoteSchema(BaseModel):
    content_id: str
    text: str

class NoteResponse(BaseModel):
    text: str

class GraphNode(BaseModel):
    id: str
    label: str
    type: str # topic, content
    color: str

class GraphEdge(BaseModel):
    from_node: str # mapped from 'from' in code
    to: str
    label: str

class GraphResponse(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]

class ChatMessageSchema(BaseModel):
    role: str
    content: str
    options: Optional[List[str]] = None

class ChatSessionSchema(BaseModel):
    id: str
    title: str
    messages: List[ChatMessageSchema]

class AgentChatRequest(BaseModel):
    session_id: Optional[str] = None
    message: str

class CompletionResponse(BaseModel):
    success: bool
    xp_gained: int
    total_xp: int
    new_level: str
    nextLevelXp: int
