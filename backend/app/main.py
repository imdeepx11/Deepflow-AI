import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database.database import get_db
from app.database.seed import seed_db
from app.api import auth, documents, workflows, analytics, audit_logs, ai_chat, settings

# Initialize Firestore through the database module and seed demo data once.
get_db()
try:
    seed_db()
except Exception as exc:
    print(f"Firestore seed note: {exc}")

app = FastAPI(
    title="DeepFlow AI Backend API",
    description="Enterprise Document Processing & Intelligent Workflow Automation Platform",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

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
        "version": "1.1.0",
        "database": "Firebase Firestore",
        "documentation": "/docs",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
