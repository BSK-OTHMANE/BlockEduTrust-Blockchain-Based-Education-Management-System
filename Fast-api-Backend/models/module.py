from pydantic import BaseModel
from datetime import datetime

class ModuleCreate(BaseModel):
    moduleId: int
    name: str
    description: str

class ModuleResponse(BaseModel):
    moduleId: int
    name: str
    description: str
    professorAddress: str | None
    createdAt: datetime
