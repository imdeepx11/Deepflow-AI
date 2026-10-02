import os
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import User

from app.api.auth import require_auth

router = APIRouter(prefix="/api/settings", tags=["settings"], dependencies=[Depends(require_auth)])

# Global runtime config state
CONFIG = {
    "provider": os.getenv("AI_PROVIDER", "demo"),
    "openai_key_set": bool(os.getenv("OPENAI_API_KEY")),
    "gemini_key_set": bool(os.getenv("GEMINI_API_KEY")),
    "temperature": 0.1,
    "confidence_threshold": 80,
    "default_sla_hours": 24,
    "approval_threshold_amount": 50000,
    "auto_routing_enabled": True
}

class UpdateSettingsRequest(BaseModel):
    provider: str
    temperature: float = 0.1
    confidence_threshold: int = 80
    default_sla_hours: int = 24
    approval_threshold_amount: int = 50000
    auto_routing_enabled: bool = True
    openai_api_key: str = None
    gemini_api_key: str = None

@router.get("")
def get_settings(db: Session = Depends(get_db), current_user: User = Depends(require_auth)):
    stored = current_user.organization.settings if current_user.organization else {}
    config = {
        **CONFIG,
        **(stored or {}),
        "openai_key_set": bool(os.getenv("OPENAI_API_KEY")),
        "gemini_key_set": bool(os.getenv("GEMINI_API_KEY")),
    }
    return config


@router.post("")
def update_settings(
    req: UpdateSettingsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_auth)
):
    organization = current_user.organization
    if not organization:
        raise HTTPException(status_code=500, detail="Workspace is not configured for this account.")

    workspace_config = {
        "provider": req.provider.lower(),
        "temperature": req.temperature,
        "confidence_threshold": req.confidence_threshold,
        "default_sla_hours": req.default_sla_hours,
        "approval_threshold_amount": req.approval_threshold_amount,
        "auto_routing_enabled": req.auto_routing_enabled,
    }
    organization.settings = workspace_config
    db.commit()
    db.refresh(organization)

    if req.openai_api_key:
        os.environ["OPENAI_API_KEY"] = req.openai_api_key
    if req.gemini_api_key:
        os.environ["GEMINI_API_KEY"] = req.gemini_api_key

    # Environment keys remain server-wide; workspace workflow configuration is tenant-scoped.
    return {
        "message": "Workspace settings updated successfully",
        "config": {
            **workspace_config,
            "openai_key_set": bool(os.getenv("OPENAI_API_KEY")),
            "gemini_key_set": bool(os.getenv("GEMINI_API_KEY")),
        }
    }
