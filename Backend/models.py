from typing import List, Optional
from sqlmodel import Field, SQLModel, Column, JSON

class Recommendation(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    type: str
    difficulty: int
    duration: int
    tags: List[str] = Field(sa_column=Column(JSON))
    reason: str
    progress: int = 0
    thumbnail: Optional[str] = None
    description: str
    instructor: str
    rating: float
    enrolled: int

class ActivityData(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    weeklyHours: List[float] = Field(sa_column=Column(JSON))
    completionRate: float
    streak: int
    totalCompleted: int
    currentLevel: str
    xp: int
    nextLevelXp: int
    weekLabels: List[str] = Field(sa_column=Column(JSON))

class GraphNode(SQLModel, table=True):
    id: str = Field(primary_key=True)
    label: str
    x: float
    y: float
    z: float
    size: float
    color: str

class GraphEdge(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    source: str
    target: str

class UserProfile(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    avatar: Optional[str] = None
    level: str
    streak: int
    todayGoal: int
    todayProgress: int
