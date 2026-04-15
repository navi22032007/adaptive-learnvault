from pydantic import BaseModel
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

class ActivityDataSchema(BaseModel):
    weeklyHours: List[float]
    completionRate: float
    streak: int
    totalCompleted: int
    currentLevel: str
    xp: int
    next_level_xp: int
    weekLabels: List[str]

class UserProfileSchema(BaseModel):
    id: str
    name: str
    avatar: Optional[str]
    level: str
    streak: int
    todayGoal: int
    todayProgress: int

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

class WhatNextSuggestion(BaseModel):
    title: str
    reason: str
    relevance: int
