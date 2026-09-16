import os
import json
from datetime import datetime

try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False

class FirebaseService:
    def __init__(self):
        self.db = None
        if not FIREBASE_AVAILABLE:
            print("firebase-admin SDK not installed. Running in local fallback mode.")
            return

        try:
            if not firebase_admin._apps:
                creds_json = os.environ.get("FIREBASE_CREDENTIALS")
                if creds_json:
                    cred_dict = json.loads(creds_json)
                    cred = credentials.Certificate(cred_dict)
                    firebase_admin.initialize_app(cred)
                else:
                    # Initialize default credentials if in GCP environment
                    firebase_admin.initialize_app()
            
            self.db = firestore.client()
            print("Firebase Admin SDK & Firestore initialized successfully.")
        except Exception as e:
            print(f"Firebase initialization info: {e}. Defaulting to SQLite engine.")

    def is_enabled(self) -> bool:
        return self.db is not None

    def store_document(self, doc_data: dict):
        if not self.is_enabled():
            return None
        try:
            doc_ref = self.db.collection("documents").document(str(doc_data.get("id")))
            doc_ref.set({
                **doc_data,
                "updated_at": firestore.SERVER_TIMESTAMP
            }, merge=True)
            return doc_ref.id
        except Exception as e:
            print(f"Firestore store document error: {e}")
            return None

    def store_audit_log(self, log_data: dict):
        if not self.is_enabled():
            return None
        try:
            log_ref = self.db.collection("audit_logs").document()
            log_ref.set({
                **log_data,
                "timestamp": firestore.SERVER_TIMESTAMP
            })
            return log_ref.id
        except Exception as e:
            print(f"Firestore store audit log error: {e}")
            return None

firebase_service = FirebaseService()
