import uuid
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.core.database import Base

class BlockchainRecord(Base):
    __tablename__ = "blockchain_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    record_id: Mapped[str] = mapped_column(String(36), ForeignKey("medical_records.id", ondelete="CASCADE"), unique=True, nullable=False)
    sha256_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    tx_hash: Mapped[str] = mapped_column(String(66), nullable=False)
    block_number: Mapped[int] = mapped_column(Integer, nullable=False)
    contract_address: Mapped[str] = mapped_column(String(42), nullable=False)
    network: Mapped[str] = mapped_column(String(50), default="hardhat")
    registered_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
