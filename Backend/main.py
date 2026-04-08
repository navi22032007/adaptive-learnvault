from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.database import create_db_and_tables
from .api import auth, recommendations, activity, graph, user, content

app = FastAPI(title="Adaptive LearnVault API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

@app.get("/")
def read_root():
    return {"message": "Welcome to Adaptive LearnVault API"}

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(recommendations.router, prefix="/api")
app.include_router(activity.router, prefix="/api")
app.include_router(graph.router, prefix="/api")
app.include_router(user.router, prefix="/api")
app.include_router(content.router, prefix="/api")
