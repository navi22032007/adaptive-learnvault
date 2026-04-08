from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship, Column, JSON
from datetime import datetime

# --- Many-to-Many Link Tables ---
class ContentTag(SQLModel, table=True):
    content_id: Optional[int] = Field(default=None, foreign_key="content.id", primary_key=True)
    tag_id: Optional[int] = Field(default=None, foreign_key="tag.id", primary_key=True)

class CollectionContent(SQLModel, table=True):
    collection_id: Optional[int] = Field(default=None, foreign_key="collection.id", primary_key=True)
    content_id: Optional[int] = Field(default=None, foreign_key="content.id", primary_key=True)

# --- Core Entities ---
class Role(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True) # Student, Teacher, Admin
    
    users: List["User"] = Relationship(back_populates="role")

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    name: str
    avatar: Optional[str] = None
    level: str = "Beginner"
    streak: int = 0
    todayGoal: int = 60
    todayProgress: int = 0
    
    role_id: Optional[int] = Field(default=None, foreign_key="role.id")
    role: Optional[Role] = Relationship(back_populates="users")
    
    activities: List["UserActivity"] = Relationship(back_populates="user")
    content_statuses: List["UserContentStatus"] = Relationship(back_populates="user")

class Topic(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)
    parent_id: Optional[int] = Field(default=None, foreign_key="topic.id")
    
    contents: List["Content"] = Relationship(back_populates="topic")

class Tag(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)
    
    contents: List["Content"] = Relationship(back_populates="tags", link_model=ContentTag)

class Content(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
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
    created_by_id: Optional[int] = Field(default=None, foreign_key="user.id")
    
    topic_id: Optional[int] = Field(default=None, foreign_key="topic.id")
    topic: Optional[Topic] = Relationship(back_populates="contents")
    
    tags: List[Tag] = Relationship(back_populates="contents", link_model=ContentTag)
    collections: List["Collection"] = Relationship(back_populates="contents", link_model=CollectionContent)
    statuses: List["UserContentStatus"] = Relationship(back_populates="content")

class Collection(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    description: str
    
    contents: List[Content] = Relationship(back_populates="collections", link_model=CollectionContent)

class UserActivity(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    # Store daily hours mapping using JSON. E.g., {"Mon": 2.5, "Tue": 3.2}
    weekly_hours_json: str = "{}"
    completion_rate: float = 0.0
    total_completed: int = 0
    xp: int = 0
    next_level_xp: int = 1000
    last_updated: datetime = Field(default_factory=datetime.utcnow)

    user: User = Relationship(back_populates="activities")

class UserContentStatus(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    content_id: int = Field(foreign_key="content.id")
    view_count: int = 0
    completion_status: bool = False # true if finished
    time_spent_seconds: int = 0
    liked: Optional[bool] = None # null=not rated, true=like, false=dislike
    bookmarked: bool = False
    progress: int = 0 # 0-100%
    last_accessed: datetime = Field(default_factory=datetime.utcnow)

    user: User = Relationship(back_populates="content_statuses")
    content: Content = Relationship(back_populates="statuses")

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

