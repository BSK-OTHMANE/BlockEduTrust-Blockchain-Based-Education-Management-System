from fastapi import APIRouter, HTTPException
from datetime import datetime
from database import users_collection
from models.user import UserCreate

router = APIRouter()

# ➕ Add user
@router.post("/")
def create_user(user: UserCreate):
    existing = users_collection.find_one({"address": user.address})
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")

    users_collection.insert_one({
        "address": user.address,
        "role": user.role,
        "name": user.name,
        "email": user.email,
        "createdAt": datetime.utcnow()
    })

    return {"message": "User created successfully"}


# 📄 List users (optionally by role)
@router.get("/")
def list_users(role: str | None = None):
    query = {}
    if role:
        query["role"] = role

    users = list(users_collection.find(query, {"_id": 0}))
    return users


# ❌ Remove user
@router.delete("/{address}")
def delete_user(address: str):
    result = users_collection.delete_one({"address": address})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return {"message": "User removed successfully"}
