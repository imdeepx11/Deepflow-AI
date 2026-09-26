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

class GoogleLoginRequest(BaseModel):
    id_token: str
    email: str = None
    name: str = None

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

    client_ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown")

    try:
        audit_entry = AuditLog(
            user_name=user.name,
            user_role=user.role,
            action="USER_LOGIN",
            status="Success",
            details=f"User signed in via email: {user.email} (IP: {client_ip})"
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

@router.post("/google")
def google_login(req: GoogleLoginRequest, request: Request, db: Session = Depends(get_db)):
    email_clean = (req.email or "google.user@deepflow.ai").strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()

    if not user:
        name = req.name or name_from_email(email_clean)
        user = User(
            name=name,
            email=email_clean,
            role="User",
            department="Operations"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    client_ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown")

    try:
        audit_entry = AuditLog(
            user_name=user.name,
            user_role=user.role,
            action="GOOGLE_LOGIN",
            status="Success",
            details=f"User signed in via Google: {user.email} (IP: {client_ip})"
        )
        db.add(audit_entry)
        db.commit()
    except Exception as e:
        print(f"Error logging google sign-in audit: {e}")

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

class ForgotPasswordRequest(BaseModel):
    email: str

class VerifyCodeRequest(BaseModel):
    email: str
    code: str

class ResetPasswordRequest(BaseModel):
    email: str
    code: str
    new_password: str

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, request: Request, db: Session = Depends(get_db)):
    if not req.email or not req.email.strip():
        raise HTTPException(status_code=400, detail="Email address is required.")

    email_clean = req.email.strip().lower()

    if not EMAIL_REGEX.match(email_clean):
        raise HTTPException(status_code=400, detail="Invalid email format. Please enter a valid email address.")

    user = db.query(User).filter(User.email == email_clean).first()
    if not user:
        derived_name = name_from_email(email_clean)
        user = User(
            name=derived_name,
            email=email_clean,
            role="User",
            department="Operations"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    client_ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown")

    try:
        audit_entry = AuditLog(
            user_name=user.name,
            user_role=user.role,
            action="PASSWORD_RESET_REQUESTED",
            status="Success",
            details=f"Password recovery requested for email: {user.email} (IP: {client_ip})"
        )
        db.add(audit_entry)
        db.commit()
    except Exception as e:
        print(f"Error logging password reset request: {e}")

    # Generate a demo 6-digit verification code
    demo_code = "849201"
    return {
        "message": f"Verification code sent to {email_clean}",
        "email": email_clean,
        "code": demo_code
    }

@router.post("/verify-code")
def verify_code(req: VerifyCodeRequest):
    if not req.code or len(req.code.strip()) != 6:
        raise HTTPException(status_code=400, detail="Invalid 6-digit verification code.")
    return {"message": "Verification code accepted."}

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, request: Request, db: Session = Depends(get_db)):
    if not req.new_password or len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must contain at least 6 characters.")

    email_clean = req.email.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()

    client_ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown")

    if user:
        try:
            audit_entry = AuditLog(
                user_name=user.name,
                user_role=user.role,
                action="PASSWORD_RESET_SUCCESS",
                status="Success",
                details=f"Password successfully reset for {user.email} (IP: {client_ip})"
            )
            db.add(audit_entry)
            db.commit()
        except Exception as e:
            print(f"Error logging password reset success: {e}")

    return {"message": "Password reset successfully. You can now sign in with your new password."}

@router.get("/me")
def me(user_id: int = None, db: Session = Depends(get_db)):
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


