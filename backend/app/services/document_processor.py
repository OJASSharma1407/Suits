"""Document processor service - OCR, text extraction, semantic chunking, and embedding for user documents."""

import io
import re
import os
import uuid
import hashlib
import json
import structlog
from pathlib import Path
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.user_document import UserDocument, DocumentStatus
from app.models.document_chunk import DocumentChunk
from app.repositories.document_repository import DocumentRepository
from app.repositories.cache_repository import CacheRepository
from app.services.cache_service import cache_service
from app.services.embedding_service import embedding_service

logger = structlog.get_logger()

# Upload directory — anchored to the backend root (parent of the `app` package)
# so stored absolute paths resolve correctly regardless of the process CWD.
_BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent  # …/Suits/backend
UPLOAD_DIR = _BACKEND_ROOT / "data" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Supported MIME types and their extensions
ALLOWED_MIME_TYPES = {
    "application/pdf": ".pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/msword": ".doc",
    "text/plain": ".txt",
    "text/markdown": ".md",
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/tiff": ".tiff",
}

MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB
CHUNK_SIZE = 800          # characters per chunk
CHUNK_OVERLAP = 150       # overlap between consecutive chunks


class DocumentProcessor:
    """Handles file upload, OCR/text extraction, chunking, and embedding generation."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.doc_repo = DocumentRepository(db)
        self.cache_repo = CacheRepository(db)

    # ------------------------------------------------------------------ #
    #  File Validation & Storage                                          #
    # ------------------------------------------------------------------ #

    def validate_file(self, filename: str, content_type: str, size: int) -> None:
        """Raise ValueError if the file does not meet requirements."""
        if size > MAX_FILE_SIZE_BYTES:
            raise ValueError(f"File too large ({size // 1024 // 1024} MB). Maximum is 25 MB.")
        if content_type not in ALLOWED_MIME_TYPES:
            raise ValueError(
                f"Unsupported file type: {content_type}. "
                f"Supported: PDF, DOCX, TXT, MD, PNG, JPG, TIFF."
            )

    def save_file(self, user_id: uuid.UUID, filename: str, data: bytes) -> Path:
        """Save raw file bytes to disk under data/uploads/{user_id}/. Returns the path."""
        user_dir = UPLOAD_DIR / str(user_id)
        user_dir.mkdir(parents=True, exist_ok=True)
        # Use a unique name to avoid collisions
        safe_name = f"{uuid.uuid4().hex}_{filename}"
        file_path = user_dir / safe_name
        file_path.write_bytes(data)
        return file_path

    # ------------------------------------------------------------------ #
    #  Text Extraction                                                    #
    # ------------------------------------------------------------------ #

    async def extract_text(self, file_data: bytes, mime_type: str, filename: str) -> tuple[str, int]:
        """Extract text from file bytes.

        Returns (extracted_markdown, page_count).
        For scanned PDFs/images, delegates to Gemini multimodal OCR.
        """
        if mime_type == "application/pdf":
            return await self._extract_pdf(file_data)
        elif mime_type in (
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/msword",
        ):
            return self._extract_docx(file_data), 0
        elif mime_type in ("text/plain", "text/markdown"):
            return file_data.decode("utf-8", errors="replace"), 0
        elif mime_type in ("image/png", "image/jpeg", "image/tiff"):
            return await self._extract_image_ocr(file_data, mime_type), 1
        return "", 0

    async def _extract_pdf(self, pdf_bytes: bytes) -> tuple[str, int]:
        """Try pypdf first; fall back to Gemini OCR for scanned/image PDFs."""
        text = ""
        page_count = 0
        try:
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
            page_count = len(reader.pages)
            pages_text = []
            for page in reader.pages:
                pt = page.extract_text() or ""
                pages_text.append(pt)
            text = "\n\n".join(pages_text)
        except Exception as exc:
            logger.warning("pypdf_extraction_failed", error=str(exc))

        # If fewer than 100 chars extracted, treat as scanned and use Gemini OCR
        if len(text.strip()) < 100:
            logger.info("pdf_appears_scanned_using_gemini_ocr")
            from app.clients.gemini_client import gemini_client
            text = await gemini_client.extract_markdown_from_pdf(pdf_bytes)

        return text, page_count

    def _extract_docx(self, docx_bytes: bytes) -> str:
        """Extract text from a .docx file using python-docx."""
        try:
            import docx
            doc = docx.Document(io.BytesIO(docx_bytes))
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            return "\n\n".join(paragraphs)
        except Exception as exc:
            logger.warning("docx_extraction_failed", error=str(exc))
            return ""

    async def _extract_image_ocr(self, image_bytes: bytes, mime_type: str, img_hash: Optional[str] = None) -> str:
        """Use Gemini multimodal to OCR a scanned evidence image with Redis and DB caching."""
        hash_val = img_hash or hashlib.sha256(image_bytes).hexdigest()[:16]
        redis_key = f"image_ocr:{hash_val}"

        # 1. Fast Redis cache check
        cached = await cache_service.get(redis_key)
        if cached and isinstance(cached, str) and not cached.startswith("*"):
            logger.info("image_ocr_redis_cache_hit", hash=hash_val)
            return cached

        # 2. Database cache check via DocumentRepository
        db_ocr = await self.doc_repo.find_matching_ocr(hash_val)
        if db_ocr:
            text, _ = db_ocr
            logger.info("image_ocr_db_cache_hit", hash=hash_val)
            await cache_service.set(redis_key, text)
            return text

        try:
            from google.genai import types
            from app.clients.gemini_client import gemini_client

            if not gemini_client._ensure_configured():
                return "*OCR unavailable: Gemini API key not configured.*"

            prompt = (
                "You are a legal document digitization expert. "
                "This is a scanned legal document image (court order, FIR, affidavit, or evidence). "
                "Transcribe ALL text from this image faithfully into clean, structured Markdown. "
                "Preserve party names, dates, section numbers, judge names, and legal citations exactly. "
                "Do NOT summarize - transcribe the full text."
            )
            image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
            for model_name in gemini_client._model_candidates():
                try:
                    response = await gemini_client.client.aio.models.generate_content(  # type: ignore
                        model=model_name,
                        contents=[prompt, image_part],
                        config=types.GenerateContentConfig(temperature=0.1, max_output_tokens=4096),
                    )
                    if response and response.text:
                        ocr_result = response.text.strip()
                        await cache_service.set(redis_key, ocr_result)
                        return ocr_result
                except Exception as exc:
                    logger.warning("gemini_image_ocr_failed", model=model_name, error=str(exc))
                    continue
        except Exception as exc:
            logger.error("image_ocr_failed", error=str(exc))
        return "*Image OCR failed.*"

    # ------------------------------------------------------------------ #
    #  Chunking                                                           #
    # ------------------------------------------------------------------ #

    def chunk_text(self, text: str) -> list[str]:
        """Split text into overlapping semantic chunks respecting paragraph breaks."""
        if not text.strip():
            return []

        # Split by paragraphs first, then merge into target-size chunks
        paragraphs = re.split(r"\n{2,}", text)
        chunks: list[str] = []
        current_chunk = ""

        for paragraph in paragraphs:
            paragraph = paragraph.strip()
            if not paragraph:
                continue

            if len(current_chunk) + len(paragraph) + 2 <= CHUNK_SIZE:
                current_chunk = (current_chunk + "\n\n" + paragraph).strip()
            else:
                if current_chunk:
                    chunks.append(current_chunk)
                    # Keep overlap from end of previous chunk
                    overlap_text = current_chunk[-CHUNK_OVERLAP:] if len(current_chunk) > CHUNK_OVERLAP else current_chunk
                    current_chunk = (overlap_text + "\n\n" + paragraph).strip()
                else:
                    # Paragraph itself is too long — split by sentence
                    sentences = re.split(r"(?<=[.!?])\s+", paragraph)
                    for sentence in sentences:
                        if len(current_chunk) + len(sentence) + 1 <= CHUNK_SIZE:
                            current_chunk = (current_chunk + " " + sentence).strip()
                        else:
                            if current_chunk:
                                chunks.append(current_chunk)
                            current_chunk = sentence

        if current_chunk:
            chunks.append(current_chunk)

        return [c for c in chunks if len(c.strip()) > 30]

    # ------------------------------------------------------------------ #
    #  AI Summary & Structured Legal Analysis                            #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _heuristic_document_summary(text: str, filename: str) -> str:
        """Extract a structured factual summary from document text without calling an external LLM."""
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        if not lines:
            return f"Legal document: {filename}"

        clean_name = filename.lower()
        if "fir" in clean_name or any("first information report" in l.lower() for l in lines[:15]):
            doc_type = "First Information Report (FIR)"
        elif "bail" in clean_name or any("bail application" in l.lower() for l in lines[:15]):
            doc_type = "Bail Application"
        elif "writ" in clean_name or any("writ petition" in l.lower() for l in lines[:15]):
            doc_type = "Writ Petition"
        elif "affidavit" in clean_name or any("affidavit" in l.lower() for l in lines[:15]):
            doc_type = "Sworn Affidavit"
        elif "order" in clean_name or any("in the court of" in l.lower() or "judgment" in l.lower() for l in lines[:15]):
            doc_type = "Court Order / Judgment"
        elif "notice" in clean_name or any("legal notice" in l.lower() for l in lines[:15]):
            doc_type = "Legal Notice"
        elif "agreement" in clean_name or "contract" in clean_name:
            doc_type = "Agreement / Contract"
        else:
            doc_type = "Legal Document"

        paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if len(p.strip()) > 60]
        lead_excerpt = ""
        for p in paragraphs:
            if not any(header in p.lower() for header in ["in the high court", "in the supreme court", "before the court"]):
                lead_excerpt = p[:250].replace("\n", " ").strip()
                break
        if not lead_excerpt and paragraphs:
            lead_excerpt = paragraphs[0][:250].replace("\n", " ").strip()

        if lead_excerpt:
            return f"{doc_type} ({filename}). Context: {lead_excerpt}..."
        return f"{doc_type} ({filename}) containing {len(text)} characters of record pleadings."

    async def generate_summary(self, text: str, filename: str, content_hash: Optional[str] = None) -> str:
        """Generate a concise 2-3 sentence summary of the document for the UI with Redis & DB caching."""
        if not text or not text.strip():
            return f"Legal document: {filename}"

        snippet = text[:4000]
        hash_val = content_hash or hashlib.sha256(snippet.encode("utf-8")).hexdigest()[:16]
        redis_key = f"doc_summary:{hash_val}"

        # 1. Fast Redis cache check
        cached = await cache_service.get(redis_key)
        if cached and isinstance(cached, str) and len(cached.strip()) > 15 and not cached.startswith("Legal document:"):
            logger.info("doc_summary_redis_cache_hit", hash=hash_val, filename=filename)
            return cached.strip()

        # 2. Database cache check (across existing user documents with matching content hash)
        db_summary = await self.doc_repo.find_matching_summary(hash_val)
        if db_summary:
            logger.info("doc_summary_db_cache_hit", hash=hash_val, filename=filename)
            await cache_service.set(redis_key, db_summary)
            return db_summary

        # 3. LLM Generation via OpenRouter (with Gemini fallback)
        try:
            summary = None
            prompt = (
                f"The following is the text of a legal document named '{filename}'.\n\n"
                f"{snippet}\n\n"
                "Provide a concise 2-3 sentence factual summary identifying: "
                "1) what type of document this is, 2) which case or parties it relates to, "
                "3) the key legal significance or content. "
                "Keep it short and factual."
            )
            try:
                from app.services.ai_orchestrator import ai_orchestrator
                summary = await ai_orchestrator.generate_text_gemini_first(
                    prompt=prompt,
                    system_prompt="You are a legal document analyst. Provide concise, accurate summaries.",
                    temperature=0.2,
                )
            except Exception as or_err:
                logger.warning("ai_orchestrator_summary_failed", error=str(or_err))

            if summary:
                cleaned_summary = summary.strip()
                if cleaned_summary and len(cleaned_summary) > 15:
                    await cache_service.set(redis_key, cleaned_summary)
                    return cleaned_summary
        except Exception as exc:
            logger.warning("summary_generation_failed", error=str(exc))

        # 4. Deterministic heuristic extraction fallback (zero LLM calls)
        fallback = self._heuristic_document_summary(text, filename)
        await cache_service.set(redis_key, fallback)
        return fallback

    async def generate_structured_ai_analysis(
        self,
        text: str,
        filename: str,
        cnr: Optional[str] = None,
        content_hash: Optional[str] = None,
    ) -> dict:
        """Extract rich structured legal data from the uploaded document with Redis & DB caching."""
        if not text or not text.strip():
            return {}

        hash_val = content_hash or hashlib.sha256(text[:30000].encode("utf-8")).hexdigest()[:16]
        redis_key = f"doc_analysis:{hash_val}"

        # 1. Fast Redis cache check
        cached = await cache_service.get(redis_key)
        if cached and isinstance(cached, dict) and cached.get("executiveSummary"):
            logger.info("doc_analysis_redis_cache_hit", hash=hash_val, filename=filename)
            return cached

        # 2. Database cache check via DocumentRepository
        db_analysis = await self.doc_repo.find_matching_ai_analysis(hash_val)
        if db_analysis:
            logger.info("doc_analysis_db_cache_hit", hash=hash_val, filename=filename)
            await cache_service.set(redis_key, db_analysis)
            return db_analysis

        # 3. Check CachedAIAnalysis if CNR is attached
        if cnr:
            cached_ai = await self.cache_repo.get_cached_ai(cnr, filename)
            if cached_ai and cached_ai.ai_json:
                try:
                    data = json.loads(cached_ai.ai_json)
                    if isinstance(data, dict) and data.get("executiveSummary"):
                        logger.info("doc_analysis_cached_ai_hit", cnr=cnr, filename=filename)
                        await cache_service.set(redis_key, data)
                        return data
                except Exception:
                    pass

        # 4. Synthesize via AI Orchestrator (Local Ollama or Cloud)
        from app.services.ai_orchestrator import ai_orchestrator
        from app.services.order_service import (
            _ORDER_AI_SYSTEM_PROMPT,
            _ORDER_AI_EXTRACTION_PROMPT,
            _ORDER_AI_LOCAL_SYSTEM_PROMPT,
            _ORDER_AI_LOCAL_PROMPT,
        )

        is_local = ai_orchestrator.is_local()
        if is_local:
            if len(text) > 7000:
                head_txt = text[:3500]
                tail_txt = text[-3500:]
                condensed_text = f"{head_txt}\n\n[... intermediate text omitted for concise processing ...]\n\n{tail_txt}"
            else:
                condensed_text = text
            extraction_prompt = _ORDER_AI_LOCAL_PROMPT.replace("{order_text}", condensed_text)
            system_prompt = _ORDER_AI_LOCAL_SYSTEM_PROMPT
            target_max_tokens = 1500
        else:
            condensed_text = text[:30000]
            extraction_prompt = _ORDER_AI_EXTRACTION_PROMPT.replace("{order_text}", condensed_text)
            system_prompt = _ORDER_AI_SYSTEM_PROMPT
            target_max_tokens = 4096

        try:
            logger.info("DOCUMENT_AI_EXTRACTION_START", filename=filename, text_length=len(condensed_text), is_local=is_local)
            raw = None
            try:
                raw = await ai_orchestrator.generate_json_gemini_first(
                    system_prompt=system_prompt,
                    user_prompt=extraction_prompt,
                    max_tokens=target_max_tokens,
                )
            except Exception as exc:
                logger.warning("ai_orchestrator_doc_ai_failed", error=str(exc))

            if isinstance(raw, dict):
                from app.services.order_service import _normalize_order_ai_dict
                raw = _normalize_order_ai_dict(raw)

            if isinstance(raw, dict) and raw.get("executiveSummary"):
                logger.info("DOCUMENT_AI_EXTRACTION_SUCCESS", filename=filename, keys=list(raw.keys()))
                if cnr and "cnr" not in raw:
                    raw["cnr"] = cnr
                raw["filename"] = filename
                await cache_service.set(redis_key, raw)

                # If CNR attached, also save to CachedAIAnalysis permanent table
                if cnr:
                    from app.models.cached_ai_analysis import CachedAIAnalysis
                    try:
                        await self.cache_repo.save_cached_ai(CachedAIAnalysis(
                            cnr=cnr,
                            filename=filename,
                            ai_json=json.dumps(raw),
                        ))
                    except Exception as err:
                        logger.warning("failed_saving_cached_ai_analysis", error=str(err))

                return raw
        except Exception as exc:
            logger.error("structured_ai_analysis_failed", filename=filename, error=str(exc))

        fallback_dict = {
            "caseNumber": cnr or filename,
            "courtName": "User Document Record",
            "executiveSummary": f"Document {filename} uploaded for legal analysis.",
            "plainLanguageSummary": f"Uploaded document: {filename}",
            "extractionConfidence": 0.5,
            "filename": filename,
            "cnr": cnr or "",
        }
        await cache_service.set(redis_key, fallback_dict)
        return fallback_dict

    # ------------------------------------------------------------------ #
    #  Full Pipeline                                                      #
    # ------------------------------------------------------------------ #

    async def process_document(self, document_id: uuid.UUID) -> None:
        """Run the full OCR → AI analysis → chunk → embed pipeline for a document."""
        from sqlalchemy import select

        result = await self.db.execute(
            select(UserDocument).where(UserDocument.id == document_id)
        )
        doc = result.scalar_one_or_none()
        if doc is None:
            logger.error("process_document_not_found", document_id=str(document_id))
            return

        # Mark as processing
        doc.status = DocumentStatus.PROCESSING
        await self.db.flush()

        try:
            # Read file from disk
            file_path = Path(doc.file_path)
            if not file_path.exists():
                raise FileNotFoundError(f"File not found: {doc.file_path}")

            file_data = file_path.read_bytes()

            # Ensure content_hash is populated on document
            content_hash = doc.content_hash or hashlib.sha256(file_data).hexdigest()[:16]
            doc.content_hash = content_hash

            # Check if OCR / text extraction is already cached in DB for this content hash
            cached_ocr = await self.doc_repo.find_matching_ocr(content_hash)
            if cached_ocr:
                extracted_text, page_count = cached_ocr
                logger.info("document_ocr_db_cache_hit", document_id=str(document_id), content_hash=content_hash)
            else:
                extracted_text, page_count = await self.extract_text(
                    file_data, doc.mime_type, doc.original_filename
                )
            doc.extracted_text = extracted_text
            doc.page_count = page_count

            # Generate quick summary (using Redis + DB cache)
            doc.summary = await self.generate_summary(
                extracted_text, doc.original_filename, content_hash=content_hash
            )

            # Generate deep structured legal AI analysis (using Redis + DB cache)
            doc.ai_analysis = await self.generate_structured_ai_analysis(
                extracted_text, doc.original_filename, doc.cnr, content_hash=content_hash
            )

            # Chunk the text
            chunks = self.chunk_text(extracted_text)
            doc.chunk_count = len(chunks)

            # Try generating embeddings if available (non-blocking)
            try:
                for idx, chunk_text in enumerate(chunks):
                    embedding_vec = await embedding_service.embed_text(chunk_text)
                    chunk = DocumentChunk(
                        document_id=doc.id,
                        chunk_index=idx,
                        chunk_text=chunk_text,
                        token_count=len(chunk_text.split()),
                        embedding=embedding_vec,
                    )
                    self.db.add(chunk)
            except Exception as emb_exc:
                logger.warning("embedding_generation_skipped", error=str(emb_exc))

            # Mark as indexed
            doc.status = DocumentStatus.INDEXED
            await self.db.flush()

            logger.info(
                "document_processed",
                document_id=str(document_id),
                chunks=len(chunks),
                pages=page_count,
                content_hash=content_hash,
            )

        except Exception as exc:
            logger.error("document_processing_failed", document_id=str(document_id), error=str(exc))
            doc.status = DocumentStatus.FAILED
            doc.error_message = str(exc)
            await self.db.flush()
