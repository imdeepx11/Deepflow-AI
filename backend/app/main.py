import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database.database import engine, Base
from app.database.seed import seed_db
from app.api import auth, documents, workflows, analytics, audit_logs, ai_chat, settings

# Create database tables
Base.metadata.create_all(bind=engine)

# Seed database with enterprise demo records
try:
    seed_db()
except Exception as e:
    print(f"Seed note: {e}")

app = FastAPI(
    title="DeepFlow AI Backend API",
    description="Enterprise Document Processing & Intelligent Workflow Automation Platform",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads directory exists and mount as static
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include Routers
app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(workflows.router)
app.include_router(analytics.router)
app.include_router(audit_logs.router)
app.include_router(ai_chat.router)
app.include_router(settings.router)

@app.get("/")
def root():
    return {
        "name": "DeepFlow AI API",
        "status": "online",
        "version": "1.0.0",
        "documentation": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
