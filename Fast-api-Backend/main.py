from fastapi import FastAPI
from routes import admin_users, admin_modules
import uvicorn
app = FastAPI(title="Academic Management Backend")

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