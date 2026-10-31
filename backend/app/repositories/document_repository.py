"""Document repository - database operations for user documents and chunks with vector search."""

import uuid
from typing import Optional

from sqlalchemy import select, delete, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.user_document import UserDocument, DocumentStatus, DocumentTag
from app.models.document_chunk import DocumentChunk
from app.services.embedding_service import embedding_service


class DocumentRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, document: UserDocument) -> UserDocument:
        self.db.add(document)
        await self.db.flush()
        return document

    async def get_by_id(self, document_id: uuid.UUID) -> UserDocument | None:
        result = await self.db.execute(
            select(UserDocument).where(UserDocument.id == document_id)
        )
        return result.scalar_one_or_none()

    async def get_user_documents(
        self,
        user_id: uuid.UUID,
        cnr: Optional[str] = None,
        tag: Optional[DocumentTag] = None,
        status: Optional[DocumentStatus] = None,
        search: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[UserDocument]:
        """List documents with optional filtering by CNR, tag, status, or filename search."""
        query = select(UserDocument).where(UserDocument.user_id == user_id)

        if cnr:
            query = query.where(UserDocument.cnr == cnr)
        if tag:
            query = query.where(UserDocument.tag == tag)
        if status:
            query = query.where(UserDocument.status == status)
        if search:
            query = query.where(
                UserDocument.original_filename.ilike(f"%{search}%")
                | UserDocument.summary.ilike(f"%{search}%")
            )

        query = query.order_by(UserDocument.created_at.desc()).limit(limit).offset(offset)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def count_user_documents(self, user_id: uuid.UUID) -> int:
        result = await self.db.execute(
            select(func.count(UserDocument.id)).where(UserDocument.user_id == user_id)
        )
        return result.scalar() or 0

    async def get_total_storage(self, user_id: uuid.UUID) -> int:
        """Return total file size in bytes for a user's documents."""
        result = await self.db.execute(
            select(func.sum(UserDocument.file_size)).where(UserDocument.user_id == user_id)
        )
        return result.scalar() or 0

    async def delete_document(self, document_id: uuid.UUID) -> None:
        """Delete document and all its chunks (cascade handles chunks)."""
        await self.db.execute(
            delete(UserDocument).where(UserDocument.id == document_id)
        )

    async def get_chunks(self, document_id: uuid.UUID) -> list[DocumentChunk]:
        result = await self.db.execute(
            select(DocumentChunk)
            .where(DocumentChunk.document_id == document_id)
            .order_by(DocumentChunk.chunk_index.asc())
        )
        return list(result.scalars().all())

    async def semantic_search(
        self,
        user_id: uuid.UUID,
        query_text: str,
        cnr: Optional[str] = None,
        top_k: int = 5,
    ) -> list[tuple[float, DocumentChunk, UserDocument]]:
        """Find the most semantically relevant chunks for a query using cosine similarity.

        Returns list of (score, chunk, parent_document) sorted by score descending.
        """
        # Get query embedding
        query_vec = await embedding_service.embed_text(query_text)
        if query_vec is None:
            return []

        # Fetch all indexed documents for this user (optionally filtered by CNR)
        doc_query = select(UserDocument).where(
            UserDocument.user_id == user_id,
            UserDocument.status == DocumentStatus.INDEXED,
        )
        if cnr:
            doc_query = doc_query.where(UserDocument.cnr == cnr)

        doc_result = await self.db.execute(doc_query)
        documents = list(doc_result.scalars().all())

        if not documents:
            return []

        doc_ids = [d.id for d in documents]
        doc_map = {d.id: d for d in documents}

        # Fetch all chunks for these documents
        chunk_result = await self.db.execute(
            select(DocumentChunk).where(DocumentChunk.document_id.in_(doc_ids))
        )
        chunks = list(chunk_result.scalars().all())

        # Score each chunk
        scored: list[tuple[float, DocumentChunk, UserDocument]] = []
        for chunk in chunks:
            if chunk.embedding is None:
                continue
            score = embedding_service.cosine_similarity(query_vec, chunk.embedding)
            parent_doc = doc_map.get(chunk.document_id)
            if parent_doc:
                scored.append((score, chunk, parent_doc))

        scored.sort(key=lambda x: x[0], reverse=True)
        return scored[:top_k]

    # ------------------------------------------------------------------ #
    #  Content Cache Lookup Methods                                      #
    # ------------------------------------------------------------------ #

    async def find_matching_summary(self, content_hash: str) -> str | None:
        """Find an existing non-trivial summary for a matching content hash."""
        stmt = (
            select(UserDocument.summary)
            .where(
                UserDocument.content_hash == content_hash,
                UserDocument.summary.isnot(None),
            )
            .order_by(UserDocument.created_at.desc())
        )
        res = (await self.db.execute(stmt)).scalars().first()
        if res and len(res.strip()) > 15 and not res.startswith("Legal document:"):
            return res.strip()
        return None

    async def find_matching_ai_analysis(self, content_hash: str) -> dict | None:
        """Find existing structured AI analysis for a matching content hash."""
        stmt = (
            select(UserDocument.ai_analysis)
            .where(
                UserDocument.content_hash == content_hash,
                UserDocument.ai_analysis.isnot(None),
            )
            .order_by(UserDocument.created_at.desc())
        )
        res = (await self.db.execute(stmt)).scalars().first()
        if isinstance(res, dict) and res.get("executiveSummary") and "uploaded for legal analysis" not in str(res.get("executiveSummary")):
            return res
        return None

    async def find_matching_ocr(self, content_hash: str) -> tuple[str, int] | None:
        """Find existing extracted text and page count for a matching content hash."""
        stmt = (
            select(UserDocument.extracted_text, UserDocument.page_count)
            .where(
                UserDocument.content_hash == content_hash,
                UserDocument.extracted_text.isnot(None),
            )
            .order_by(UserDocument.created_at.desc())
        )
        res = (await self.db.execute(stmt)).first()
        if res and res[0] and len(res[0].strip()) > 20 and not res[0].startswith("*"):
            return res[0].strip(), res[1] or 1
        return None
