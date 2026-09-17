from datetime import timedelta

from app.database.database import collection, new_id, utc_now
from app.services.ai_service import AIService


def _has_any_documents() -> bool:
    return next(collection("documents").limit(1).stream(), None) is not None


def seed_db():
    if _has_any_documents():
        print("Firestore already contains data.")
        return

    print("Seeding Firestore with enterprise demo documents...")

    now = utc_now()
    user_id = "demo-admin"
    collection("users").document(user_id).set({
        "name": "Demo Administrator",
        "email": "demo@deepflow.ai",
        "role": "Admin",
        "department": "Operations",
        "avatar": "",
        "created_at": now,
    })

    sample_docs = [
        ("Invoice_1024.pdf", "PDF", 245000, "Deepak Gupta", "Pending Approval", "HIGH"),
        ("Invoice_1025.pdf", "PDF", 182000, "Priya Nair", "Pending Approval", "MEDIUM"),
        ("Purchase_Order_2026.pdf", "PDF", 512000, "Priya Nair", "Approved", "HIGH"),
        ("Loan_Application_01.pdf", "PDF", 1200000, "Amit Verma", "Under Review", "HIGH"),
        ("Contract_ABC.pdf", "PDF", 890000, "Deepak Gupta", "Pending Approval", "CRITICAL"),
        ("Aadhaar_Verification.pdf", "PDF", 145000, "Admin", "Processed", "MEDIUM"),
        ("Insurance_Claim_12.pdf", "PDF", 320000, "Karan Singh", "Approved", "MEDIUM"),
        ("Customer_Complaint_45.pdf", "TXT", 45000, "Neha Gupta", "Processed", "LOW"),
        ("Bank_Statement_09.pdf", "PDF", 980000, "Deepak Gupta", "Processed", "LOW"),
        ("Government_Application_17.pdf", "PDF", 640000, "Admin", "Approved", "MEDIUM"),
    ]

    ai_service = AIService()
    for idx, (fname, ftype, fsize, uploaded_by, status, priority) in enumerate(sample_docs, start=1):
        dummy_content = (
            f"DEEPFLOW DEMO DOCUMENT CONTENT\nDocument: {fname}\n"
            f"Type: {ftype}\nUser: {uploaded_by}\n"
        )
        if "Invoice" in fname:
            dummy_content += (
                "INVOICE # INV-1024\nVendor: ABC Technologies\nGSTIN: 07AAAAA0000A1Z5\n"
                "Date: 2026-09-10\nSubtotal: ₹75,000.00\nGST 18%: ₹13,500.00\n"
                "Total Amount: ₹88,500\nDue Date: 30 September 2026\nPayment Terms: Net 15"
            )
        elif "Purchase_Order" in fname:
            dummy_content += (
                "PURCHASE ORDER PO-2026-9041\nSupplier: Global Hardware Vendors Ltd\n"
                "Items: 10x Enterprise Servers\nTotal PO Amount: ₹2,45,000.00\n"
                "Delivery Date: 2026-09-30"
            )
        elif "Contract" in fname:
            dummy_content += (
                "MASTER SERVICE AGREEMENT\nParties: DeepFlow Inc & Apex Cloud Systems\n"
                "Effective Date: 2026-10-01\nAnnual Contract Value: ₹12,00,000.00\n"
                "Termination Notice: 60 Days"
            )
        elif "Loan" in fname:
            dummy_content += (
                "COMMERCIAL LOAN APPLICATION\nApplicant: Rajesh Kumar\n"
                "Requested Amount: ₹15,00,000.00\nCIBIL Score: 780\nTurnover: ₹85,00,000.00"
            )
        else:
            dummy_content += "General enterprise verification filing document with standard compliance text."

        doc_id = str(idx)
        doc_time = now - timedelta(hours=idx * 3, minutes=idx * 12)
        collection("documents").document(doc_id).set({
            "id": doc_id,
            "filename": fname,
            "original_filename": fname,
            "file_type": ftype,
            "file_size": fsize,
            "storage_path": f"uploads/{fname}",
            "extracted_text": dummy_content,
            "status": status,
            "priority": priority,
            "confidence": 0.94 if idx % 2 == 1 else 0.91,
            "uploaded_by": uploaded_by,
            "created_at": doc_time,
            "updated_at": doc_time,
        })

        ai_res = ai_service.analyze_document(fname, dummy_content)
        collection("analyses").document(doc_id).set({
            "id": doc_id,
            "document_id": doc_id,
            "document_type": ai_res.get("document_type", "Invoice"),
            "confidence": ai_res.get("confidence", 0.94),
            "priority": priority,
            "priority_reason": ai_res.get("priority_reason"),
            "risk_level": ai_res.get("risk_level", "MEDIUM"),
            "risk_score": ai_res.get("risk_score", 45),
            "extracted_fields": ai_res.get("extracted_fields", {}),
            "risks": ai_res.get("risks", []),
            "summary": ai_res.get("summary", []),
            "recommended_action": ai_res.get("recommended_action", "Finance Approval"),
            "department": ai_res.get("department", "Finance"),
            "assigned_role": ai_res.get("assigned_role", "Finance Manager"),
            "sla_hours": ai_res.get("sla_hours", 24),
            "raw_ai_response": ai_res,
            "created_at": doc_time,
        })

        wf_id = new_id()
        wf_name = f"{ai_res.get('document_type', 'Document')} Routing Workflow"
        collection("workflows").document(wf_id).set({
            "id": wf_id,
            "document_id": doc_id,
            "name": wf_name,
            "description": f"Automated AI routing workflow for {fname}",
            "status": "Completed" if status == "Approved" else "Active",
            "current_step_index": 4 if status == "Approved" else 3,
            "created_at": doc_time,
            "updated_at": doc_time,
        })

        steps = [
            ("Upload & Registration", "Start", "System", "Completed"),
            ("AI Classification & Extraction", "AI Analysis", "AI Engine", "Completed"),
            ("Validation Check", "Document Validation", "System", "Completed"),
            (f"{ai_res.get('assigned_role', 'Manager')} Signoff", "Approval", ai_res.get("assigned_role", "Manager"), "Completed" if status == "Approved" else "Active"),
            ("System Archival & ERP Sync", "End", "Accounts Payable", "Completed" if status == "Approved" else "Pending"),
        ]
        for step_index, (name, node_type, role, step_status) in enumerate(steps):
            step_id = new_id()
            collection("workflow_steps").document(step_id).set({
                "id": step_id,
                "workflow_id": wf_id,
                "step_index": step_index,
                "step_name": name,
                "node_type": node_type,
                "role": role,
                "status": step_status,
                "completed_at": doc_time if step_status == "Completed" else None,
                "comments": None,
            })

        for action, offset, actor, role, details in [
            ("Uploaded Document", 0, uploaded_by, "User", f"Uploaded file {fname} ({fsize} bytes)"),
            ("Analyzed Document", 45, "AI Engine", "System", f"AI Classified as {ai_res.get('document_type', 'Document')} ({int(ai_res.get('confidence', 0.94) * 100)}% confidence)"),
        ]:
            log_id = new_id()
            collection("audit_logs").document(log_id).set({
                "id": log_id,
                "timestamp": doc_time + timedelta(seconds=offset),
                "user_name": actor,
                "user_role": role,
                "action": action,
                "document_name": fname,
                "workflow_name": wf_name,
                "status": "Success",
                "details": details,
            })

        if status == "Approved":
            log_id = new_id()
            collection("audit_logs").document(log_id).set({
                "id": log_id,
                "timestamp": doc_time + timedelta(hours=1),
                "user_name": "Finance Manager",
                "user_role": "Manager",
                "action": "Approved Document",
                "document_name": fname,
                "workflow_name": wf_name,
                "status": "Success",
                "details": "Approved invoice payout after standard risk verification.",
            })

    print("Firestore seeding completed successfully.")


if __name__ == "__main__":
    seed_db()
