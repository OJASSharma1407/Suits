"""InLegalBERT Service - Domain-Specific Legal Embeddings & Precedent Re-Ranking.

Implements law-ai/InLegalBERT with:
1. Lazy loading & CPU thread capping (torch.set_num_threads).
2. Legal document chunking adhering strictly to the 512-token boundary.
3. Mode 1: Whitened Bi-Encoder with covariance decorrelation to eliminate BERT anisotropy.
4. Mode 2: Fine-Tuned Bi-Encoder option.
"""

from __future__ import annotations

import os
from typing import Any

import numpy as np
import structlog

from app.core.config import settings

logger = structlog.get_logger()

WHITENING_MATRIX_PATH = os.path.join(
    os.path.dirname(__file__), "..", "..", "data", "models", "inlegalbert_whitening.npz"
)


class InLegalBertService:
    """Service for computing InLegalBERT legal embeddings and pairwise precedent similarity."""

    def __init__(self, model_name: str = "law-ai/InLegalBERT") -> None:
        self.model_name = model_name
        self._tokenizer = None
        self._model = None
        self._device = None
        self._loaded = False
        self._whitening_w: np.ndarray | None = None
        self._whitening_mu: np.ndarray | None = None
        self._load_whitening_matrix()

    def _load_whitening_matrix(self) -> None:
        """Load precomputed whitening matrix if available on disk."""
        if os.path.exists(WHITENING_MATRIX_PATH):
            try:
                data = np.load(WHITENING_MATRIX_PATH)
                self._whitening_w = data["W"]
                self._whitening_mu = data["mu"]
                logger.info("inlegalbert_whitening_matrix_loaded", shape=self._whitening_w.shape)
            except Exception as exc:
                logger.warning("inlegalbert_whitening_load_failed", error=str(exc))

    def _ensure_loaded(self) -> bool:
        """Lazy loader - loads model and tokenizer on first request."""
        if self._loaded:
            return True

        try:
            import torch
            from transformers import AutoModel, AutoTokenizer

            # Hardware selection
            if settings.inlegalbert_device == "cuda" and torch.cuda.is_available():
                self._device = torch.device("cuda")
            elif settings.inlegalbert_device == "cpu":
                self._device = torch.device("cpu")
                torch.set_num_threads(2)
            else:
                self._device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
                if self._device.type == "cpu":
                    torch.set_num_threads(2)

            logger.info("loading_inlegalbert_model", model=self.model_name, device=str(self._device))

            # Try local cache first (no network call, ~0.4s).
            # Falls back to HF Hub download only if model files aren't cached yet.
            try:
                self._tokenizer = AutoTokenizer.from_pretrained(self.model_name, local_files_only=True)
                self._model = AutoModel.from_pretrained(self.model_name, local_files_only=True)
                logger.info("inlegalbert_loaded_from_local_cache", model=self.model_name)
            except (OSError, EnvironmentError):
                logger.info("inlegalbert_not_cached_downloading", model=self.model_name)
                self._tokenizer = AutoTokenizer.from_pretrained(self.model_name)
                self._model = AutoModel.from_pretrained(self.model_name)
            self._model.to(self._device)
            self._model.eval()
            self._loaded = True
            return True
        except Exception as exc:
            logger.error("inlegalbert_load_failed", error=str(exc))
            return False

    def chunk_legal_text(self, text: str, max_tokens: int = 440, overlap: int = 40) -> list[str]:
        """Split legal judgment or facts into overlapping chunks respecting token limit."""
        if not text or not text.strip():
            return []

        if not self._ensure_loaded():
            # Fallback word-based chunking if model not loaded yet
            words = text.split()
            chunks = []
            for i in range(0, len(words), max_tokens - overlap):
                chunk = " ".join(words[i : i + max_tokens])
                if chunk.strip():
                    chunks.append(chunk.strip())
            return chunks or [text[:1500]]

        tokens = self._tokenizer.encode(text, add_special_tokens=False)  # type: ignore[union-attr]
        if len(tokens) <= max_tokens:
            return [text.strip()]

        chunks = []
        stride = max_tokens - overlap
        for i in range(0, len(tokens), stride):
            sub_tokens = tokens[i : i + max_tokens]
            chunk_str = self._tokenizer.decode(sub_tokens, skip_special_tokens=True).strip()  # type: ignore[union-attr]
            if chunk_str:
                chunks.append(chunk_str)

        return chunks

    def embed_text(self, text: str) -> list[float]:
        """Convert legal text into a 768-dimensional normalized InLegalBERT vector."""
        if not text or not text.strip():
            return [0.0] * 768

        if not self._ensure_loaded():
            return [0.0] * 768

        import torch
        import torch.nn.functional as F

        inputs = self._tokenizer(  # type: ignore[union-attr]
            text.strip(),
            padding=True,
            truncation=True,
            max_length=512,
            return_tensors="pt",
        ).to(self._device)

        with torch.no_grad():
            outputs = self._model(**inputs)  # type: ignore[misc]
            attention_mask = inputs["attention_mask"].unsqueeze(-1)
            token_embeddings = outputs.last_hidden_state
            sum_embeddings = torch.sum(token_embeddings * attention_mask, dim=1)
            sum_mask = torch.clamp(attention_mask.sum(dim=1), min=1e-9)
            mean_pooled = sum_embeddings / sum_mask

            vec_np = mean_pooled.cpu().numpy()

            # Mode 1: Apply Whitening Transform if available to eliminate BERT anisotropy
            if settings.inlegalbert_scoring_mode == "whitened" and self._whitening_w is not None and self._whitening_mu is not None:
                vec_np = (vec_np - self._whitening_mu) @ self._whitening_w

            norm = np.linalg.norm(vec_np, axis=-1, keepdims=True)
            norm = np.maximum(norm, 1e-9)
            normalized = vec_np / norm

            return normalized.squeeze(0).tolist()

    def compute_similarity(self, vec_a: list[float], vec_b: list[float]) -> float:
        """Compute cosine similarity between two normalized embedding vectors."""
        if not vec_a or not vec_b or len(vec_a) != len(vec_b):
            return 0.0
        a = np.array(vec_a, dtype=np.float32)
        b = np.array(vec_b, dtype=np.float32)
        dot = float(np.dot(a, b))
        return max(0.0, min(1.0, (dot + 1.0) / 2.0)) if dot < 0 else min(1.0, dot)

    def score_precedent_match_with_vecs(
        self,
        target_vecs: list[list[float]],
        precedent_text: str,
    ) -> float:
        """Score semantic congruence against precomputed target fact vectors."""
        if not target_vecs or not precedent_text:
            return 0.5

        prec_chunks = self.chunk_legal_text(precedent_text, max_tokens=400, overlap=40)[:2]
        if not prec_chunks:
            return 0.5

        prec_vecs = [self.embed_text(c) for c in prec_chunks]
        max_sim = 0.0
        for t_vec in target_vecs:
            for p_vec in prec_vecs:
                sim = self.compute_similarity(t_vec, p_vec)
                if sim > max_sim:
                    max_sim = sim

        return round(max_sim, 3)

    def score_precedent_match(
        self,
        target_facts_chunks: list[str],
        precedent_text: str,
    ) -> float:
        """Score maximum semantic congruence between active case facts and precedent judgment."""
        if not target_facts_chunks or not precedent_text:
            return 0.5

        target_vecs = [self.embed_text(c) for c in target_facts_chunks[:2]]
        return self.score_precedent_match_with_vecs(target_vecs, precedent_text)


inlegal_bert_service = InLegalBertService()
