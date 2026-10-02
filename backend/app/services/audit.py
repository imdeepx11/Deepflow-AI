from typing import Optional
from sqlalchemy.orm import Session
from app.database.models import AuditLog

def create_audit_log(
    db: Session,
    user_name: str,
    user_role: str,
    action: str,
    details: str,
    status: str = "Success",
    document_name: Optional[str] = None,
    workflow_name: Optional[str] = None,
    organization_id: Optional[int] = None
) -> None:
    """Helper to record audit logs cleanly with error handling."""
    try:
        entry = AuditLog(
            user_name=user_name,
            user_role=user_role,
            action=action,
            status=status,
            details=details,
            document_name=document_name,
            workflow_name=workflow_name,
            organization_id=organization_id
        )
        db.add(entry)
        db.commit()
    except Exception as e:
        print(f"Error recording audit log ({action}): {e}")
