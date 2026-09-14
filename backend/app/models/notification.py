import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.core.database import Base

class NotificationDismissal(Base):
    __tablename__ = "notification_dismissals"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    notification_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    dismissed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
