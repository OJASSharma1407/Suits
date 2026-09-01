"""DocumentChunk model - stores text chunks and vector embeddings for RAG retrieval."""

import uuid
from typing import Optional

from sqlalchemy import String, ForeignKey, Text, Integer, JSON
from sqlalchemy.types import Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True, native_uuid=False), primary_key=True, default=uuid.uuid4
    )
    document_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True, native_uuid=False),
        ForeignKey("user_documents.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    # Metadata for retrieval context
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    chunk_text: Mapped[str] = mapped_column(Text, nullable=False)
    token_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Vector embedding stored as JSON array of floats (768-dim text-embedding-004)
    embedding: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)

    # Relationships
    document = relationship("UserDocument", back_populates="chunks")
