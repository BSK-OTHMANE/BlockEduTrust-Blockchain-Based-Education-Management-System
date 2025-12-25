from pydantic import BaseModel
from datetime import datetime

class AssignmentCreate(BaseModel):
    assignmentId: int
    moduleId: int
    title: str

class AssignmentResponse(BaseModel):
    assignmentId: int
    moduleId: int
    title: str
    createdAt: datetime
