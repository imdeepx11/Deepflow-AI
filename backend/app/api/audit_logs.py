from typing import Optional
from fastapi import APIRouter
from app.database.database import collection, to_iso

router=APIRouter(prefix="/api/audit-logs",tags=["audit_logs"])

@router.get("")
def list_audit_logs(user_name:Optional[str]=None,action:Optional[str]=None,status:Optional[str]=None,search:Optional[str]=None):
    out=[]
    for s in collection("audit_logs").stream():
        d=s.to_dict() or {}; d["id"]=s.id
        if user_name and user_name!="All" and d.get("user_name")!=user_name: continue
        if action and action!="All" and action.lower() not in str(d.get("action","")).lower(): continue
        if status and status!="All" and d.get("status")!=status: continue
        if search and search.lower() not in " ".join([str(d.get("document_name") or ""),str(d.get("details") or ""),str(d.get("user_name") or "")]).lower(): continue
        out.append({"id":d["id"],"timestamp":to_iso(d.get("timestamp")),"user":d.get("user_name","Unknown"),"role":d.get("user_role","User"),"action":d.get("action","Unknown"),"document":d.get("document_name") or "N/A","workflow":d.get("workflow_name") or "N/A","status":d.get("status","Success"),"details":d.get("details")})
    out.sort(key=lambda x:x.get("timestamp") or "",reverse=True); return out
