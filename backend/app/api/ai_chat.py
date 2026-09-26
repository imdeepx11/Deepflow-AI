from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import Document
from app.services.ai_service import AIService

router = APIRouter(prefix="/api/ai", tags=["ai"])

class ChatRequest(BaseModel):
    document_id: str
    question: str

@router.post("/chat")
def chat_with_doc(req: ChatRequest, db: Session = Depends(get_db)):
    try:
        doc_id = int(req.document_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid document_id format")

    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    answer = AIService().chat_with_document(doc.extracted_text or "", req.question)

    return {
        "document_id": doc.id,
        "filename": doc.original_filename or doc.filename,
        "question": req.question,
        "answer": answer
    }

