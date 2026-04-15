from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, BeforeValidator
from datetime import datetime
from typing_extensions import Annotated

# Helper to convert ObjectId to str
PyObjectId = Annotated[str, BeforeValidator(str)]

class MongoBaseModel(BaseModel):
    id: Optional[PyObjectId] = Field(None, alias="_id")

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

# --- Core Entities ---

class Role(MongoBaseModel):
    name: str # Student, Teacher, Admin

class User(MongoBaseModel):
    email: str
    password: str 
    name: str
    avatar: Optional[str] = None
    level: str = "Beginner"
    streak: int = 0
    todayGoal: int = 60
    todayProgress: int = 0
    role_name: str = "Student"

class Topic(MongoBaseModel):
    name: str
    parent_topic_name: Optional[str] = None

class Tag(MongoBaseModel):
    name: str

class Content(MongoBaseModel):
    title: str
    description: str
    type: str # Video, PDF, Blog
    difficulty: int # 1 to 5
    duration: int # minutes
    language: str = "en"
    file_path_or_url: str
    thumbnail: Optional[str] = None
    instructor: str = "Admin"
    rating: float = 0.0
    enrolled: int = 0
    created_by_email: Optional[str] = None
    topic_name: Optional[str] = None
    tags: List[str] = []

class Collection(MongoBaseModel):
    name: str
    description: str
    content_ids: List[str] = []

class UserActivity(MongoBaseModel):
    user_email: str
    weekly_hours: Dict[str, float] = {}
    completion_rate: float = 0.0
    total_completed: int = 0
    xp: int = 0
    next_level_xp: int = 1000
    last_updated: datetime = Field(default_factory=datetime.utcnow)

class UserContentStatus(MongoBaseModel):
    user_email: str
    content_id: str
    view_count: int = 0
    completion_status: bool = False
    time_spent_seconds: int = 0
    liked: Optional[bool] = None
    bookmarked: bool = False
    progress: int = 0
    last_accessed: datetime = Field(default_factory=datetime.utcnow)

class GraphNode(MongoBaseModel):
    node_id: str
    label: str
    x: float
    y: float
    z: float
    size: float
    color: str

class GraphEdge(MongoBaseModel):
    source: str
    target: str
