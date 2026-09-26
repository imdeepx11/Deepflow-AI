from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import AuditLog

router = APIRouter(prefix="/api/audit-logs", tags=["audit_logs"])

@router.get("")
def list_audit_logs(
    user_name: Optional[str] = None,
    action: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)

    if user_name and user_name != "All":
        query = query.filter(AuditLog.user_name == user_name)
    if action and action != "All":
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))
    if status and status != "All":
        query = query.filter(AuditLog.status == status)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (AuditLog.user_name.ilike(search_filter)) |
            (AuditLog.document_name.ilike(search_filter)) |
            (AuditLog.action.ilike(search_filter)) |
            (AuditLog.details.ilike(search_filter))
        )

    logs = query.order_by(AuditLog.timestamp.desc()).all()
    out = []
    for log in logs:
        out.append({
            "id": log.id,
            "timestamp": log.timestamp.isoformat() if log.timestamp else None,
            "user": log.user_name or "Unknown",
            "role": log.user_role or "User",
            "action": log.action or "Unknown",
            "document": log.document_name or "N/A",
            "workflow": log.workflow_name or "N/A",
            "status": log.status or "Success",
            "details": log.details or "N/A"
        })
    return out

