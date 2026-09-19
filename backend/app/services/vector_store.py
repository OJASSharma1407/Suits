"""Dual-Engine Vector Store for SUITS.

Supports both local zero-config SQLite development (in-memory / numpy cosine similarity)
and production PostgreSQL with pgvector HNSW indexing.
"""

from __future__ import annotations

import json
import os
from typing import Any

import numpy as np
import structlog

from app.core.config import settings

logger = structlog.get_logger()

VECTOR_STORE_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "data", "suits_vectors.json")


class VectorStore:
    """Hybrid Vector Store supporting SQLite (local cache) and PostgreSQL (pgvector)."""

    def __init__(self) -> None:
        self.is_postgres = settings.database_url.startswith("postgresql")
        self._local_index: dict[str, dict[str, Any]] = {}
        self._load_local_index()

    def _load_local_index(self) -> None:
        """Load locally cached vectors for SQLite development."""
        if not self.is_postgres and os.path.exists(VECTOR_STORE_FILE):
            try:
                with open(VECTOR_STORE_FILE, "r", encoding="utf-8") as f:
                    self._local_index = json.load(f)
                logger.info("local_vector_index_loaded", count=len(self._local_index))
            except Exception as exc:
                logger.warning("failed_loading_local_vectors", error=str(exc))
                self._local_index = {}

    def _save_local_index(self) -> None:
        """Persist local vector cache to disk."""
        if not self.is_postgres:
            try:
                os.makedirs(os.path.dirname(VECTOR_STORE_FILE), exist_ok=True)
                with open(VECTOR_STORE_FILE, "w", encoding="utf-8") as f:
                    json.dump(self._local_index, f)
            except Exception as exc:
                logger.warning("failed_saving_local_vectors", error=str(exc))

    async def upsert_vector(
        self,
        tid: str,
        title: str,
        embedding: list[float],
        metadata: dict[str, Any] | None = None,
    ) -> None:
        """Upsert a 768-dimensional normalized embedding vector."""
        if not embedding or len(embedding) != 768:
            return

        if self.is_postgres:
            # PostgreSQL pgvector upsert
            try:
                from sqlalchemy import text
                from app.database.session import async_session_factory
                async with async_session_factory() as session:
                    stmt = text("""
                        INSERT INTO precedent_embeddings (tid, title, embedding, metadata)
                        VALUES (:tid, :title, :embedding, :metadata)
                        ON CONFLICT (tid) DO UPDATE SET
                            title = EXCLUDED.title,
                            embedding = EXCLUDED.embedding,
                            metadata = EXCLUDED.metadata;
                    """)
                    await session.execute(
                        stmt,
                        {
                            "tid": str(tid),
                            "title": title,
                            "embedding": str(embedding),
                            "metadata": json.dumps(metadata or {}),
                        },
                    )
                    await session.commit()
            except Exception as exc:
                logger.warning("pgvector_upsert_failed", error=str(exc))
        else:
            # Local SQLite development mode: store in local JSON/Numpy cache
            self._local_index[str(tid)] = {
                "title": title,
                "embedding": embedding,
                "metadata": metadata or {},
            }
            self._save_local_index()

    async def search_similar(
        self,
        query_vector: list[float],
        top_k: int = 20,
        candidates_filter: list[str] | None = None,
    ) -> list[tuple[str, float, dict[str, Any]]]:
        """Search top-k most similar precedents using cosine similarity.

        Returns list of (tid, similarity_score, metadata).
        """
        if not query_vector:
            return []

        q_vec = np.array(query_vector, dtype=np.float32)
        q_norm = np.linalg.norm(q_vec)
        if q_norm == 0:
            return []
        q_vec = q_vec / q_norm

        if self.is_postgres:
            try:
                from sqlalchemy import text
                from app.database.session import async_session_factory
                async with async_session_factory() as session:
                    stmt = text("""
                        SELECT tid, title, metadata, (1 - (embedding <=> :qvec)) AS cosine_sim
                        FROM precedent_embeddings
                        ORDER BY embedding <=> :qvec
                        LIMIT :limit;
                    """)
                    result = await session.execute(
                        stmt,
                        {"qvec": str(query_vector), "limit": top_k},
                    )
                    rows = result.fetchall()
                    return [
                        (str(r[0]), float(r[3]), json.loads(r[2]) if isinstance(r[2], str) else (r[2] or {}))
                        for r in rows
                    ]
            except Exception as exc:
                logger.warning("pgvector_search_failed", error=str(exc))

        # Local NumPy cosine similarity fallback
        scored: list[tuple[str, float, dict[str, Any]]] = []
        filter_set = set(str(c) for c in candidates_filter) if candidates_filter else None

        for tid, data in self._local_index.items():
            if filter_set and str(tid) not in filter_set:
                continue
            emb = np.array(data.get("embedding", []), dtype=np.float32)
            if emb.shape[0] != 768:
                continue
            emb_norm = np.linalg.norm(emb)
            if emb_norm > 0:
                sim = float(np.dot(q_vec, emb / emb_norm))
                scored.append((tid, sim, data.get("metadata", {})))

        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[:top_k]


vector_store = VectorStore()
