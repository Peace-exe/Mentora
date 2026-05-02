from beanie import Document
from bson import ObjectId as BsonObjectId
from typing import Literal, Optional
from pydantic import BaseModel, Field, field_validator

class UniversityInfo(Document):

    info : str
    infoId : str
    category : str
    source : str
    lang : Literal["en", "hin"] = "en"
    hasTable : bool
    hasURL : bool
    hasMobileNo : bool
    hasEmail : bool
    chunks: Optional[list[str]] = None
    hyQues : Optional[list[list[str]]] = None

    class Settings:
        name = "universityInfo"

class ChunkProjection(BaseModel):
    id: str = Field(alias="_id")
    chunks: Optional[list[str]] = None
    hasTable: bool
    hasURL: bool
    hasMobileNo: bool
    hasEmail: bool
    lang: str

    @field_validator("id", mode="before")
    def convert_objectid(cls, v):
        return str(v)

    model_config = {"populate_by_name": True}

    class Settings:
        projection = {
            "_id": 1,
            "chunks": 1,
            "hasTable": 1,
            "hasURL": 1,
            "hasMobileNo": 1,
            "hasEmail": 1,
            "lang": 1
        }
