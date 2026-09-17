import re

import firebase_admin
from firebase_admin import auth as firebase_auth
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.database.database import collection, new_id, utc_now

router = APIRouter(prefix="/api/auth", tags=["auth"])

class LoginRequest(BaseModel):
    email: str
    password: str

class GoogleLoginRequest(BaseModel):
    id_token: str

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
FIREBASE_APP_NAME = "deepflow-firestore"


def name_from_email(email: str) -> str:
    prefix = email.split("@")[0] if "@" in email else "user"
    return " ".join(p.capitalize() for p in re.split(r"[._-]+", prefix) if p) or "User"


def find_user(email: str):
    for snap in collection("users").stream():
        user = snap.to_dict() or {}
        if str(user.get("email", "")).lower() == email.lower():
            user["id"] = snap.id
            return user
    return None


def ensure_demo_user():
    user = find_user("demo@deepflow.ai")
    if user:
        return user
    user = {"id":"demo-admin","name":"Demo Administrator","email":"demo@deepflow.ai","role":"Admin","department":"Operations","avatar":"","created_at":utc_now()}
    collection("users").document(user["id"]).set(user)
    return user


def serialize_user(user):
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "role": user.get("role", "User"),
        "department": user.get("department", "Operations"),
        "avatar": user.get("avatar"),
    }


def write_login_audit(user, email, action):
    audit_id = new_id()
    collection("audit_logs").document(audit_id).set({
        "id": audit_id,
        "timestamp": utc_now(),
        "user_id": user["id"],
        "user_name": user["name"],
        "user_role": user.get("role", "User"),
        "action": action,
        "document_name": None,
        "workflow_name": None,
        "status": "Success",
        "details": f"User signed in via {action.lower().replace('_', ' ')}: {email}",
    })


@router.post("/login")
def login(req: LoginRequest):
    email = req.email.strip().lower()
    password = req.password or ""

    if not email:
        raise HTTPException(400, "Email address is required.")
    if not EMAIL_REGEX.fullmatch(email):
        raise HTTPException(400, "Invalid email format. Please provide a valid email address (e.g. name@gmail.com).")
    if len(password) < 6:
        raise HTTPException(400, "Password must contain at least 6 characters.")

    user = find_user(email)
    if not user:
        user_id = new_id()
        user = {
            "id": user_id,
            "name": "Demo Administrator" if "demo" in email or "admin" in email else name_from_email(email),
            "email": email,
            "role": "Admin" if "admin" in email or "demo" in email else "User",
            "department": "Operations",
            "avatar": None,
            "created_at": utc_now(),
        }
        collection("users").document(user_id).set(user)

    write_login_audit(user, email, "USER_LOGIN")

    return {
        "token": "demo-jwt-token-deepflow-2026",
        "user": serialize_user(user),
    }


@router.post("/google")
def login_with_google(req: GoogleLoginRequest):
    if not req.id_token or not req.id_token.strip():
        raise HTTPException(400, "Google ID token is required.")

    try:
        firebase_app = firebase_admin.get_app(FIREBASE_APP_NAME)
        decoded = firebase_auth.verify_id_token(req.id_token, app=firebase_app)
    except Exception as exc:
        raise HTTPException(401, "Google sign-in could not be verified. Please try again.") from exc

    email = str(decoded.get("email", "")).strip().lower()
    if not email or not EMAIL_REGEX.fullmatch(email):
        raise HTTPException(401, "Google account does not provide a valid email address.")
    if decoded.get("email_verified") is False:
        raise HTTPException(401, "Please use a verified Google email account.")

    user = find_user(email)
    display_name = str(decoded.get("name") or name_from_email(email)).strip()
    avatar = decoded.get("picture")

    if not user:
        user_id = new_id()
        user = {
            "id": user_id,
            "name": display_name,
            "email": email,
            "role": "User",
            "department": "Operations",
            "avatar": avatar,
            "firebase_uid": decoded.get("uid"),
            "created_at": utc_now(),
        }
        collection("users").document(user_id).set(user)
    else:
        changes = {}
        if display_name and user.get("name") != display_name:
            changes["name"] = display_name
        if avatar and user.get("avatar") != avatar:
            changes["avatar"] = avatar
        if decoded.get("uid") and user.get("firebase_uid") != decoded.get("uid"):
            changes["firebase_uid"] = decoded.get("uid")
        if changes:
            collection("users").document(user["id"]).update(changes)
            user.update(changes)

    write_login_audit(user, email, "GOOGLE_LOGIN")

    return {
        "token": req.id_token,
        "user": serialize_user(user),
    }


@router.get("/me")
def me():
    user = ensure_demo_user()
    return serialize_user(user)
