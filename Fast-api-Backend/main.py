from fastapi import FastAPI
from routes import admin_users, admin_modules
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
app = FastAPI(title="Academic Management Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(
    admin_users.router,
    prefix="/admin/users",
    tags=["Admin - Users"]
)

app.include_router(
    admin_modules.router,
    prefix="/admin/modules",
    tags=["Admin - Modules"]
)

# ========== RUN ==========
if __name__ == "__main__":
    # Use the app object directly; safer when running "python server.py"
    uvicorn.run(app, host="127.0.0.1", port=8000)