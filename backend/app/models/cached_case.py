"""Cached case model - stores cached Case Details API responses."""

from datetime import datetime, timezone

from sqlalchemy import String, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class CachedCase(Base):
    __tablename__ = "cached_cases"

    cnr: Mapped[str] = mapped_column(String(16), primary_key=True)
    response_json: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Extracted metadata for fast searching
    case_title: Mapped[str | None] = mapped_column(String(500), index=True, nullable=True)
    case_status: Mapped[str | None] = mapped_column(String(100), index=True, nullable=True)
    case_type: Mapped[str | None] = mapped_column(String(100), index=True, nullable=True)
    court_code: Mapped[str | None] = mapped_column(String(50), index=True, nullable=True)
    filing_year: Mapped[str | None] = mapped_column(String(4), index=True, nullable=True)
    
    fetched_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    # Relationships
    cached_orders = relationship("CachedOrder", back_populates="cached_case",
                                  cascade="all, delete-orphan")
