"""Embedding service - generates and retrieves vector embeddings using Gemini text-embedding-004."""

import structlog
from typing import Optional

from app.core.config import settings

logger = structlog.get_logger()

# Dimension of text-embedding-004
EMBEDDING_DIM = 768


class EmbeddingService:
    """Generates embeddings via Google Gemini and computes cosine similarity for RAG retrieval."""

    def __init__(self) -> None:
        self._configured = False
        self._client = None

    def _ensure_configured(self) -> bool:
        if not self._configured:
            key = settings.gemini_api_key
            if not key or not key.strip():
                logger.warning("gemini_api_key_missing_for_embeddings")
                return False
            try:
                from google import genai
                self._client = genai.Client(api_key=key)
                self._configured = True
            except Exception as exc:
                logger.error("embedding_client_init_failed", error=str(exc))
                return False
        return self._configured

    def _fallback_inlegalbert_embed(self, text: str) -> list[float] | None:
        """Fallback to local InLegalBERT (768-dim, local CPU/GPU, zero external API cost)."""
        try:
            from app.services.inlegal_bert_service import inlegal_bert_service
            vec = inlegal_bert_service.embed_text(text)
            if vec and any(vec):
                return vec
        except Exception as exc:
            logger.warning("inlegalbert_embedding_fallback_failed", error=str(exc))
        return None

    async def embed_text(self, text: str) -> list[float] | None:
        """Generate a 768-dim embedding vector for a single text string."""
        if not self._ensure_configured():
            return self._fallback_inlegalbert_embed(text)
        try:
            text = text[:8000]  # Cap at safe token limit
            response = await self._client.aio.models.embed_content(  # type: ignore[union-attr]
                model="gemini-embedding-001",
                contents=text,
            )
            values = response.embeddings[0].values
            return list(values)
        except Exception as exc:
            logger.warning("embed_text_failed", error=str(exc))
            # Seamless fallback to local InLegalBERT
            return self._fallback_inlegalbert_embed(text)

    async def embed_batch(self, texts: list[str]) -> list[list[float] | None]:
        """Generate embeddings for a list of texts, returning None entries on failure."""
        results = []
        for text in texts:
            vec = await self.embed_text(text)
            results.append(vec)
        return results

    @staticmethod
    def cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
        """Compute cosine similarity between two vectors."""
        try:
            import numpy as np
            a = np.array(vec_a, dtype=np.float32)
            b = np.array(vec_b, dtype=np.float32)
            norm_a = np.linalg.norm(a)
            norm_b = np.linalg.norm(b)
            if norm_a == 0 or norm_b == 0:
                return 0.0
            return float(np.dot(a, b) / (norm_a * norm_b))
        except Exception:
            return 0.0

    def rank_chunks_by_similarity(
        self,
        query_vec: list[float],
        chunks: list[tuple],  # list of (chunk_text, embedding_list, metadata)
        top_k: int = 5,
    ) -> list[tuple[float, str, dict]]:
        """Return top-k chunks sorted by cosine similarity to query_vec.
        
        Each element in `chunks` should be (chunk_text, embedding, metadata_dict).
        Returns list of (score, chunk_text, metadata_dict).
        """
        scored = []
        for chunk_text, embedding, metadata in chunks:
            if embedding is None:
                continue
            score = self.cosine_similarity(query_vec, embedding)
            scored.append((score, chunk_text, metadata))
        scored.sort(key=lambda x: x[0], reverse=True)
        return scored[:top_k]


embedding_service = EmbeddingService()
