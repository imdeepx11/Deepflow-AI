import os
import hashlib
from datetime import datetime, timedelta
from app.database.database import engine, Base, SessionLocal
from app.database.models import User, Document, DocumentAnalysis, Workflow, WorkflowStep, Approval, AuditLog
from app.services.ai_service import AIService

def hash_password(password: str) -> str:
    return hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), b'deepflow_salt_2026', 100000).hex()

def seed_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check if already seeded
    if db.query(Document).count() > 0:
        print("Database already contains data.")
        db.close()
        return

    print("Seeding database with enterprise demo documents...")

    # Create admin user
    user = User(
        name="Demo Administrator",
        email="demo@deepflow.ai",
        password_hash=hash_password("demo123"),
        role="Admin",
        department="Operations",
        avatar=""
    )
    db.add(user)
    db.commit()



    sample_docs = [
        ("Invoice_1024.pdf", "PDF", 245000, "Alex Morgan", "Pending Approval", "HIGH"),
        ("Invoice_1025.pdf", "PDF", 182000, "Sarah Chen", "Pending Approval", "MEDIUM"),
        ("Purchase_Order_2026.pdf", "PDF", 512000, "Sarah Chen", "Approved", "HIGH"),
        ("Loan_Application_01.pdf", "PDF", 1200000, "James Liu", "Under Review", "HIGH"),
        ("Contract_ABC.pdf", "PDF", 890000, "Alex Morgan", "Pending Approval", "CRITICAL"),
        ("Aadhaar_Verification.pdf", "PDF", 145000, "System", "Processed", "MEDIUM"),
        ("Insurance_Claim_12.pdf", "PDF", 320000, "Rahul Patel", "Approved", "MEDIUM"),
        ("Customer_Complaint_45.pdf", "TXT", 45000, "Emily Watson", "Processed", "LOW"),
        ("Bank_Statement_09.pdf", "PDF", 980000, "Alex Morgan", "Processed", "LOW"),
        ("Government_Application_17.pdf", "PDF", 640000, "System", "Approved", "MEDIUM")
    ]

    ai_service = AIService()

    for idx, (fname, ftype, fsize, uploaded_by, status, priority) in enumerate(sample_docs):
        # Generate dummy text content for analyzer
        dummy_content = f"DEEPFLOW DEMO DOCUMENT CONTENT\nDocument: {fname}\nType: {ftype}\nUser: {uploaded_by}\n"
        if "Invoice" in fname:
            dummy_content += "INVOICE # INV-1024\nVendor: ABC Technologies\nGSTIN: 07AAAAA0000A1Z5\nDate: 2026-09-10\nSubtotal: ₹75,000.00\nGST 18%: ₹13,500.00\nTotal Amount: ₹88,500\nDue Date: 30 September 2026\nPayment Terms: Net 15"
        elif "Purchase_Order" in fname:
            dummy_content += "PURCHASE ORDER PO-2026-9041\nSupplier: Global Hardware Vendors Ltd\nItems: 10x Enterprise Servers\nTotal PO Amount: ₹2,45,000.00\nDelivery Date: 2026-09-30"
        elif "Contract" in fname:
            dummy_content += "MASTER SERVICE AGREEMENT\nParties: DeepFlow Inc & Apex Cloud Systems\nEffective Date: 2026-10-01\nAnnual Contract Value: ₹12,00,000.00\nTermination Notice: 60 Days"
        elif "Resume" in fname:
            dummy_content += "RESUME - AMIT VERMA\nEmail: amit.verma@email.com\nSkills: Python, FastApi, React, Machine Learning, Docker\nExperience: 5.5 Years\nEducation: B.Tech CS IIT Delhi"
        elif "Loan" in fname:
            dummy_content += "COMMERCIAL LOAN APPLICATION\nApplicant: Rajesh Kumar\nRequested Amount: ₹15,00,000.00\nCIBIL Score: 780\nTurnover: ₹85,00,000.00"
        else:
            dummy_content += "General enterprise verification filing document with standard compliance text."

        doc_time = datetime.utcnow() - timedelta(hours=idx*3, minutes=idx*12)

        doc = Document(
            filename=fname,
            original_filename=fname,
            file_type=ftype,
            file_size=fsize,
            storage_path=f"uploads/{fname}",
            extracted_text=dummy_content,
            status=status,
            priority=priority,
            confidence=0.94 if idx % 2 == 0 else 0.91,
            uploaded_by=uploaded_by,
            created_at=doc_time
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)

        # Run AI analysis struct
        ai_res = ai_service.analyze_document(fname, dummy_content)

        analysis = DocumentAnalysis(
            document_id=doc.id,
            document_type=ai_res.get("document_type", "Invoice"),
            confidence=ai_res.get("confidence", 0.94),
            priority=priority,
            priority_reason=ai_res.get("priority_reason"),
            risk_level=ai_res.get("risk_level", "MEDIUM"),
            risk_score=ai_res.get("risk_score", 45),
            extracted_fields=ai_res.get("extracted_fields", {}),
            risks=ai_res.get("risks", []),
            summary=ai_res.get("summary", []),
            recommended_action=ai_res.get("recommended_action", "Finance Approval"),
            department=ai_res.get("department", "Finance"),
            assigned_role=ai_res.get("assigned_role", "Finance Manager"),
            sla_hours=ai_res.get("sla_hours", 24),
            raw_ai_response=ai_res,
            created_at=doc_time
        )
        db.add(analysis)

        # Workflow
        wf = Workflow(
            document_id=doc.id,
            name=f"{analysis.document_type} Routing Workflow",
            description=f"Automated AI routing workflow for {fname}",
            status="Completed" if status == "Approved" else "Active",
            current_step_index=4 if status == "Approved" else 3,
            created_at=doc_time
        )
        db.add(wf)
        db.commit()
        db.refresh(wf)

        steps = [
            {"name": "Upload & Registration", "type": "Start", "role": "System", "status": "Completed"},
            {"name": "AI Classification & Extraction", "type": "AI Analysis", "role": "AI Engine", "status": "Completed"},
            {"name": "Validation Check", "type": "Document Validation", "role": "System", "status": "Completed"},
            {"name": f"{analysis.assigned_role} Signoff", "type": "Approval", "role": analysis.assigned_role, "status": "Completed" if status == "Approved" else "Active"},
            {"name": "System Archival & ERP Sync", "type": "End", "role": "Accounts Payable", "status": "Completed" if status == "Approved" else "Pending"}
        ]

        for s_idx, s in enumerate(steps):
            w_step = WorkflowStep(
                workflow_id=wf.id,
                step_index=s_idx,
                step_name=s["name"],
                node_type=s["type"],
                role=s["role"],
                status=s["status"],
                completed_at=doc_time if s["status"] == "Completed" else None
            )
            db.add(w_step)

        # Audit logs for each doc
        log1 = AuditLog(
            timestamp=doc_time,
            user_name=uploaded_by,
            user_role="User",
            action="Uploaded Document",
            document_name=fname,
            workflow_name=wf.name,
            status="Success",
            details=f"Uploaded file {fname} ({fsize} bytes)"
        )
        log2 = AuditLog(
            timestamp=doc_time + timedelta(seconds=45),
            user_name="AI Engine",
            user_role="System",
            action="Analyzed Document",
            document_name=fname,
            workflow_name=wf.name,
            status="Success",
            details=f"AI Classified as {analysis.document_type} ({int(analysis.confidence * 100)}% confidence)"
        )
        db.add(log1)
        db.add(log2)

        if status == "Approved":
            log3 = AuditLog(
                timestamp=doc_time + timedelta(hours=1),
                user_name="Finance Manager",
                user_role="Manager",
                action="Approved Document",
                document_name=fname,
                workflow_name=wf.name,
                status="Success",
                details="Approved invoice payout after standard risk verification."
            )
            db.add(log3)

    db.commit()
    db.close()
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    seed_db()
