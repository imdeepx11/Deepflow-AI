from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import Workflow, WorkflowStep, Document, AuditLog

router = APIRouter(prefix="/api/workflows", tags=["workflows"])

class StepSchema(BaseModel):
    step_name: str
    node_type: str = "Approval"
    role: str = "Manager"

class CreateWorkflowRequest(BaseModel):
    name: str
    description: Optional[str] = None
    steps: List[StepSchema] = []

@router.get("")
def list_workflows(db: Session = Depends(get_db)):
    wfs = db.query(Workflow).order_by(Workflow.created_at.desc()).all()
    out = []
    for w in wfs:
        doc_name = w.document.original_filename if w.document else "Template Workflow"
        steps_list = [
            {
                "id": s.id,
                "step_index": s.step_index,
                "step_name": s.step_name,
                "node_type": s.node_type,
                "role": s.role,
                "status": s.status,
                "completed_at": s.completed_at.isoformat() if s.completed_at else None,
                "comments": s.comments
            }
            for s in w.steps
        ]
        out.append({
            "id": w.id,
            "document_id": w.document_id,
            "document_name": doc_name,
            "name": w.name,
            "description": w.description,
            "current_step_index": w.current_step_index,
            "status": w.status,
            "created_at": w.created_at.isoformat() if w.created_at else None,
            "steps": steps_list
        })
    return out

@router.get("/templates")
def get_workflow_templates():
    return [
        {"id": 1, "name": "Invoice Approval", "active_count": 18, "completed_count": 74, "avg_time": "1.8 hrs", "completion_rate": "96%", "description": "Automated routing for enterprise invoice audit and finance signoff."},
        {"id": 2, "name": "Loan Application Processing", "active_count": 9, "completed_count": 32, "avg_time": "4.2 hrs", "completion_rate": "91%", "description": "Credit check scoring, risk tiering, and credit committee approval."},
        {"id": 3, "name": "Customer Complaint Resolution", "active_count": 14, "completed_count": 81, "avg_time": "45 min", "completion_rate": "98%", "description": "Sentiment triage, priority escalation, and support agent assignment."},
        {"id": 4, "name": "Contract Legal Review", "active_count": 6, "completed_count": 29, "avg_time": "3.5 hrs", "completion_rate": "89%", "description": "Clause extraction, indemnity check, and legal counsel signoff."}
    ]

@router.get("/{wf_id}")
def get_workflow(wf_id: int, db: Session = Depends(get_db)):
    w = db.query(Workflow).filter(Workflow.id == wf_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    doc_name = w.document.original_filename if w.document else "Template Workflow"
    steps_list = [
        {
            "id": s.id,
            "step_index": s.step_index,
            "step_name": s.step_name,
            "node_type": s.node_type,
            "role": s.role,
            "status": s.status,
            "completed_at": s.completed_at.isoformat() if s.completed_at else None,
            "comments": s.comments
        }
        for s in w.steps
    ]
    return {
        "id": w.id,
        "document_id": w.document_id,
        "document_name": doc_name,
        "name": w.name,
        "description": w.description,
        "current_step_index": w.current_step_index,
        "status": w.status,
        "created_at": w.created_at.isoformat() if w.created_at else None,
        "steps": steps_list
    }

@router.post("")
def create_workflow(req: CreateWorkflowRequest, db: Session = Depends(get_db)):
    wf = Workflow(
        name=req.name,
        description=req.description or "User created workflow definition",
        status="Active",
        current_step_index=0
    )
    db.add(wf)
    db.commit()
    db.refresh(wf)

    for i, s in enumerate(req.steps):
        step = WorkflowStep(
            workflow_id=wf.id,
            step_index=i,
            step_name=s.step_name,
            node_type=s.node_type,
            role=s.role,
            status="Active" if i == 0 else "Pending"
        )
        db.add(step)

    log = AuditLog(
        user_name="Admin",
        user_role="Admin",
        action="Created Workflow Template",
        workflow_name=req.name,
        status="Success",
        details=f"Created custom workflow '{req.name}' with {len(req.steps)} steps."
    )
    db.add(log)
    db.commit()

    return {"message": "Workflow created successfully", "id": wf.id}

