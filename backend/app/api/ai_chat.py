from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.database.database import collection
from app.services.ai_service import AIService

router = APIRouter(prefix="/api/ai", tags=["ai"])

class ChatRequest(BaseModel):
    document_id: str
    question: str

@router.post("/chat")
def chat_with_doc(req: ChatRequest):
    snap=collection("documents").document(str(req.document_id)).get()
    if not snap.exists: raise HTTPException(404,"Document not found")
    doc=snap.to_dict() or {}; answer=AIService().chat_with_document(doc.get("extracted_text") or "",req.question)
    return {"document_id":snap.id,"filename":doc.get("original_filename",doc.get("filename")),"question":req.question,"answer":answer}
