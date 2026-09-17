from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.database.database import collection, new_id, utc_now, to_iso

router = APIRouter(prefix="/api/workflows", tags=["workflows"])

class StepSchema(BaseModel):
    step_name: str
    node_type: str = "Approval"
    role: str = "Manager"

class CreateWorkflowRequest(BaseModel):
    name: str
    description: Optional[str] = None
    steps: List[StepSchema] = []

def steps_for(wid):
    rows=[]
    for s in collection("workflow_steps").stream():
        d=s.to_dict() or {}
        if str(d.get("workflow_id"))==str(wid): d["id"]=s.id; rows.append(d)
    rows.sort(key=lambda x:x.get("step_index",0)); return rows

@router.get("")
def list_workflows():
    out=[]
    for s in collection("workflows").stream():
        w=s.to_dict() or {}; w["id"]=s.id; did=w.get("document_id"); name="Template Workflow"
        if did:
            ds=collection("documents").document(str(did)).get()
            if ds.exists: name=(ds.to_dict() or {}).get("original_filename","Document")
        out.append({"id":w["id"],"document_id":did,"document_name":name,"name":w.get("name"),"description":w.get("description"),"current_step_index":w.get("current_step_index",0),"status":w.get("status","Active"),"created_at":to_iso(w.get("created_at")),"steps":[{"id":x.get("id"),"step_index":x.get("step_index",0),"step_name":x.get("step_name"),"node_type":x.get("node_type"),"role":x.get("role"),"status":x.get("status"),"completed_at":to_iso(x.get("completed_at"))} for x in steps_for(s.id)]})
    out.sort(key=lambda x:x.get("created_at") or "",reverse=True); return out

@router.get("/templates")
def get_workflow_templates():
    return [{"id":1,"name":"Invoice Approval","active_count":18,"completed_count":74,"avg_time":"1.8 hrs","completion_rate":"96%","description":"Automated routing for enterprise invoice audit and finance signoff."},{"id":2,"name":"Loan Application Processing","active_count":9,"completed_count":32,"avg_time":"4.2 hrs","completion_rate":"91%","description":"Credit check scoring, risk tiering, and credit committee approval."},{"id":3,"name":"Customer Complaint Resolution","active_count":14,"completed_count":81,"avg_time":"45 min","completion_rate":"98%","description":"Sentiment triage, priority escalation, and support agent assignment."},{"id":4,"name":"Contract Legal Review","active_count":6,"completed_count":29,"avg_time":"3.5 hrs","completion_rate":"89%","description":"Clause extraction, indemnity check, and legal counsel signoff."}]

@router.get("/{wf_id}")
def get_workflow(wf_id:str):
    s=collection("workflows").document(str(wf_id)).get()
    if not s.exists: raise HTTPException(404,"Workflow not found")
    w=s.to_dict() or {}; w["id"]=s.id
    return {"id":w["id"],"document_id":w.get("document_id"),"name":w.get("name"),"description":w.get("description"),"current_step_index":w.get("current_step_index",0),"status":w.get("status","Active"),"steps":[{"id":x.get("id"),"step_index":x.get("step_index",0),"step_name":x.get("step_name"),"node_type":x.get("node_type"),"role":x.get("role"),"status":x.get("status"),"completed_at":to_iso(x.get("completed_at")),"comments":x.get("comments")} for x in steps_for(s.id)]}

@router.post("")
def create_workflow(req:CreateWorkflowRequest):
    now=utc_now(); wid=new_id()
    collection("workflows").document(wid).set({"id":wid,"document_id":None,"name":req.name,"description":req.description or "User created workflow definition","status":"Active","current_step_index":0,"created_at":now,"updated_at":now})
    for i,x in enumerate(req.steps):
        sid=new_id(); collection("workflow_steps").document(sid).set({"id":sid,"workflow_id":wid,"step_index":i,"step_name":x.step_name,"node_type":x.node_type,"role":x.role,"status":"Active" if i==0 else "Pending","completed_at":None,"comments":None})
    lid=new_id(); collection("audit_logs").document(lid).set({"id":lid,"timestamp":now,"user_name":"Admin","user_role":"Admin","action":"Created Workflow Template","document_name":None,"workflow_name":req.name,"status":"Success","details":f"Created custom workflow '{req.name}' with {len(req.steps)} steps."})
    return {"message":"Workflow created successfully","id":wid}
