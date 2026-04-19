from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from api import auth, recommendations, activity, graph, user, content, agent
import os

from core.database import get_db

app = FastAPI(title="Adaptive LearnVault API")

@app.on_event("startup")
async def startup_event():
    # Placeholder for legitimate startup tasks
    pass

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to Adaptive LearnVault API - Running on MongoDB"}

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(recommendations.router, prefix="/api")
app.include_router(activity.router, prefix="/api")
app.include_router(graph.router, prefix="/api")
app.include_router(user.router, prefix="/api")
app.include_router(content.router, prefix="/api")
app.include_router(agent.router, prefix="/api")

# Mount uploads directory for file retrieval
if not os.path.exists("Backend/uploads"):
    os.makedirs("Backend/uploads")
app.mount("/uploads", StaticFiles(directory="Backend/uploads"), name="uploads")
