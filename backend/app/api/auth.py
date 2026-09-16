from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import User

router = APIRouter(prefix="/api/auth", tags=["auth"])

class LoginRequest(BaseModel):
    email: str
    password: str

def name_from_email(email: str) -> str:
    if not email or "@" not in email:
        return "User"
    prefix = email.split("@")[0]
    parts = [p.capitalize() for p in prefix.replace(".", " ").replace("_", " ").replace("-", " ").split()]
    return " ".join(parts) if parts else "User"

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    email_clean = req.email.strip().lower() if req.email else "user@deepflow.ai"
    user = db.query(User).filter(User.email == email_clean).first()
    
    if not user:
        derived_name = "Enterprise Admin" if "demo" in email_clean or "admin" in email_clean else name_from_email(email_clean)
        role = "Admin" if "admin" in email_clean or "demo" in email_clean else "User"
        user = User(
            name=derived_name,
            email=email_clean,
            role=role,
            department="Operations"
        )
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
        user = User(name="Enterprise Admin", email="demo@deepflow.ai", role="Admin", department="Operations")
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
