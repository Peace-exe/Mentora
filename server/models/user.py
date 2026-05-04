from beanie import Document, Indexed
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, Literal, Annotated
from datetime import datetime, timedelta
import jwt
from dotenv import load_dotenv
from os import getenv
import re

load_dotenv()
JWT_PRIVATE_KEY = getenv('JWT_PRIVATE_KEY')

class User(Document):
    admin_id: Optional[str] = Field(None, max_length=50)
    photo_url: Optional[str] = None
    role: Literal["user", "admin"] = "user"
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    email: Annotated[str, Indexed(unique=True)]
    password: str  

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Settings:
        name = "users"
        

    
    async def validate_password(self, plain_password: str) -> bool:
        import bcrypt
        return bcrypt.checkpw(plain_password.encode(), self.password.encode())
    
    @field_validator("admin_id")
    @classmethod
    def validate_admin_id(cls, v):
        if v is None:
            return v
        uuid4_regex = r"^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"
        if not re.match(uuid4_regex, v):
            raise ValueError("admin_id must be a valid UUID v4")
        return v
    
    

    async def get_jwt(self) -> str:
        payload = {
            "_id": str(self.id),
            "role":str(self.role),
            "exp": datetime.utcnow() + timedelta(days=1)
        }
        token = jwt.encode(payload, JWT_PRIVATE_KEY, algorithm="HS256")
        return token


# --- Schemas ---

class UserRegister(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    email: EmailStr
    password: str
    photo_url: Optional[str] = None

    @field_validator("password")
    @classmethod
    def strong_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least 1 lowercase letter")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least 1 uppercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least 1 number")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError("Password must contain at least 1 special character")
        return v
    

class AdminRegister(UserRegister):
    admin_id: str = Field(..., max_length=50)  # required for admins

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    admin_id: Optional[str]
    photo_url: Optional[str]
    role: str
    first_name: str
    last_name: str
    email: EmailStr
    created_at: datetime