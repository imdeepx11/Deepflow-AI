from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import User

router = APIRouter(prefix="/api/auth", tags=["auth"])

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    # Support demo login or any valid login
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        # Create default admin user if not existing
        user = User(name="Deepak Gupta", email=req.email, role="Admin", department="Operations")
        db.add(user)
        db.commit()
        db.refresh(user)

    return {
        "token": "demo-jwt-token-deepflow-2026",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "department": user.department,
            "avatar": user.avatar
        }
    }

@router.get("/me")
def me(db: Session = Depends(get_db)):
    user = db.query(User).first()
    if not user:
        user = User(name="Deepak Gupta", email="demo@deepflow.ai", role="Admin", department="Operations")
        db.add(user)
        db.commit()
        db.refresh(user)
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "department": user.department,
        "avatar": user.avatar
    }
