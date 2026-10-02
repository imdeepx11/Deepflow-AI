import os
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base

DB_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
DEFAULT_DB_PATH = os.path.join(DB_DIR, "nexora.db")

DATABASE_URL = os.environ.get("DATABASE_URL")

if DATABASE_URL:
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    engine = create_engine(DATABASE_URL)
else:
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{DEFAULT_DB_PATH}"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def ensure_schema():
    """Create new tables and add tenant columns to existing deployments."""
    Base.metadata.create_all(bind=engine)
    inspector = inspect(engine)

    additions = {
        "users": {
            "firebase_uid": "VARCHAR",
            "organization_id": "INTEGER",
        },
        "documents": {
            "organization_id": "INTEGER",
        },
        "workflows": {
            "organization_id": "INTEGER",
        },
        "audit_logs": {
            "organization_id": "INTEGER",
        },
    }

    with engine.begin() as conn:
        for table, columns in additions.items():
            existing = {col["name"] for col in inspector.get_columns(table)}
            for column, sql_type in columns.items():
                if column not in existing:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {sql_type}"))

        indexes = {
            "ix_users_firebase_uid": "users(firebase_uid)",
            "ix_users_organization_id": "users(organization_id)",
            "ix_documents_organization_id": "documents(organization_id)",
            "ix_workflows_organization_id": "workflows(organization_id)",
            "ix_audit_logs_organization_id": "audit_logs(organization_id)",
        }
        for index_name, target in indexes.items():
            conn.execute(text(f"CREATE INDEX IF NOT EXISTS {index_name} ON {target}"))


def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
