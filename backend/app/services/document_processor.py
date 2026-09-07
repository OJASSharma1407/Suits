"""Document processor service - OCR, text extraction, semantic chunking, and embedding for user documents."""

import io
import re
import os
import uuid
import structlog
from pathlib import Path
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.user_document import UserDocument, DocumentStatus
from app.models.document_chunk import DocumentChunk
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

    async def _extract_image_ocr(self, image_bytes: bytes, mime_type: str) -> str:
        """Use Gemini multimodal to OCR a scanned evidence image."""
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
                        return response.text
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

    async def generate_summary(self, text: str, filename: str) -> str:
        """Generate a concise 2-3 sentence summary of the document for the UI."""
        try:
            from app.clients.gemini_client import gemini_client
            snippet = text[:4000]
            prompt = (
                f"The following is the text of a legal document named '{filename}'.\n\n"
                f"{snippet}\n\n"
                "Provide a concise 2-3 sentence factual summary identifying: "
                "1) what type of document this is, 2) which case or parties it relates to, "
                "3) the key legal significance or content. "
                "Keep it short and factual."
            )
            summary = await gemini_client.generate(
                system_prompt="You are a legal document analyst. Provide concise, accurate summaries.",
                user_prompt=prompt,
                temperature=0.2,
                max_output_tokens=256,
            )
            return summary.strip()
        except Exception as exc:
            logger.warning("summary_generation_failed", error=str(exc))
            return f"Legal document: {filename}"

    async def generate_structured_ai_analysis(self, text: str, filename: str, cnr: Optional[str] = None) -> dict:
        """Extract rich structured legal data from the uploaded document."""
        from app.services.order_service import _ORDER_AI_SYSTEM_PROMPT, _ORDER_AI_EXTRACTION_PROMPT
        from app.clients.gemini_client import gemini_client
        from app.clients.openrouter_client import openrouter_client

        if not text or not text.strip():
            return {}

        extraction_prompt = _ORDER_AI_EXTRACTION_PROMPT.replace("{order_text}", text[:30000])

        try:
            logger.info("DOCUMENT_AI_EXTRACTION_START", filename=filename, text_length=len(text))
            raw = await gemini_client.generate_json(
                system_prompt=_ORDER_AI_SYSTEM_PROMPT,
                user_prompt=extraction_prompt,
            )
            if not raw or not raw.get("executiveSummary") or raw.get("extractionConfidence", 0.0) == 0.0:
                logger.info("DOCUMENT_AI_FALLING_BACK_TO_OPENROUTER", filename=filename)
                raw = await openrouter_client.generate_json(
                    system_prompt=_ORDER_AI_SYSTEM_PROMPT,
                    user_prompt=extraction_prompt,
                )
            if isinstance(raw, dict):
                logger.info("DOCUMENT_AI_EXTRACTION_SUCCESS", filename=filename, keys=list(raw.keys()))
                if cnr and "cnr" not in raw:
                    raw["cnr"] = cnr
                raw["filename"] = filename
                return raw
        except Exception as exc:
            logger.error("structured_ai_analysis_failed", filename=filename, error=str(exc))

        return {
            "caseNumber": cnr or filename,
            "courtName": "User Document Record",
            "executiveSummary": f"Document {filename} uploaded for legal analysis.",
            "plainLanguageSummary": f"Uploaded document: {filename}",
            "extractionConfidence": 0.5,
            "filename": filename,
            "cnr": cnr or "",
        }

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

            # Extract text
            extracted_text, page_count = await self.extract_text(
                file_data, doc.mime_type, doc.original_filename
            )
            doc.extracted_text = extracted_text
            doc.page_count = page_count

            # Generate quick summary
            doc.summary = await self.generate_summary(extracted_text, doc.original_filename)

            # Generate deep structured legal AI analysis
            doc.ai_analysis = await self.generate_structured_ai_analysis(
                extracted_text, doc.original_filename, doc.cnr
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
            )

        except Exception as exc:
            logger.error("document_processing_failed", document_id=str(document_id), error=str(exc))
            doc.status = DocumentStatus.FAILED
            doc.error_message = str(exc)
            await self.db.flush()
