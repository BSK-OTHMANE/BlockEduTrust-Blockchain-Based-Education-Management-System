from fastapi import APIRouter, HTTPException
from datetime import datetime
from database import assignments_collection
from models.assignment import AssignmentCreate

router = APIRouter()

# ➕ Create assignment metadata
@router.post("/")
def create_assignment(assignment: AssignmentCreate):
    existing = assignments_collection.find_one(
        {"assignmentId": assignment.assignmentId}
    )
    if existing:
        raise HTTPException(status_code=400, detail="Assignment already exists")

    assignments_collection.insert_one({
        "assignmentId": assignment.assignmentId,
        "moduleId": assignment.moduleId,
        "title": assignment.title,
        "createdAt": datetime.utcnow()
    })

    return {"message": "Assignment metadata saved"}


# 📄 List assignments by module
@router.get("/")
def list_assignments(moduleId: int):
    assignments = list(
        assignments_collection.find(
            {"moduleId": moduleId},
            {"_id": 0}
        )
    )
    return assignments
