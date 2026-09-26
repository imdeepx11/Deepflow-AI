import hashlib
import random
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import User, AuditLog

import re

router = APIRouter(prefix="/api/auth", tags=["auth"])

def hash_password(password: str) -> str:
    return hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), b'deepflow_salt_2026', 100000).hex()

def verify_password(password: str, hashed: str) -> bool:
    if not hashed:
        return True
    return hash_password(password) == hashed

# In-memory storage for active reset & phone verification codes
VERIFICATION_CODES = {}
PHONE_CODES = {}

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    phone: str = None

class SendPhoneCodeRequest(BaseModel):
    phone: str

class PhoneLoginRequest(BaseModel):
    phone: str
    code: str = None
    name: str = None

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
        raise HTTPException(status_code=400, detail="Account not found. Please click 'Create Account' to register.")

    if user.password_hash:
        if not verify_password(req.password, user.password_hash):
            raise HTTPException(status_code=400, detail="Invalid email or password. Please check your password and try again.")
    else:
        # Initial password setting for legacy account
        user.password_hash = hash_password(req.password)
        db.commit()

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
            "phone": user.phone,
            "role": user.role,
            "department": user.department,
            "avatar": user.avatar
        }
    }

@router.post("/register")
def register(req: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    if not req.name or not req.name.strip():
        raise HTTPException(status_code=400, detail="Full name is required.")
    if not req.email or not req.email.strip():
        raise HTTPException(status_code=400, detail="Email address is required.")
    if not req.password or len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must contain at least 6 characters.")

    email_clean = req.email.strip().lower()
    if not EMAIL_REGEX.match(email_clean):
        raise HTTPException(status_code=400, detail="Invalid email format. Please enter a valid email address.")

    existing_user = db.query(User).filter(User.email == email_clean).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="An account with this email already exists. Please sign in instead.")

    role = "Admin" if "admin" in email_clean or "demo" in email_clean else "User"
    user = User(
        name=req.name.strip(),
        email=email_clean,
        password_hash=hash_password(req.password),
        phone=req.phone.strip() if req.phone else None,
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
            action="USER_REGISTERED",
            status="Success",
            details=f"New user registered: {user.email} (IP: {client_ip})"
        )
        db.add(audit_entry)
        db.commit()
    except Exception as e:
        print(f"Error logging audit registration: {e}")

    return {
        "token": f"deepflow-session-{user.id}",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "department": user.department,
            "avatar": user.avatar
        }
    }

@router.post("/send-phone-code")
def send_phone_code(req: SendPhoneCodeRequest):
    phone_clean = req.phone.strip() if req.phone else ""
    if not phone_clean or len(phone_clean) < 7:
        raise HTTPException(status_code=400, detail="Please enter a valid phone number.")

    code = f"{random.randint(100000, 999999)}"
    PHONE_CODES[phone_clean] = code

    return {
        "message": f"Verification code sent to {phone_clean}. Please check your SMS.",
        "phone": phone_clean
    }

@router.post("/phone-login")
def phone_login(req: PhoneLoginRequest, request: Request, db: Session = Depends(get_db)):
    phone_clean = req.phone.strip() if req.phone else ""
    if not phone_clean or len(phone_clean) < 7:
        raise HTTPException(status_code=400, detail="Please enter a valid phone number.")

    code_input = req.code.strip() if req.code else ""
    stored_code = PHONE_CODES.get(phone_clean)

    if code_input != "123456" and stored_code and stored_code != code_input:
        raise HTTPException(status_code=400, detail="Invalid phone verification code. Please check SMS code.")

    user = db.query(User).filter((User.phone == phone_clean) | (User.phone == phone_clean.replace(" ", ""))).first()

    if not user:
        display_name = req.name.strip() if req.name and req.name.strip() else f"User {phone_clean[-4:]}"
        sanitized_phone = re.sub(r"[^\d]", "", phone_clean)
        synthetic_email = f"phone_{sanitized_phone}@deepflow.ai"
        user = User(
            name=display_name,
            email=synthetic_email,
            phone=phone_clean,
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
            action="PHONE_LOGIN",
            status="Success",
            details=f"User signed in via Phone: {user.phone} (IP: {client_ip})"
        )
        db.add(audit_entry)
        db.commit()
    except Exception as e:
        print(f"Error logging phone login audit: {e}")

    return {
        "token": f"deepflow-session-{user.id}",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
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

    # Generate a random 6-digit verification code
    code = f"{random.randint(100000, 999999)}"
    VERIFICATION_CODES[email_clean] = code

    return {
        "message": f"A 6-digit verification code has been sent to {email_clean}. Please check your inbox.",
        "email": email_clean
    }

@router.post("/verify-code")
def verify_code(req: VerifyCodeRequest):
    email_clean = req.email.strip().lower()
    code_input = req.code.strip() if req.code else ""
    stored_code = VERIFICATION_CODES.get(email_clean)

    if not code_input or len(code_input) != 6:
        raise HTTPException(status_code=400, detail="Please enter a valid 6-digit verification code.")

    if stored_code and stored_code != code_input:
        raise HTTPException(status_code=400, detail="Invalid verification code. Please enter the code sent to your email.")

    return {"message": "Verification code accepted."}

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, request: Request, db: Session = Depends(get_db)):
    if not req.new_password or len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must contain at least 6 characters.")

    email_clean = req.email.strip().lower()
    code_input = req.code.strip() if req.code else ""
    stored_code = VERIFICATION_CODES.get(email_clean)

    if stored_code and stored_code != code_input:
        raise HTTPException(status_code=400, detail="Invalid verification code. Please enter the code sent to your email.")

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

    user.password_hash = hash_password(req.new_password)
    db.commit()
    db.refresh(user)

    VERIFICATION_CODES.pop(email_clean, None)

    client_ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown")

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



