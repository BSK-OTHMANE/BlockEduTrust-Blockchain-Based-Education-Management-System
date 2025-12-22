from fastapi import APIRouter, HTTPException
from datetime import datetime
from database import modules_collection
from models.module import ModuleCreate

router = APIRouter()

# ➕ Create module metadata
@router.post("/")
def create_module(module: ModuleCreate):
    existing = modules_collection.find_one({"moduleId": module.moduleId})
    if existing:
        raise HTTPException(status_code=400, detail="Module already exists")

    modules_collection.insert_one({
        "moduleId": module.moduleId,
        "name": module.name,
        "description": module.description,
        "professorAddress": None,
        "createdAt": datetime.utcnow()
    })

    return {"message": "Module created successfully"}


# 📄 List all modules
@router.get("/")
def list_modules():
    modules = list(modules_collection.find({}, {"_id": 0}))
    return modules


# ❌ Remove module metadata
@router.delete("/{moduleId}")
def delete_module(moduleId: int):
    result = modules_collection.delete_one({"moduleId": moduleId})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Module not found")

    return {"message": "Module removed successfully"}
