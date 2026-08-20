"""Cached order model - stores cached Markdown order responses (permanent cache)."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.types import Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class CachedOrder(Base):
    __tablename__ = "cached_orders"
    __table_args__ = (
        UniqueConstraint("cnr", "filename", name="uq_cnr_filename_order"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True, native_uuid=False), primary_key=True, default=uuid.uuid4
    )
    cnr: Mapped[str] = mapped_column(
        String(64), ForeignKey("cached_cases.cnr", ondelete="CASCADE"),
        nullable=False,
    )
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    markdown: Mapped[str] = mapped_column(Text, nullable=True)
    fetched_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    cached_case = relationship("CachedCase", back_populates="cached_orders")
    ai_analysis = relationship("CachedAIAnalysis", back_populates="cached_order",
                                uselist=False, cascade="all, delete-orphan")
