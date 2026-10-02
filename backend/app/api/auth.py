import hashlib
import random
import secrets
import time
import re
import os
from fastapi import APIRouter, HTTPException, Depends, Request, BackgroundTasks, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import Organization, User
from app.services.audit import create_audit_log

# ── Firebase Admin SDK (token verification) ─────────────────────────────────
# Only initialize if FIREBASE_CREDENTIALS env var is explicitly set.
# This avoids the 30-60 second hang caused by trying to reach the GCP
# metadata server (http://metadata.google.internal) on non-GCP hosts like Render.
_FIREBASE_ADMIN_OK = False
firebase_auth = None

try:
    import firebase_admin
    from firebase_admin import credentials, auth as firebase_auth

    _creds_json = os.environ.get("FIREBASE_CREDENTIALS", "")
    if _creds_json and not firebase_admin._apps:
        import json as _json
        _cred_dict = _json.loads(_creds_json)
        firebase_admin.initialize_app(credentials.Certificate(_cred_dict))
        _FIREBASE_ADMIN_OK = True
    elif not _creds_json:
        print("[auth] FIREBASE_CREDENTIALS not set — Firebase Admin authentication is unavailable.")
except Exception as _fb_err:
    print(f"[auth] firebase-admin init skipped: {_fb_err}")
    _FIREBASE_ADMIN_OK = False
    firebase_auth = None


router = APIRouter(prefix="/api/auth", tags=["auth"])

# ── Helpers ──────────────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), b'nexora_salt_2026', 100000).hex()

def verify_password(password: str, hashed: str) -> bool:
    if not password or not hashed:
        return False
    return hash_password(password) == hashed

def serialize_user(user: User) -> dict:
    organization = user.organization
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "role": user.role,
        "department": user.department,
        "avatar": user.avatar,
        "organization_id": user.organization_id,
        "organization_name": organization.name if organization else None,
    }


def _workspace_slug(email: str, user_id: int) -> str:
    local = (email.split("@")[0] if email and "@" in email else "workspace").lower()
    local = re.sub(r"[^a-z0-9]+", "-", local).strip("-") or "workspace"
    return f"{local}-{user_id}"


def ensure_user_workspace(db: Session, user: User) -> Organization:
    if user.organization_id and user.organization:
        return user.organization

    organization = Organization(
        name=f"{user.name or 'User'}'s Workspace",
        slug=_workspace_slug(user.email, user.id),
        settings={}
    )
    db.add(organization)
    db.flush()
    user.organization_id = organization.id
    db.commit()
    db.refresh(user)
    return organization

def get_client_ip(request: Request) -> str:
    return request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown")

def require_auth(authorization: str = Header(default=None), db: Session = Depends(get_db)) -> User:
    """Require a valid Firebase ID token and return the tenant-scoped backend user."""
    if not _FIREBASE_ADMIN_OK or not firebase_auth:
        raise HTTPException(status_code=503, detail="Authentication service is not configured on the backend.")

    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Authentication required.")

    id_token = authorization.split(" ", 1)[1].strip()
    if not id_token:
        raise HTTPException(status_code=401, detail="Authentication required.")

    try:
        decoded = firebase_auth.verify_id_token(id_token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired authentication token.")

    if decoded.get("email_verified") is not True:
        raise HTTPException(status_code=403, detail="Please verify your email address before accessing NEXORA AI.")

    firebase_uid = (decoded.get("uid") or "").strip()
    email = (decoded.get("email") or "").strip().lower()
    if not firebase_uid or not email:
        raise HTTPException(status_code=401, detail="Authenticated identity is incomplete.")

    user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
    if not user:
        user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Authenticated user is not registered in NEXORA AI.")

    if user.firebase_uid and user.firebase_uid != firebase_uid:
        raise HTTPException(status_code=401, detail="Firebase identity does not match this NEXORA account.")

    if not user.firebase_uid:
        user.firebase_uid = firebase_uid

    ensure_user_workspace(db, user)
    db.commit()
    return user


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
    """Legacy login endpoint; Firebase is the only production authentication source."""
    if os.environ.get("ALLOW_LEGACY_EMAIL_AUTH", "false").lower() != "true":
        raise HTTPException(status_code=410, detail="Legacy email login is disabled. Use Firebase authentication.")
    email_clean = req.email.strip().lower() if req.email else ""
    if not email_clean or not EMAIL_REGEX.match(email_clean):
        raise HTTPException(status_code=400, detail="Valid email address is required.")

    if not req.password:
        raise HTTPException(status_code=400, detail="Password is required.")

    user = db.query(User).filter(User.email == email_clean).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email. Please click 'Create Account' to register.")

    if not user.password_hash:
        raise HTTPException(status_code=400, detail="This account was registered with Google. Please use 'Continue with Google' to sign in.")

    if not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    create_audit_log(db, user.name, user.role, "USER_LOGIN", f"Signed in via email: {user.email} (IP: {get_client_ip(request)})")
    return {"token": f"nexora-session-{user.id}", "user": serialize_user(user)}


@router.post("/register")
def register(req: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    """Legacy registration endpoint; Firebase is the only production authentication source."""
    if os.environ.get("ALLOW_LEGACY_EMAIL_AUTH", "false").lower() != "true":
        raise HTTPException(status_code=410, detail="Legacy registration is disabled. Use Firebase authentication.")
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
    db.flush()
    ensure_user_workspace(db, user)
    db.commit()
    db.refresh(user)

    create_audit_log(
        db, user.name, user.role, "USER_REGISTERED",
        f"New user registered: {user.email} (IP: {get_client_ip(request)})",
        organization_id=user.organization_id
    )
    return {"token": f"nexora-session-{user.id}", "user": serialize_user(user)}


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
            if decoded.get("email_verified") is not True:
                raise HTTPException(status_code=403, detail="Please verify your email address before signing in.")
            verified_email = (decoded.get("email") or "").strip().lower() or None
            verified_name = decoded.get("name") or decoded.get("display_name") or None
        except HTTPException:
            raise
        except Exception:
            # Token invalid / expired — reject the request without leaking verifier details.
            raise HTTPException(
                status_code=401,
                detail="Google sign-in failed: invalid or expired token. Please try again."
            )
    else:
        raise HTTPException(
            status_code=503,
            detail="Firebase Admin authentication is not configured. Contact the administrator."
        )

    if not verified_email:
        raise HTTPException(status_code=400, detail="Could not retrieve email from Google account.")

    # Use name sent by frontend as a better fallback (display names from Google)
    display_name = verified_name or req.name or name_from_email(verified_email)

    firebase_uid = (decoded.get("uid") or "").strip()
    user = db.query(User).filter(User.firebase_uid == firebase_uid).first() if firebase_uid else None
    if not user:
        user = db.query(User).filter(User.email == verified_email).first()

    if not user:
        user = User(
            name=display_name,
            email=verified_email,
            firebase_uid=firebase_uid or None,
            role="User",
            department="Operations"
        )
        db.add(user)
        db.flush()
        ensure_user_workspace(db, user)
    else:
        if user.firebase_uid and firebase_uid and user.firebase_uid != firebase_uid:
            raise HTTPException(status_code=401, detail="Firebase identity does not match this NEXORA account.")
        user.firebase_uid = firebase_uid or user.firebase_uid
        if not user.name or user.name == "User":
            user.name = display_name
        ensure_user_workspace(db, user)
        db.commit()

    create_audit_log(
        db, user.name, user.role, "GOOGLE_LOGIN",
        f"Signed in via Firebase: {user.email} (IP: {get_client_ip(request)})",
        organization_id=user.organization_id
    )
    return {"token": f"nexora-session-{user.id}", "user": serialize_user(user)}


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
def me(current_user: User = Depends(require_auth)):
    return serialize_user(current_user)
