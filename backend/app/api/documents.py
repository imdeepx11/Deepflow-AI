import os
import shutil
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel

from app.database.database import collection, new_id, utc_now, to_iso
from app.services.document_processor import DocumentProcessor
from app.services.ai_service import AIService

router = APIRouter(prefix="/api/documents", tags=["documents"])
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

class ApprovalRequest(BaseModel):
    action: str = "Approve"
    approver_name: str = "Finance Manager"
    approver_role: str = "Finance Manager"
    comments: Optional[str] = None


def _doc(doc_id):
    s = collection("documents").document(str(doc_id)).get()
    return s if s.exists else None


def _analysis(doc_id):
    s = collection("analyses").document(str(doc_id)).get()
    if not s.exists: return None
    d = s.to_dict() or {}; d["id"] = s.id; return d


def _steps(workflow_id):
    rows=[]
    for s in collection("workflow_steps").stream():
        d=s.to_dict() or {}
        if str(d.get("workflow_id")) == str(workflow_id):
            d["id"]=s.id; rows.append(d)
    rows.sort(key=lambda x:x.get("step_index",0)); return rows


def _workflows(doc_id):
    rows=[]
    for s in collection("workflows").stream():
        d=s.to_dict() or {}
        if str(d.get("document_id")) == str(doc_id):
            d["id"]=s.id; d["steps"]=_steps(s.id); rows.append(d)
    rows.sort(key=lambda x:to_iso(x.get("created_at")) or "", reverse=True); return rows


def _approvals(doc_id):
    rows=[]
    for s in collection("approvals").stream():
        d=s.to_dict() or {}
        if str(d.get("document_id")) == str(doc_id): d["id"]=s.id; rows.append(d)
    rows.sort(key=lambda x:to_iso(x.get("created_at")) or ""); return rows


def _audit(action, document_name=None, workflow_name=None, user_name="Admin", user_role="Admin", status="Success", details=None):
    lid=new_id()
    collection("audit_logs").document(lid).set({"id":lid,"timestamp":utc_now(),"user_name":user_name,"user_role":user_role,"action":action,"document_name":document_name,"workflow_name":workflow_name,"status":status,"details":details})


@router.get("")
def list_documents(doc_type:Optional[str]=None,status:Optional[str]=None,priority:Optional[str]=None,search:Optional[str]=None,uploaded_by:Optional[str]=None):
    out=[]
    for s in collection("documents").stream():
        d=s.to_dict() or {}; d["id"]=s.id; a=_analysis(s.id)
        if uploaded_by and uploaded_by!="All" and "demo" not in uploaded_by.lower() and "admin" not in uploaded_by.lower() and uploaded_by.lower() not in str(d.get("uploaded_by","")).lower(): continue
        if status and status!="All" and d.get("status")!=status: continue
        if priority and priority!="All" and d.get("priority")!=priority: continue
        if doc_type and doc_type!="All" and (not a or a.get("document_type")!=doc_type): continue
        if search and search.lower() not in str(d.get("original_filename",d.get("filename",""))).lower(): continue
        out.append({"id":d["id"],"filename":d.get("filename"),"original_filename":d.get("original_filename"),"file_type":d.get("file_type"),"file_size":d.get("file_size",0),"status":d.get("status","Uploaded"),"priority":d.get("priority","Medium"),"confidence":d.get("confidence",0),"uploaded_by":d.get("uploaded_by","Admin"),"created_at":to_iso(d.get("created_at")),"analysis":({"document_type":a.get("document_type"),"confidence":a.get("confidence"),"priority":a.get("priority"),"risk_level":a.get("risk_level"),"risk_score":a.get("risk_score"),"recommended_action":a.get("recommended_action")} if a else None)})
    out.sort(key=lambda x:x.get("created_at") or "",reverse=True); return out


@router.get("/{doc_id}")
def get_document(doc_id:str):
    s=_doc(doc_id)
    if not s: raise HTTPException(404,"Document not found")
    d=s.to_dict() or {}; a=_analysis(doc_id); wfs=_workflows(doc_id); aps=_approvals(doc_id)
    analysis=None
    if a:
        analysis={"id":a.get("id"),"document_type":a.get("document_type"),"confidence":a.get("confidence"),"priority":a.get("priority"),"priority_reason":a.get("priority_reason"),"risk_level":a.get("risk_level"),"risk_score":a.get("risk_score"),"extracted_fields":a.get("extracted_fields") or {},"risks":a.get("risks") or [],"summary":a.get("summary") or [],"recommended_action":a.get("recommended_action"),"department":a.get("department"),"assigned_role":a.get("assigned_role"),"sla_hours":a.get("sla_hours"),"workflow":(a.get("raw_ai_response") or {}).get("workflow",[])}
    return {"id":s.id,"filename":d.get("filename"),"original_filename":d.get("original_filename"),"file_type":d.get("file_type"),"file_size":d.get("file_size",0),"extracted_text":d.get("extracted_text",""),"status":d.get("status","Uploaded"),"priority":d.get("priority","Medium"),"confidence":d.get("confidence",0),"uploaded_by":d.get("uploaded_by","Admin"),"created_at":to_iso(d.get("created_at")),"analysis":analysis,"workflows":[{"id":w.get("id"),"name":w.get("name"),"current_step_index":w.get("current_step_index",0),"status":w.get("status","Active"),"steps":[{"id":x.get("id"),"step_index":x.get("step_index",0),"step_name":x.get("step_name"),"node_type":x.get("node_type"),"role":x.get("role"),"status":x.get("status"),"completed_at":to_iso(x.get("completed_at")),"comments":x.get("comments")} for x in w.get("steps",[])]} for w in wfs],"approvals":[{"id":x.get("id"),"action":x.get("action"),"approver_name":x.get("approver_name"),"approver_role":x.get("approver_role"),"comments":x.get("comments"),"created_at":to_iso(x.get("created_at"))} for x in aps]}


@router.post("/upload")
async def upload_document(file:UploadFile=File(...),uploaded_by:str=Form("Admin")):
    valid=[".pdf",".docx",".doc",".txt"]; name=file.filename or "document"; ext=os.path.splitext(name)[1].lower()
    if ext not in valid: raise HTTPException(400,f"Unsupported file format {ext}. Allowed: PDF, DOCX, TXT")
    saved=f"{int(datetime.utcnow().timestamp())}_{new_id()}_{os.path.basename(name)}"; path=os.path.join(UPLOAD_DIR,saved)
    try:
        with open(path,"wb") as buffer: shutil.copyfileobj(file.file,buffer)
    finally: await file.close()
    size=os.path.getsize(path); text=DocumentProcessor.extract_text(path,ext); did=new_id(); now=utc_now()
    collection("documents").document(did).set({"id":did,"filename":saved,"original_filename":name,"file_type":ext[1:].upper(),"file_size":size,"storage_path":path,"extracted_text":text,"status":"Uploaded","priority":"Medium","confidence":0.0,"uploaded_by":uploaded_by,"created_at":now,"updated_at":now})
    _audit("Uploaded Document",name,user_name=uploaded_by,user_role="Admin",details=f"Uploaded file {name} ({size} bytes)")
    return {"message":"Document uploaded successfully","id":did}


@router.post("/{doc_id}/analyze")
def analyze_document(doc_id:str):
    s=_doc(doc_id)
    if not s: raise HTTPException(404,"Document not found")
    d=s.to_dict() or {}; name=d.get("original_filename",d.get("filename","document")); res=AIService().analyze_document(name,d.get("extracted_text") or ""); now=utc_now()
    collection("documents").document(str(doc_id)).update({"status":"Pending Approval","priority":res.get("priority","Medium"),"confidence":res.get("confidence",.9),"updated_at":now})
    collection("analyses").document(str(doc_id)).set({"id":str(doc_id),"document_id":str(doc_id),"document_type":res.get("document_type","General"),"confidence":res.get("confidence",.9),"priority":res.get("priority","Medium"),"priority_reason":res.get("priority_reason",""),"risk_level":res.get("risk_level","LOW"),"risk_score":res.get("risk_score",10),"extracted_fields":res.get("extracted_fields",{}),"risks":res.get("risks",[]),"summary":res.get("summary",[]),"recommended_action":res.get("recommended_action","Review"),"department":res.get("department","Operations"),"assigned_role":res.get("assigned_role","Manager"),"sla_hours":res.get("sla_hours",24),"raw_ai_response":res,"created_at":now,"updated_at":now})
    for ws in list(collection("workflows").stream()):
        w=ws.to_dict() or {}
        if str(w.get("document_id"))==str(doc_id):
            for ss in list(collection("workflow_steps").stream()):
                if str((ss.to_dict() or {}).get("workflow_id"))==ws.id: collection("workflow_steps").document(ss.id).delete()
            collection("workflows").document(ws.id).delete()
    steps=res.get("workflow",[]) or [{"step_name":"Document Ingestion","node_type":"Start","role":"System","status":"Completed"},{"step_name":"AI Content Analysis","node_type":"AI Analysis","role":"AI System","status":"Completed"},{"step_name":"Field Validation","node_type":"Document Validation","role":"System","status":"Completed"},{"step_name":f"{res.get('assigned_role','Manager')} Signoff","node_type":"Approval","role":res.get("assigned_role","Manager"),"status":"Active"},{"step_name":"Archival & ERP Sync","node_type":"End","role":"System","status":"Pending"}]
    active=next((i for i,x in enumerate(steps) if x.get("status")=="Active"),0); wid=new_id(); wname=f"{res.get('document_type','General')} Routing Workflow"
    collection("workflows").document(wid).set({"id":wid,"document_id":str(doc_id),"name":wname,"description":f"Automated AI routing workflow for {name}","status":"Active","current_step_index":active,"created_at":now,"updated_at":now})
    for i,x in enumerate(steps):
        sid=new_id(); collection("workflow_steps").document(sid).set({"id":sid,"workflow_id":wid,"step_index":i,"step_name":x.get("step_name",f"Step {i+1}"),"node_type":x.get("node_type","Approval"),"role":x.get("role","Manager"),"status":x.get("status","Pending"),"completed_at":now if x.get("status")=="Completed" else None,"comments":None})
    _audit("Analyzed Document",name,wname,"AI Engine","System","Success",f"AI Classified as {res.get('document_type','General')} ({int(res.get('confidence',.9)*100)}% confidence). Risk Level: {res.get('risk_level','LOW')}")
    return {"message":"Analysis completed successfully","doc_id":str(doc_id)}


@router.post("/{doc_id}/approve")
def approve_document(doc_id:str,req:ApprovalRequest):
    s=_doc(doc_id)
    if not s: raise HTTPException(404,"Document not found")
    d=s.to_dict() or {}; action=req.action.strip().lower(); status="Approved" if action=="approve" else "Rejected" if action=="reject" else "Under Review"; now=utc_now()
    collection("documents").document(str(doc_id)).update({"status":status,"updated_at":now})
    aid=new_id(); collection("approvals").document(aid).set({"id":aid,"document_id":str(doc_id),"action":req.action,"approver_name":req.approver_name,"approver_role":req.approver_role,"comments":req.comments or f"{req.action} decision submitted via decision modal.","created_at":now})
    wname=None
    for ws in collection("workflows").stream():
        w=ws.to_dict() or {}
        if str(w.get("document_id"))!=str(doc_id): continue
        wname=wname or w.get("name"); steps=_steps(ws.id); active=next((x for x in steps if x.get("status")=="Active"),None)
        if not active: continue
        if action=="approve":
            collection("workflow_steps").document(active["id"]).update({"status":"Completed","completed_at":now,"comments":req.comments}); nxt=next((x for x in steps if x.get("step_index")==active.get("step_index",0)+1),None)
            if nxt: collection("workflow_steps").document(nxt["id"]).update({"status":"Active"}); collection("workflows").document(ws.id).update({"current_step_index":nxt.get("step_index",0),"updated_at":now})
            else: collection("workflows").document(ws.id).update({"status":"Completed","updated_at":now})
        elif action=="reject":
            collection("workflow_steps").document(active["id"]).update({"status":"Rejected","completed_at":now,"comments":req.comments}); collection("workflows").document(ws.id).update({"status":"Failed","updated_at":now})
        else:
            collection("workflow_steps").document(active["id"]).update({"status":"Active","comments":f"Review requested: {req.comments or 'Under compliance review'}"}); collection("workflows").document(ws.id).update({"status":"Under Review","updated_at":now})
    label="Approved Document" if action=="approve" else "Rejected Document" if action=="reject" else "Review Requested"
    _audit(label,d.get("original_filename"),wname,req.approver_name,req.approver_role,"Success" if action=="approve" else "Warning",f"{label} by {req.approver_name} ({req.approver_role}). Comments: {req.comments or 'None'}")
    return {"message":f"Document {req.action.lower()}d successfully"}


@router.delete("/{doc_id}")
def delete_document(doc_id:str):
    s=_doc(doc_id)
    if not s: raise HTTPException(404,"Document not found")
    d=s.to_dict() or {}; name=d.get("original_filename",d.get("filename",str(doc_id)))
    collection("documents").document(str(doc_id)).delete(); collection("analyses").document(str(doc_id)).delete()
    for ws in list(collection("workflows").stream()):
        if str((ws.to_dict() or {}).get("document_id"))==str(doc_id):
            for ss in list(collection("workflow_steps").stream()):
                if str((ss.to_dict() or {}).get("workflow_id"))==ws.id: collection("workflow_steps").document(ss.id).delete()
            collection("workflows").document(ws.id).delete()
    for ss in list(collection("approvals").stream()):
        if str((ss.to_dict() or {}).get("document_id"))==str(doc_id): collection("approvals").document(ss.id).delete()
    _audit("Deleted Document",name,details=f"Document {name} removed from system.")
    return {"message":"Document deleted successfully"}
