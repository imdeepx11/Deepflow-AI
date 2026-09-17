import re
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.database.database import collection, new_id, utc_now

router = APIRouter(prefix="/api/auth", tags=["auth"])

class LoginRequest(BaseModel):
    email: str
    password: str

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")

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

    audit_id = new_id()
    collection("audit_logs").document(audit_id).set({
        "id": audit_id,
        "timestamp": utc_now(),
        "user_id": user["id"],
        "user_name": user["name"],
        "user_role": user.get("role", "User"),
        "action": "USER_LOGIN",
        "document_name": None,
        "workflow_name": None,
        "status": "Success",
        "details": f"User signed in via validated email: {email}",
    })

    return {
        "token": "demo-jwt-token-deepflow-2026",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user.get("role", "User"),
            "department": user.get("department", "Operations"),
            "avatar": user.get("avatar"),
        },
    }

@router.get("/me")
def me():
    user = ensure_demo_user()
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "role": user.get("role", "Admin"),
        "department": user.get("department", "Operations"),
        "avatar": user.get("avatar"),
    }
