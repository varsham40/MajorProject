import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.core.database import Base

class AccessToken(Base):
    __tablename__ = "access_tokens"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    token_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    hospital_id: Mapped[str] = mapped_column(String(36), ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    doctor_id: Mapped[str] = mapped_column(String(36), ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False)
    record_id: Mapped[str] = mapped_column(String(36), ForeignKey("medical_records.id", ondelete="CASCADE"), nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="ACTIVE")  # ACTIVE, REVOKED, EXPIRED
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class RecordShare(Base):
    __tablename__ = "record_shares"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    record_id: Mapped[str] = mapped_column(String(36), ForeignKey("medical_records.id", ondelete="CASCADE"), nullable=False)
    token_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("access_tokens.id", ondelete="CASCADE"), nullable=True)
    from_doctor_id: Mapped[str] = mapped_column(String(36), ForeignKey("doctors.id"), nullable=False)
    from_hospital_id: Mapped[str] = mapped_column(String(36), ForeignKey("hospitals.id"), nullable=False)
    to_doctor_id: Mapped[str] = mapped_column(String(36), ForeignKey("doctors.id"), nullable=False)
    to_hospital_id: Mapped[str] = mapped_column(String(36), ForeignKey("hospitals.id"), nullable=False)
    shared_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
