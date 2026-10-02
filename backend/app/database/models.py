from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database.database import Base


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    settings = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="organization")
    documents = relationship("Document", back_populates="organization")
    workflows = relationship("Workflow", back_populates="organization")
    audit_logs = relationship("AuditLog", back_populates="organization")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    firebase_uid = Column(String, unique=True, index=True, nullable=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True, index=True)
    password_hash = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    role = Column(String, default="User")
    department = Column(String, default="Operations")
    avatar = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="users")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True, index=True)
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    storage_path = Column(String, nullable=False)
    extracted_text = Column(Text, nullable=True)
    status = Column(String, default="Uploaded")
    priority = Column(String, default="Medium")
    confidence = Column(Float, default=0.0)
    uploaded_by = Column(String, default="Admin")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = relationship("Organization", back_populates="documents")
    analysis = relationship("DocumentAnalysis", back_populates="document", uselist=False, cascade="all, delete-orphan")
    workflows = relationship("Workflow", back_populates="document", cascade="all, delete-orphan")
    approvals = relationship("Approval", back_populates="document", cascade="all, delete-orphan")


class DocumentAnalysis(Base):
    __tablename__ = "document_analyses"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, unique=True)
    document_type = Column(String, default="Unknown")
    confidence = Column(Float, default=0.0)
    priority = Column(String, default="Medium")
    priority_reason = Column(Text, nullable=True)
    risk_level = Column(String, default="LOW")
    risk_score = Column(Integer, default=0)
    extracted_fields = Column(JSON, default=dict)
    risks = Column(JSON, default=list)
    summary = Column(JSON, default=list)
    recommended_action = Column(String, nullable=True)
    department = Column(String, nullable=True)
    assigned_role = Column(String, nullable=True)
    sla_hours = Column(Integer, default=24)
    raw_ai_response = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="analysis")


class Workflow(Base):
    __tablename__ = "workflows"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    current_step_index = Column(Integer, default=0)
    status = Column(String, default="Active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = relationship("Organization", back_populates="workflows")
    document = relationship("Document", back_populates="workflows")
    steps = relationship("WorkflowStep", back_populates="workflow", order_by="WorkflowStep.step_index", cascade="all, delete-orphan")


class WorkflowStep(Base):
    __tablename__ = "workflow_steps"

    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False)
    step_index = Column(Integer, nullable=False)
    step_name = Column(String, nullable=False)
    node_type = Column(String, default="Approval")
    role = Column(String, nullable=True)
    status = Column(String, default="Pending")
    completed_at = Column(DateTime, nullable=True)
    comments = Column(Text, nullable=True)

    workflow = relationship("Workflow", back_populates="steps")


class Approval(Base):
    __tablename__ = "approvals"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    workflow_step_id = Column(Integer, nullable=True)
    action = Column(String, nullable=False)
    approver_name = Column(String, nullable=False)
    approver_role = Column(String, nullable=False)
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="approvals")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    user_name = Column(String, nullable=False)
    user_role = Column(String, default="User")
    action = Column(String, nullable=False)
    document_name = Column(String, nullable=True)
    workflow_name = Column(String, nullable=True)
    status = Column(String, default="Success")
    details = Column(Text, nullable=True)

    organization = relationship("Organization", back_populates="audit_logs")
