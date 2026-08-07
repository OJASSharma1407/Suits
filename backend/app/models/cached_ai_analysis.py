"""Cached AI analysis model - stores Order AI endpoint responses (permanent cache)."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class CachedAIAnalysis(Base):
    __tablename__ = "cached_ai_analysis"
    __table_args__ = (
        UniqueConstraint("cnr", "filename", name="uq_cnr_filename_ai"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    cnr: Mapped[str] = mapped_column(String(16), nullable=False)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    ai_json: Mapped[str] = mapped_column(Text, nullable=False)
    fetched_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    order_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("cached_orders.id", ondelete="CASCADE"),
        nullable=True,
    )

    # Relationships
    cached_order = relationship("CachedOrder", back_populates="ai_analysis")
