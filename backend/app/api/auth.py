from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import User, AuditLog

import re

router = APIRouter(prefix="/api/auth", tags=["auth"])

class LoginRequest(BaseModel):
    email: str
    password: str

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")

def name_from_email(email: str) -> str:
    if not email or "@" not in email:
        return "User"
    prefix = email.split("@")[0]
    parts = [p.capitalize() for p in prefix.replace(".", " ").replace("_", " ").replace("-", " ").split()]
    return " ".join(parts) if parts else "User"

@router.post("/login")
def login(req: LoginRequest, request: Request, db: Session = Depends(get_db)):
    if not req.email or not req.email.strip():
        raise HTTPException(status_code=400, detail="Email address is required.")

    email_clean = req.email.strip().lower()
    
    if not EMAIL_REGEX.match(email_clean):
        raise HTTPException(status_code=400, detail="Invalid email format. Please provide a valid email address (e.g. name@gmail.com).")

    user = db.query(User).filter(User.email == email_clean).first()
    
    if not user:
        derived_name = "Demo Administrator" if "demo" in email_clean or "admin" in email_clean else name_from_email(email_clean)
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

    # Get real client IP
    client_ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown")

    # Store login audit record
    try:
        audit_entry = AuditLog(
            user_id=user.id if hasattr(AuditLog, "user_id") else None,
            user_name=user.name,
            action="USER_LOGIN",
            details=f"User signed in via email: {user.email}",
            ip_address=client_ip
        )
        db.add(audit_entry)
        db.commit()
    except Exception as e:
        print(f"Error logging audit sign-in: {e}")

    return {
        "token": f"deepflow-session-{user.id}",
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
def me(user_id: int = None, db: Session = Depends(get_db)):
    """Return the current user. Accepts optional user_id query param (set by frontend from login response)."""
    if user_id:
        user = db.query(User).filter(User.id == user_id).first()
    else:
        user = db.query(User).filter(User.email == "demo@deepflow.ai").first()
    
    if not user:
        user = db.query(User).first()
    
    if not user:
        user = User(name="Demo Administrator", email="demo@deepflow.ai", role="Admin", department="Operations")
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
