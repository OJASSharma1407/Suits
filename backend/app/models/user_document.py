"""UserDocument model - stores user-uploaded legal documents with OCR status and metadata."""

import uuid
import enum
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import String, DateTime, ForeignKey, Text, Integer, Enum as SAEnum, Boolean, Float, JSON
from sqlalchemy.types import Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class DocumentStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    INDEXED = "indexed"
    FAILED = "failed"


class DocumentTag(str, enum.Enum):
    EVIDENCE = "evidence"
    PLEADING = "pleading"
    AFFIDAVIT = "affidavit"
    COURT_ORDER = "court_order"
    NOTICE = "notice"
    AGREEMENT = "agreement"
    OTHER = "other"


class UserDocument(Base):
    __tablename__ = "user_documents"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True, native_uuid=False), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True, native_uuid=False), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    # Optional link to a specific case CNR
    cnr: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)

    # File metadata
    filename: Mapped[str] = mapped_column(String(512), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(512), nullable=False)
    file_path: Mapped[str] = mapped_column(String(1024), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)  # bytes
    mime_type: Mapped[str] = mapped_column(String(128), nullable=False)
    page_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    content_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)

    # Classification
    tag: Mapped[DocumentTag] = mapped_column(
        SAEnum(DocumentTag), default=DocumentTag.OTHER, nullable=False
    )

    # Processing status
    status: Mapped[DocumentStatus] = mapped_column(
        SAEnum(DocumentStatus), default=DocumentStatus.PENDING, nullable=False, index=True
    )
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Extracted content & AI Legal Analysis
    extracted_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ai_analysis: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    chunk_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Research Vault: Notes, Highlights, Custom tags
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default="")
    highlights: Mapped[Optional[list]] = mapped_column(JSON, nullable=True, default=list)
    tags_list: Mapped[Optional[list]] = mapped_column(JSON, nullable=True, default=list)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user = relationship("User", back_populates="documents")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")
