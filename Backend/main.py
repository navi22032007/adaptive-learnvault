from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import auth, recommendations, activity, graph, user, content

from core.database import get_db

app = FastAPI(title="Adaptive LearnVault API")

@app.on_event("startup")
async def startup_event():
    db = await get_db()
    dummy_user = await db["users"].find_one({"email": "dummy@example.com"})
    if not dummy_user:
        await db["users"].insert_one({
            "email": "dummy@example.com",
            "name": "Dummy User",
            "password": "dummy_password", 
            "level": "Beginner",
            "role_name": "Student",
            "streak": 0,
            "todayGoal": 60,
            "todayProgress": 0
        })
        print("Initialized dummy user: dummy@example.com")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, replace with specific origins
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
