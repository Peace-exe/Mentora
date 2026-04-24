from pydantic_settings import BaseSettings
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from models.universityInfo import UniversityInfo

class Settings(BaseSettings):
    MONGODB_URI : str
    DB_NAME : str = "Mentora"
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

DOCUMENT_MODELS = [
    UniversityInfo
    # add new models here only
]

async def connectDB():
    try:
        client = AsyncIOMotorClient(settings.MONGODB_URI)
        await init_beanie(
            database=client[settings.DB_NAME],
            document_models=DOCUMENT_MODELS
        )
        print("✅ MongoDB connected successfully")
        return client
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        raise
async def disconnectDB(client: AsyncIOMotorClient):
    client.close()
    print("🔌 MongoDB disconnected")
    
