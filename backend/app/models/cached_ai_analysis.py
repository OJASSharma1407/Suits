"""Cached AI analysis model - stores Order AI endpoint responses (permanent cache)."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.types import Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class CachedAIAnalysis(Base):
    __tablename__ = "cached_ai_analysis"
    __table_args__ = (
        UniqueConstraint("cnr", "filename", name="uq_cnr_filename_ai"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True, native_uuid=False), primary_key=True, default=uuid.uuid4
    )
    cnr: Mapped[str] = mapped_column(String(16), nullable=False)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    ai_json: Mapped[str] = mapped_column(Text, nullable=False)
    fetched_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    order_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True, native_uuid=False), ForeignKey("cached_orders.id", ondelete="CASCADE"),
        nullable=True,
    )

    # Relationships
    cached_order = relationship("CachedOrder", back_populates="ai_analysis")
