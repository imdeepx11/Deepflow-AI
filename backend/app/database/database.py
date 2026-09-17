import json
import os
import uuid
from datetime import datetime, timezone

import firebase_admin
from firebase_admin import credentials, firestore

_APP_NAME = "deepflow-firestore"


def _initialize_firebase():
    try:
        return firestore.client()
    except Exception:
        pass

    if not firebase_admin._apps:
        credentials_json = os.getenv("FIREBASE_CREDENTIALS")
        project_id = os.getenv("FIREBASE_PROJECT_ID")

        if credentials_json:
            try:
                credential_data = json.loads(credentials_json)
            except json.JSONDecodeError as exc:
                raise RuntimeError("FIREBASE_CREDENTIALS is not valid JSON.") from exc
            firebase_admin.initialize_app(
                credentials.Certificate(credential_data),
                {"projectId": project_id} if project_id else None,
                name=_APP_NAME,
            )
        else:
            options = {"projectId": project_id} if project_id else None
            firebase_admin.initialize_app(options=options, name=_APP_NAME)

    try:
        return firestore.client(app=firebase_admin.get_app(_APP_NAME))
    except ValueError:
        return firestore.client()


_db = _initialize_firebase()


def get_db():
    """Return the initialized Firestore client."""
    return _db


def collection(name: str):
    return _db.collection(name)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def to_iso(value):
    if value is None:
        return None
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)


def snapshot_data(snapshot):
    data = snapshot.to_dict() or {}
    data["id"] = snapshot.id
    return data


def new_id() -> str:
    return str(uuid.uuid4())
