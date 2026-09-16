import os
import shutil
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database.database import get_db
from app.database.models import Document, DocumentAnalysis, Workflow, WorkflowStep, Approval, AuditLog
from app.services.document_processor import DocumentProcessor
from app.services.ai_service import AIService

router = APIRouter(prefix="/api/documents", tags=["documents"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

class ApprovalRequest(BaseModel):
    action: str = "Approve" # Approve, Reject, Request Changes
    approver_name: str = "Finance Manager"
    approver_role: str = "Finance Manager"
    comments: Optional[str] = None

@router.get("")
def list_documents(
    doc_type: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    uploaded_by: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Document)
    if uploaded_by and uploaded_by != "All" and "demo" not in uploaded_by.lower() and "admin" not in uploaded_by.lower():
        query = query.filter(Document.uploaded_by.ilike(f"%{uploaded_by}%"))
    if doc_type and doc_type != "All":
        query = query.join(DocumentAnalysis, isouter=True).filter(DocumentAnalysis.document_type == doc_type)
    if status and status != "All":
        query = query.filter(Document.status == status)
    if priority and priority != "All":
        query = query.filter(Document.priority == priority)
    if search:
        query = query.filter(Document.filename.ilike(f"%{search}%"))

    docs = query.order_by(Document.created_at.desc()).all()
    results = []
    for d in docs:
        analysis_data = None
        if d.analysis:
            analysis_data = {
                "document_type": d.analysis.document_type,
                "confidence": d.analysis.confidence,
                "priority": d.analysis.priority,
                "risk_level": d.analysis.risk_level,
                "risk_score": d.analysis.risk_score,
                "recommended_action": d.analysis.recommended_action
            }
        results.append({
            "id": d.id,
            "filename": d.filename,
            "original_filename": d.original_filename,
            "file_type": d.file_type,
            "file_size": d.file_size,
            "status": d.status,
            "priority": d.priority,
            "confidence": d.confidence,
            "uploaded_by": d.uploaded_by,
            "created_at": d.created_at.isoformat(),
            "analysis": analysis_data
        })
    return results

@router.get("/{doc_id}")
def get_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    analysis_dict = None
    if doc.analysis:
        analysis_dict = {
            "id": doc.analysis.id,
            "document_type": doc.analysis.document_type,
            "confidence": doc.analysis.confidence,
            "priority": doc.analysis.priority,
            "priority_reason": doc.analysis.priority_reason,
            "risk_level": doc.analysis.risk_level,
            "risk_score": doc.analysis.risk_score,
            "extracted_fields": doc.analysis.extracted_fields or {},
            "risks": doc.analysis.risks or [],
            "summary": doc.analysis.summary or [],
            "recommended_action": doc.analysis.recommended_action,
            "department": doc.analysis.department,
            "assigned_role": doc.analysis.assigned_role,
            "sla_hours": doc.analysis.sla_hours,
            "workflow": doc.analysis.raw_ai_response.get("workflow", []) if doc.analysis.raw_ai_response else []
        }

    workflows_list = []
    for wf in doc.workflows:
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
            for s in wf.steps
        ]
        workflows_list.append({
            "id": wf.id,
            "name": wf.name,
            "current_step_index": wf.current_step_index,
            "status": wf.status,
            "steps": steps_list
        })

    approvals_list = [
        {
            "id": a.id,
            "action": a.action,
            "approver_name": a.approver_name,
            "approver_role": a.approver_role,
            "comments": a.comments,
            "created_at": a.created_at.isoformat()
        }
        for a in doc.approvals
    ]

    return {
        "id": doc.id,
        "filename": doc.filename,
        "original_filename": doc.original_filename,
        "file_type": doc.file_type,
        "file_size": doc.file_size,
        "extracted_text": doc.extracted_text,
        "status": doc.status,
        "priority": doc.priority,
        "confidence": doc.confidence,
        "uploaded_by": doc.uploaded_by,
        "created_at": doc.created_at.isoformat(),
        "analysis": analysis_dict,
        "workflows": workflows_list,
        "approvals": approvals_list
    }

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    uploaded_by: str = Form("Admin"),
    db: Session = Depends(get_db)
):
    valid_exts = [".pdf", ".docx", ".doc", ".txt"]
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in valid_exts:
        raise HTTPException(status_code=400, detail=f"Unsupported file format {ext}. Allowed: PDF, DOCX, TXT")

    saved_filename = f"{int(datetime.utcnow().timestamp())}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, saved_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(file_path)

    # Extract text content
    extracted_text = DocumentProcessor.extract_text(file_path, ext)

    doc = Document(
        filename=saved_filename,
        original_filename=file.filename,
        file_type=ext.replace(".", "").upper(),
        file_size=file_size,
        storage_path=file_path,
        extracted_text=extracted_text,
        status="Uploaded",
        priority="Medium",
        uploaded_by=uploaded_by
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Create Audit Log
    log = AuditLog(
        user_name=uploaded_by,
        user_role="Admin",
        action="Uploaded Document",
        document_name=doc.original_filename,
        status="Success",
        details=f"Uploaded file {doc.original_filename} ({doc.file_size} bytes)"
    )
    db.add(log)
    db.commit()

    return {"message": "Document uploaded successfully", "id": doc.id}

@router.post("/{doc_id}/analyze")
def analyze_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    ai_service = AIService()
    res = ai_service.analyze_document(doc.original_filename, doc.extracted_text or "")

    # Update doc
    doc.status = "Pending Approval"
    doc.priority = res.get("priority", "Medium")
    doc.confidence = res.get("confidence", 0.90)

    # Save or update Analysis
    if doc.analysis:
        analysis = doc.analysis
    else:
        analysis = DocumentAnalysis(document_id=doc.id)
        db.add(analysis)

    analysis.document_type = res.get("document_type", "General")
    analysis.confidence = res.get("confidence", 0.90)
    analysis.priority = res.get("priority", "Medium")
    analysis.priority_reason = res.get("priority_reason", "")
    analysis.risk_level = res.get("risk_level", "LOW")
    analysis.risk_score = res.get("risk_score", 10)
    analysis.extracted_fields = res.get("extracted_fields", {})
    analysis.risks = res.get("risks", [])
    analysis.summary = res.get("summary", [])
    analysis.recommended_action = res.get("recommended_action", "Review")
    analysis.department = res.get("department", "Operations")
    analysis.assigned_role = res.get("assigned_role", "Manager")
    analysis.sla_hours = res.get("sla_hours", 24)
    analysis.raw_ai_response = res

    # Create or update Workflow automatically based on AI response
    if doc.workflows:
        for old_wf in list(doc.workflows):
            db.delete(old_wf)
        db.commit()

    raw_steps = res.get("workflow", [])
    if not raw_steps:
        raw_steps = [
            {"step_name": "Document Ingestion", "node_type": "Start", "role": "System", "status": "Completed"},
            {"step_name": "AI Content Analysis", "node_type": "AI Analysis", "role": "AI System", "status": "Completed"},
            {"step_name": "Field Validation", "node_type": "Document Validation", "role": "System", "status": "Completed"},
            {"step_name": f"{analysis.assigned_role} Signoff", "node_type": "Approval", "role": analysis.assigned_role, "status": "Active"},
            {"step_name": "Archival & ERP Sync", "node_type": "End", "role": "System", "status": "Pending"}
        ]

    active_idx = 0
    for i, s in enumerate(raw_steps):
        if s.get("status") == "Active":
            active_idx = i
            break

    wf = Workflow(
        document_id=doc.id,
        name=f"{analysis.document_type} Routing Workflow",
        description=f"Automated AI routing workflow for {doc.original_filename}",
        status="Active",
        current_step_index=active_idx
    )
    db.add(wf)
    db.commit()
    db.refresh(wf)

    for i, s in enumerate(raw_steps):
        w_step = WorkflowStep(
            workflow_id=wf.id,
            step_index=i,
            step_name=s.get("step_name", f"Step {i+1}"),
            node_type=s.get("node_type", "Approval"),
            role=s.get("role", "Manager"),
            status=s.get("status", "Pending")
        )
        if s.get("status") == "Completed":
            w_step.completed_at = datetime.utcnow()
        db.add(w_step)

    db.commit()

    # Audit log
    log = AuditLog(
        user_name="AI Engine",
        user_role="System",
        action="Analyzed Document",
        document_name=doc.original_filename,
        workflow_name=f"{analysis.document_type} Routing Workflow",
        status="Success",
        details=f"AI Classified as {analysis.document_type} ({int(analysis.confidence * 100)}% confidence). Risk Level: {analysis.risk_level}"
    )
    db.add(log)
    db.commit()

    return {"message": "Analysis completed successfully", "doc_id": doc.id}

@router.post("/{doc_id}/approve")
def approve_document(doc_id: int, req: ApprovalRequest, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    doc.status = "Approved" if req.action == "Approve" else "Rejected" if req.action == "Reject" else "Under Review"

    # Add approval record
    appr = Approval(
        document_id=doc.id,
        action=req.action,
        approver_name=req.approver_name,
        approver_role=req.approver_role,
        comments=req.comments or f"{req.action} decision submitted via decision modal."
    )
    db.add(appr)

    # Progress workflow step if present
    for wf in doc.workflows:
        active_step = db.query(WorkflowStep).filter(
            WorkflowStep.workflow_id == wf.id,
            WorkflowStep.status == "Active"
        ).first()
        if active_step:
            if req.action == "Approve":
                active_step.status = "Completed"
                active_step.completed_at = datetime.utcnow()
                active_step.comments = req.comments

                next_step = db.query(WorkflowStep).filter(
                    WorkflowStep.workflow_id == wf.id,
                    WorkflowStep.step_index == active_step.step_index + 1
                ).first()
                if next_step:
                    next_step.status = "Active"
                    wf.current_step_index = next_step.step_index
                else:
                    wf.status = "Completed"
            elif req.action == "Reject":
                active_step.status = "Rejected"
                active_step.completed_at = datetime.utcnow()
                active_step.comments = req.comments
                wf.status = "Failed"
            else: # Request Changes / Under Review
                active_step.status = "Active"
                active_step.comments = f"Review requested: {req.comments or 'Under compliance review'}"
                wf.status = "Under Review"

    db.commit()

    action_label = "Approved Document" if req.action == "Approve" else "Rejected Document" if req.action == "Reject" else "Review Requested"
    log = AuditLog(
        user_name=req.approver_name,
        user_role=req.approver_role,
        action=action_label,
        document_name=doc.original_filename,
        workflow_name=doc.workflows[0].name if doc.workflows else None,
        status="Success" if req.action == "Approve" else "Warning",
        details=f"{action_label} by {req.approver_name} ({req.approver_role}). Comments: {req.comments or 'None'}"
    )
    db.add(log)
    db.commit()

    return {"message": f"Document {req.action.lower()}d successfully"}

@router.delete("/{doc_id}")
def delete_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    filename = doc.original_filename
    db.delete(doc)
    db.commit()

    log = AuditLog(
        user_name="Admin",
        user_role="Admin",
        action="Deleted Document",
        document_name=filename,
        status="Warning",
        details=f"Document {filename} removed from system."
    )
    db.add(log)
    db.commit()

    return {"message": "Document deleted successfully"}
