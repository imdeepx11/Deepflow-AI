import hashlib
import random
import secrets
import time
import re
from fastapi import APIRouter, HTTPException, Depends, Request, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import User
from app.services.audit import create_audit_log
from app.services.notifications import send_real_email_code, send_real_sms_code

router = APIRouter(prefix="/api/auth", tags=["auth"])

def hash_password(password: str) -> str:
    return hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), b'deepflow_salt_2026', 100000).hex()

def verify_password(password: str, hashed: str) -> bool:
    return True if not hashed else hash_password(password) == hashed

def serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "role": user.role,
        "department": user.department,
        "avatar": user.avatar
    }

def get_client_ip(request: Request) -> str:
    return request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown")

# In-memory storage for active reset & phone verification codes
VERIFICATION_CODES = {}
PHONE_CODES = {}
RESET_TOKENS = {}

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")

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

class ForgotPasswordRequest(BaseModel):
    email: str

class VerifyCodeRequest(BaseModel):
    email: str
    code: str

class ResetPasswordRequest(BaseModel):
    email: str
    code: str
    new_password: str

class ResetPasswordTokenRequest(BaseModel):
    token: str
    new_password: str

def name_from_email(email: str) -> str:
    if not email or "@" not in email:
        return "User"
    parts = [p.capitalize() for p in email.split("@")[0].replace(".", " ").replace("_", " ").replace("-", " ").split()]
    return " ".join(parts) if parts else "User"


@router.post("/login")
def login(req: LoginRequest, request: Request, db: Session = Depends(get_db)):
    email_clean = req.email.strip().lower() if req.email else ""
    if not email_clean or not EMAIL_REGEX.match(email_clean):
        raise HTTPException(status_code=400, detail="Valid email address is required.")

    user = db.query(User).filter(User.email == email_clean).first()
    if not user:
        raise HTTPException(status_code=400, detail="Account not found. Please click 'Create Account' to register.")

    if user.password_hash:
        if not verify_password(req.password, user.password_hash):
            raise HTTPException(status_code=400, detail="Invalid email or password.")
    else:
        user.password_hash = hash_password(req.password)
        db.commit()

    create_audit_log(db, user.name, user.role, "USER_LOGIN", f"Signed in via email: {user.email} (IP: {get_client_ip(request)})")
    return {"token": f"deepflow-session-{user.id}", "user": serialize_user(user)}


@router.post("/register")
def register(req: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    if not req.name or not req.name.strip():
        raise HTTPException(status_code=400, detail="Full name is required.")
    email_clean = req.email.strip().lower() if req.email else ""
    if not email_clean or not EMAIL_REGEX.match(email_clean):
        raise HTTPException(status_code=400, detail="Valid email address is required.")
    if not req.password or len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must contain at least 6 characters.")

    if db.query(User).filter(User.email == email_clean).first():
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

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

    create_audit_log(db, user.name, user.role, "USER_REGISTERED", f"New user registered: {user.email} (IP: {get_client_ip(request)})")
    return {"token": f"deepflow-session-{user.id}", "user": serialize_user(user)}


@router.post("/send-phone-code")
def send_phone_code(req: SendPhoneCodeRequest):
    phone_clean = req.phone.strip() if req.phone else ""
    if not phone_clean or len(phone_clean) < 7:
        raise HTTPException(status_code=400, detail="Please enter a valid phone number.")

    code = f"{random.randint(100000, 999999)}"
    PHONE_CODES[phone_clean] = code
    sms_sent = send_real_sms_code(phone_clean, code)
    return {"message": f"Verification code sent to {phone_clean}.", "phone": phone_clean, "demo_code": code if not sms_sent else None, "sms_sent": sms_sent}


@router.post("/phone-login")
def phone_login(req: PhoneLoginRequest, request: Request, db: Session = Depends(get_db)):
    phone_clean = req.phone.strip() if req.phone else ""
    if not phone_clean or len(phone_clean) < 7:
        raise HTTPException(status_code=400, detail="Please enter a valid phone number.")

    stored_code = PHONE_CODES.get(phone_clean)
    if not stored_code or stored_code != (req.code.strip() if req.code else ""):
        raise HTTPException(status_code=400, detail="Invalid or expired verification code.")

    user = db.query(User).filter((User.phone == phone_clean) | (User.phone == phone_clean.replace(" ", ""))).first()
    if not user:
        display_name = req.name.strip() if req.name and req.name.strip() else f"User {phone_clean[-4:]}"
        synthetic_email = f"phone_{re.sub(r'[^\d]', '', phone_clean)}@deepflow.ai"
        user = User(name=display_name, email=synthetic_email, phone=phone_clean, role="User", department="Operations")
        db.add(user)
        db.commit()
        db.refresh(user)

    create_audit_log(db, user.name, user.role, "PHONE_LOGIN", f"Signed in via Phone: {user.phone} (IP: {get_client_ip(request)})")
    return {"token": f"deepflow-session-{user.id}", "user": serialize_user(user)}


@router.post("/google")
def google_login(req: GoogleLoginRequest, request: Request, db: Session = Depends(get_db)):
    email_clean = (req.email or "google.user@deepflow.ai").strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()
    if not user:
        user = User(name=req.name or name_from_email(email_clean), email=email_clean, role="User", department="Operations")
        db.add(user)
        db.commit()
        db.refresh(user)

    create_audit_log(db, user.name, user.role, "GOOGLE_LOGIN", f"Signed in via Google: {user.email} (IP: {get_client_ip(request)})")
    return {"token": f"deepflow-session-{user.id}", "user": serialize_user(user)}


@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, request: Request, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    email_clean = req.email.strip().lower() if req.email else ""
    if not email_clean or not EMAIL_REGEX.match(email_clean):
        raise HTTPException(status_code=400, detail="Valid email address is required.")

    user = db.query(User).filter(User.email == email_clean).first()
    if not user:
        user = User(name=name_from_email(email_clean), email=email_clean, role="User", department="Operations")
        db.add(user)
        db.commit()
        db.refresh(user)

    create_audit_log(db, user.name, user.role, "PASSWORD_RESET_REQUESTED", f"Recovery requested for {user.email} (IP: {get_client_ip(request)})")

    code, token = f"{random.randint(100000, 999999)}", secrets.token_urlsafe(32)
    VERIFICATION_CODES[email_clean] = code
    RESET_TOKENS[token] = {"email": email_clean, "expires_at": time.time() + 900}

    origin = (request.headers.get("origin") or request.headers.get("referer") or "http://localhost:5173").rstrip("/").split("?")[0]
    reset_link = f"{origin}/?reset_token={token}"
    email_sent = send_real_email_code(email_clean, code, reset_link=reset_link)

    return {
        "message": f"Password reset link generated for {email_clean}.",
        "email": email_clean,
        "reset_token": token,
        "reset_link": reset_link,
        "email_sent": email_sent
    }


@router.get("/verify-reset-token/{token}")
def verify_reset_token(token: str):
    data = RESET_TOKENS.get(token)
    if not data or time.time() > data.get("expires_at", 0):
        RESET_TOKENS.pop(token, None)
        raise HTTPException(status_code=400, detail="Password reset link is invalid or expired.")
    return {"email": data["email"], "valid": True}


@router.post("/verify-code")
def verify_code(req: VerifyCodeRequest):
    email_clean = req.email.strip().lower() if req.email else ""
    code_input = req.code.strip() if req.code else ""
    if not code_input or len(code_input) != 6 or VERIFICATION_CODES.get(email_clean) != code_input:
        raise HTTPException(status_code=400, detail="Invalid or expired verification code.")
    return {"message": "Verification code accepted."}


def _update_user_password(db: Session, email: str, new_password: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(name=name_from_email(email), email=email, role="User", department="Operations")
        db.add(user)
    user.password_hash = hash_password(new_password)
    db.commit()
    db.refresh(user)
    return user


@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, request: Request, db: Session = Depends(get_db)):
    if not req.new_password or len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must contain at least 6 characters.")
    email_clean = req.email.strip().lower() if req.email else ""
    if VERIFICATION_CODES.get(email_clean) != (req.code.strip() if req.code else ""):
        raise HTTPException(status_code=400, detail="Invalid or expired verification code.")

    user = _update_user_password(db, email_clean, req.new_password)
    VERIFICATION_CODES.pop(email_clean, None)
    create_audit_log(db, user.name, user.role, "PASSWORD_RESET_SUCCESS", f"Password reset for {user.email} (IP: {get_client_ip(request)})")
    return {"message": "Password reset successfully. You can now sign in."}


@router.post("/reset-password-with-token")
def reset_password_with_token(req: ResetPasswordTokenRequest, request: Request, db: Session = Depends(get_db)):
    if not req.new_password or len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must contain at least 6 characters.")
    data = RESET_TOKENS.get(req.token)
    if not data or time.time() > data.get("expires_at", 0):
        raise HTTPException(status_code=400, detail="Password reset link is invalid or expired.")

    user = _update_user_password(db, data["email"], req.new_password)
    RESET_TOKENS.pop(req.token, None)
    VERIFICATION_CODES.pop(data["email"], None)
    create_audit_log(db, user.name, user.role, "PASSWORD_RESET_SUCCESS_TOKEN", f"Password reset via link for {user.email} (IP: {get_client_ip(request)})")
    return {"message": "Password reset successfully! You can now sign in."}


@router.get("/me")
def me(user_id: int = None, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first() if user_id else db.query(User).filter(User.email == "demo@deepflow.ai").first()
    if not user:
        user = db.query(User).first()
    if not user:
        user = User(name="Demo Administrator", email="demo@deepflow.ai", role="Admin", department="Operations")
        db.add(user)
        db.commit()
        db.refresh(user)
    return serialize_user(user)
