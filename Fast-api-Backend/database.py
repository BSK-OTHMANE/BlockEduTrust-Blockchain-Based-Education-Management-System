from pymongo import MongoClient

MONGO_URL = "mongodb://localhost:27017"

client = MongoClient(MONGO_URL)

db = client["academic_db"]

users_collection = db["users"]
modules_collection = db["modules"]  
assignments_collection = db["assignments"]
