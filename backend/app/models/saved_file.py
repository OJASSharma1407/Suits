"""SavedFile model - stores saved court orders with research notes, highlights, and tags."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Text, JSON, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.types import Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class SavedFile(Base):
    __tablename__ = "saved_files"
    __table_args__ = (
        UniqueConstraint("user_id", "cnr", "filename", name="uq_user_cnr_filename_file"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True, native_uuid=False), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True, native_uuid=False), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    cnr: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    case_title: Mapped[str] = mapped_column(String(500), nullable=False, default="Court Order")
    court_name: Mapped[str] = mapped_column(String(255), nullable=False, default="Court Record")
    order_date: Mapped[str] = mapped_column(String(100), nullable=False, default="Record Copy")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True, default="")
    highlights: Mapped[list | None] = mapped_column(JSON, nullable=True, default=list)
    tags: Mapped[list | None] = mapped_column(JSON, nullable=True, default=list)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    user = relationship("User", back_populates="saved_files")
