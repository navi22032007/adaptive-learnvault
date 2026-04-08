from sqlmodel import create_engine, Session, SQLModel
from .config import settings

# Handling for different db connectors
engine_url = settings.DATABASE_URL
if engine_url.startswith("postgres://"):
    engine_url = engine_url.replace("postgres://", "postgresql://", 1)

# Check if SQLite is being used
connect_args = {"check_same_thread": False} if "sqlite" in engine_url else {}

engine = create_engine(engine_url, echo=True, connect_args=connect_args)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
