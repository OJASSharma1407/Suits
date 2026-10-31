"""Cached headnote model - stores publisher-grade headnote and ratio extractions."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.types import Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class CachedHeadnote(Base):
    __tablename__ = "cached_headnotes"
    __table_args__ = (
        UniqueConstraint("cnr", "order_hash", name="uq_cnr_order_hash_headnote"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True, native_uuid=False), primary_key=True, default=uuid.uuid4
    )
    cnr: Mapped[str] = mapped_column(
        String(64), ForeignKey("cached_cases.cnr", ondelete="CASCADE"),
        nullable=False, index=True
    )
    order_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True, native_uuid=False), ForeignKey("cached_orders.id", ondelete="CASCADE"),
        nullable=True, index=True
    )
    order_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    headnote_json: Mapped[str] = mapped_column(Text, nullable=False)
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    cached_case = relationship("CachedCase")
    cached_order = relationship("CachedOrder")
