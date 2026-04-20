from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.server_api import ServerApi
from core.config import settings

client = AsyncIOMotorClient(settings.MONGODB_URL, server_api=ServerApi('1'))
db = client[settings.DATABASE_NAME]

async def get_db():
    return db

def create_db_and_tables():
    # MongoDB doesn't need table creation, but we could initialize indexes here
    pass
