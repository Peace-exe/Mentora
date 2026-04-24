from pydantic_settings import BaseSettings
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from ..models.universityInfo import UniversityInfo

class Settings(BaseSettings):
    MONGODB_URI : str
    DB_NAME : str = "Mentora"
    class Config:
        env_file = ".env"

settings = Settings()

DOCUMENT_MODELS = [
    UniversityInfo
    # add new models here only
]

async def connectDB():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    await init_beanie(
        database=client[settings.DB_NAME],
        document_models=DOCUMENT_MODELS
    )
    return client
async def disconnectDB(client: AsyncIOMotorClient):
    client.close()
    
