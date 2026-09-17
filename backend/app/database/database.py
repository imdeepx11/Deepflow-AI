import json
import os
import re
import uuid
from datetime import datetime, timezone

import firebase_admin
from firebase_admin import credentials, firestore

_APP_NAME = "deepflow-firestore"


def _initialize_firebase():
    """Initialize a deterministic named Firebase Admin app and return Firestore."""
    credentials_json = os.getenv("FIREBASE_CREDENTIALS", "").strip()
    project_id = os.getenv("FIREBASE_PROJECT_ID", "").strip()

    # Reuse the named app if this module is reloaded.
    try:
        app = firebase_admin.get_app(_APP_NAME)
        return firestore.client(app=app)
    except ValueError:
        pass

    if credentials_json:
        try:
            credential_data = json.loads(credentials_json)
        except json.JSONDecodeError as exc:
            raise RuntimeError("FIREBASE_CREDENTIALS is not valid JSON.") from exc

        credential_project_id = str(credential_data.get("project_id", "")).strip()
        effective_project_id = project_id or credential_project_id

        if not effective_project_id:
            raise RuntimeError(
                "Firebase project ID is missing. Set FIREBASE_PROJECT_ID or include project_id in FIREBASE_CREDENTIALS."
            )

        # Prevent hidden whitespace/control characters from reaching gRPC metadata.
        if not re.fullmatch(r"[a-z0-9][a-z0-9-]{4,28}[a-z0-9]", effective_project_id):
            raise RuntimeError(
                "FIREBASE_PROJECT_ID must be a valid Firebase/GCP project ID (lowercase letters, numbers, and hyphens only)."
            )

        if credential_project_id and credential_project_id != effective_project_id:
            raise RuntimeError(
                "FIREBASE_PROJECT_ID does not match the project_id in FIREBASE_CREDENTIALS."
            )

        app = firebase_admin.initialize_app(
            credentials.Certificate(credential_data),
            {"projectId": effective_project_id},
            name=_APP_NAME,
        )
        return firestore.client(app=app)

    if not project_id:
        raise RuntimeError(
            "Firebase credentials are missing. Set FIREBASE_CREDENTIALS and FIREBASE_PROJECT_ID in Render."
        )

    if not re.fullmatch(r"[a-z0-9][a-z0-9-]{4,28}[a-z0-9]", project_id):
        raise RuntimeError(
            "FIREBASE_PROJECT_ID must be a valid Firebase/GCP project ID (lowercase letters, numbers, and hyphens only)."
        )

    app = firebase_admin.initialize_app(
        options={"projectId": project_id},
        name=_APP_NAME,
    )
    return firestore.client(app=app)


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
