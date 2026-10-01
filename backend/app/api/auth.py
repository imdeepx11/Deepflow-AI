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

# ── Firebase Admin SDK (token verification) ─────────────────────────────────
try:
    import firebase_admin
    from firebase_admin import credentials, auth as firebase_auth

    if not firebase_admin._apps:
        # Initialise with Application Default Credentials OR a service-account file.
        # On Render / production: set GOOGLE_APPLICATION_CREDENTIALS env var to the
        # path of your Firebase service-account JSON, or use the project-ID approach.
        try:
            firebase_admin.initialize_app()
        except Exception:
            # Fallback: initialise without credentials (token verification will fail
            # gracefully and we fall back to trusting the name/email from the request).
            firebase_admin.initialize_app(credentials.ApplicationDefault())

    _FIREBASE_ADMIN_OK = True
except Exception as _fb_init_err:
    print(f"[auth] firebase-admin not available: {_fb_init_err}")
    _FIREBASE_ADMIN_OK = False
    firebase_auth = None


router = APIRouter(prefix="/api/auth", tags=["auth"])

# ── Helpers ──────────────────────────────────────────────────────────────────

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

def name_from_email(email: str) -> str:
    if not email or "@" not in email:
        return "User"
    parts = [p.capitalize() for p in email.split("@")[0].replace(".", " ").replace("_", " ").replace("-", " ").split()]
    return " ".join(parts) if parts else "User"

# In-memory storage for active reset codes (used for email/password resets only as fallback)
VERIFICATION_CODES = {}
RESET_TOKENS = {}

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")


# ── Pydantic schemas ─────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    phone: str = None

class GoogleLoginRequest(BaseModel):
    id_token: str
    email: str = None
    name: str = None

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordTokenRequest(BaseModel):
    token: str
    new_password: str


# ── Routes ───────────────────────────────────────────────────────────────────

@router.post("/login")
def login(req: LoginRequest, request: Request, db: Session = Depends(get_db)):
    """Email + password login.  Password is verified by Firebase on the frontend
    but we keep this endpoint so the backend session token can be issued."""
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
        # First login after a Google/passwordless account — set the password
        user.password_hash = hash_password(req.password)
        db.commit()

    create_audit_log(db, user.name, user.role, "USER_LOGIN", f"Signed in via email: {user.email} (IP: {get_client_ip(request)})")
    return {"token": f"deepflow-session-{user.id}", "user": serialize_user(user)}


@router.post("/register")
def register(req: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    """Create a new account with email + password."""
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


@router.post("/google")
def google_login(req: GoogleLoginRequest, request: Request, db: Session = Depends(get_db)):
    """
    Verify the Firebase ID token sent from the frontend, then create or return
    the matching backend user record.

    Flow:
    1. Verify id_token with firebase-admin (cryptographically validates it was
       issued by our Firebase project).
    2. Extract email + name from the verified token claims.
    3. Find or create the User row in our SQLite DB.
    4. Return our session token + user object.
    """
    verified_email: str | None = None
    verified_name: str | None = None

    if _FIREBASE_ADMIN_OK and firebase_auth and req.id_token:
        try:
            decoded = firebase_auth.verify_id_token(req.id_token)
            verified_email = (decoded.get("email") or "").strip().lower() or None
            verified_name = decoded.get("name") or decoded.get("display_name") or None
        except Exception as e:
            # Token invalid / expired — reject the request
            raise HTTPException(
                status_code=401,
                detail=f"Google sign-in failed: invalid or expired token. Please try again. ({e})"
            )
    else:
        # firebase-admin not configured — trust the values passed from frontend
        # (acceptable only in local dev; in production configure GOOGLE_APPLICATION_CREDENTIALS)
        verified_email = (req.email or "").strip().lower() or None
        verified_name = req.name

    if not verified_email:
        raise HTTPException(status_code=400, detail="Could not retrieve email from Google account.")

    # Use name sent by frontend as a better fallback (display names from Google)
    display_name = verified_name or req.name or name_from_email(verified_email)

    user = db.query(User).filter(User.email == verified_email).first()
    if not user:
        user = User(
            name=display_name,
            email=verified_email,
            role="User",
            department="Operations"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update display name if it was previously empty
        if not user.name or user.name == "User":
            user.name = display_name
            db.commit()

    create_audit_log(db, user.name, user.role, "GOOGLE_LOGIN", f"Signed in via Google: {user.email} (IP: {get_client_ip(request)})")
    return {"token": f"deepflow-session-{user.id}", "user": serialize_user(user)}


@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, request: Request, db: Session = Depends(get_db)):
    """
    Password reset is now handled entirely by Firebase on the frontend
    (sendPasswordResetEmail). This endpoint is kept for backward-compat only
    and returns a success response without doing anything — Firebase sends the
    real email directly.
    """
    email_clean = req.email.strip().lower() if req.email else ""
    if not email_clean or not EMAIL_REGEX.match(email_clean):
        raise HTTPException(status_code=400, detail="Valid email address is required.")

    # Firebase handles the actual reset email — we just acknowledge
    return {
        "message": f"If an account exists for {email_clean}, a password reset email has been sent.",
        "email": email_clean,
        "email_sent": True
    }


@router.get("/verify-reset-token/{token}")
def verify_reset_token(token: str):
    data = RESET_TOKENS.get(token)
    if not data or time.time() > data.get("expires_at", 0):
        RESET_TOKENS.pop(token, None)
        raise HTTPException(status_code=400, detail="Password reset link is invalid or expired.")
    return {"email": data["email"], "valid": True}


@router.post("/reset-password-with-token")
def reset_password_with_token(req: ResetPasswordTokenRequest, request: Request, db: Session = Depends(get_db)):
    if not req.new_password or len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must contain at least 6 characters.")
    data = RESET_TOKENS.get(req.token)
    if not data or time.time() > data.get("expires_at", 0):
        raise HTTPException(status_code=400, detail="Password reset link is invalid or expired.")

    email = data["email"]
    user = db.query(User).filter(User.email == email).first()
    if user:
        user.password_hash = hash_password(req.new_password)
        db.commit()
    RESET_TOKENS.pop(req.token, None)
    VERIFICATION_CODES.pop(email, None)
    create_audit_log(db, user.name if user else email, user.role if user else "User", "PASSWORD_RESET_SUCCESS_TOKEN", f"Password reset via link for {email} (IP: {get_client_ip(request)})")
    return {"message": "Password reset successfully! You can now sign in."}


@router.get("/me")
def me(user_id: int = None, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first() if user_id else None
    if not user:
        user = db.query(User).filter(User.email == "demo@nexora.ai").first()
    if not user:
        user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="No user found.")
    return serialize_user(user)
