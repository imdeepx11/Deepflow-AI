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
        query = query.filter(
            (AuditLog.document_name.ilike(f"%{search}%")) |
            (AuditLog.details.ilike(f"%{search}%")) |
            (AuditLog.user_name.ilike(f"%{search}%"))
        )

    logs = query.order_by(AuditLog.timestamp.desc()).all()
    results = []
    for l in logs:
        results.append({
            "id": l.id,
            "timestamp": l.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "user": l.user_name,
            "role": l.user_role,
            "action": l.action,
            "document": l.document_name or "N/A",
            "workflow": l.workflow_name or "N/A",
            "status": l.status,
            "details": l.details
        })
    return results
