import os
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/settings", tags=["settings"])

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
def get_settings():
    CONFIG["openai_key_set"] = bool(os.getenv("OPENAI_API_KEY"))
    CONFIG["gemini_key_set"] = bool(os.getenv("GEMINI_API_KEY"))
    return CONFIG

@router.post("")
def update_settings(req: UpdateSettingsRequest):
    CONFIG["provider"] = req.provider.lower()
    CONFIG["temperature"] = req.temperature
    CONFIG["confidence_threshold"] = req.confidence_threshold
    CONFIG["default_sla_hours"] = req.default_sla_hours
    CONFIG["approval_threshold_amount"] = req.approval_threshold_amount
    CONFIG["auto_routing_enabled"] = req.auto_routing_enabled

    if req.openai_api_key:
        os.environ["OPENAI_API_KEY"] = req.openai_api_key
        CONFIG["openai_key_set"] = True
    if req.gemini_api_key:
        os.environ["GEMINI_API_KEY"] = req.gemini_api_key
        CONFIG["gemini_key_set"] = True

    os.environ["AI_PROVIDER"] = CONFIG["provider"]

    return {"message": "Settings updated successfully", "config": CONFIG}
