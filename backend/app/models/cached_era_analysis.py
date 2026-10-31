"""Cached criminal era transition analysis model."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.types import Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class CachedEraAnalysis(Base):
    """Stores generated criminal era transition matrices and transposed arguments."""

    __tablename__ = "cached_era_analyses"
    __table_args__ = (
        UniqueConstraint("cnr", "case_state_hash", name="uq_cnr_case_hash_era"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True, native_uuid=False), primary_key=True, default=uuid.uuid4
    )
    cnr: Mapped[str] = mapped_column(
        String(64), ForeignKey("cached_cases.cnr", ondelete="CASCADE"),
        nullable=False, index=True
    )
    case_state_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    analysis_json: Mapped[str] = mapped_column(Text, nullable=False)
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    cached_case = relationship("CachedCase")
