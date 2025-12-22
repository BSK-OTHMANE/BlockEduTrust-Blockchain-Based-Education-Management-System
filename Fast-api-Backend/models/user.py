from pydantic import BaseModel, EmailStr
from datetime import datetime

class UserCreate(BaseModel):
    address: str
    role: str
    name: str
    email: EmailStr

class UserResponse(BaseModel):
    address: str
    role: str
    name: str
    email: EmailStr
    createdAt: datetime
