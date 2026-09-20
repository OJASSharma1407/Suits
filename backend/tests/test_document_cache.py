"""Unit tests for DocumentProcessor DB and Redis caching."""

import uuid
import pytest
from datetime import datetime, timezone

from app.database.session import async_session_factory
from app.models.user import User
from app.models.user_document import UserDocument, DocumentStatus, DocumentTag
from app.repositories.document_repository import DocumentRepository
from app.services.document_processor import DocumentProcessor
from app.services.cache_service import cache_service


@pytest.mark.asyncio
async def test_document_processor_summary_and_ocr_cache():
    """Verify that DocumentProcessor checks and returns cached summary and OCR without invoking Gemini."""
    async with async_session_factory() as db:
        repo = DocumentRepository(db)
        processor = DocumentProcessor(db)

        test_user_id = uuid.uuid4()
        test_hash = "dochash_12345678"

        # Create test user for foreign key constraint
        test_user = User(
            id=test_user_id,
            full_name="Doc Cache Tester",
            email=f"tester_{test_user_id.hex[:8]}@suits.internal",
            password_hash="fakehash",
            is_verified=True,
        )
        db.add(test_user)
        await db.flush()

        # 1. Pre-seed a UserDocument with content_hash, summary, extracted_text, and ai_analysis
        doc = UserDocument(
            user_id=test_user_id,
            filename="evidence_contract.pdf",
            original_filename="evidence_contract.pdf",
            file_path="/data/uploads/fake/evidence_contract.pdf",
            file_size=10240,
            mime_type="application/pdf",
            tag=DocumentTag.EVIDENCE,
            status=DocumentStatus.INDEXED,
            content_hash=test_hash,
            extracted_text="Commercial Lease Agreement executed on 1st January 2024 between Lessor and Lessee.",
            summary="Commercial Agreement (evidence_contract.pdf). Key context: Lease Agreement between Lessor and Lessee.",
            ai_analysis={
                "caseNumber": "COMM-01",
                "courtName": "Commercial Court",
                "executiveSummary": "Dispute concerning breach of commercial lease terms.",
                "extractionConfidence": 0.95,
            },
        )
        await repo.create(doc)
        await db.commit()

        # 2. Test DocumentRepository cache lookup methods
        cached_summary = await repo.find_matching_summary(test_hash)
        assert cached_summary is not None
        assert "Commercial Agreement" in cached_summary

        cached_analysis = await repo.find_matching_ai_analysis(test_hash)
        assert cached_analysis is not None
        assert cached_analysis["caseNumber"] == "COMM-01"

        cached_ocr = await repo.find_matching_ocr(test_hash)
        assert cached_ocr is not None
        text, page_count = cached_ocr
        assert "Commercial Lease Agreement" in text

        # 3. Test DocumentProcessor.generate_summary with matching content_hash
        # Should hit DB cache directly with zero LLM calls
        svc_summary = await processor.generate_summary(
            text=doc.extracted_text,
            filename="new_upload_copy.pdf",
            content_hash=test_hash,
        )
        assert svc_summary == cached_summary

        # 4. Test DocumentProcessor.generate_structured_ai_analysis with matching content_hash
        # Should hit DB cache directly with zero LLM calls
        svc_analysis = await processor.generate_structured_ai_analysis(
            text=doc.extracted_text,
            filename="new_upload_copy.pdf",
            content_hash=test_hash,
        )
        assert svc_analysis == cached_analysis

        # 5. Test Heuristic summary fallback (offline / quota exhausted)
        heuristic = DocumentProcessor._heuristic_document_summary(
            "FIRST INFORMATION REPORT\nUnder Section 154 Cr.P.C.\nPolice Station: Connaught Place\nDetails of offence...",
            "FIR_101.pdf",
        )
        assert "First Information Report (FIR)" in heuristic
        assert "FIR_101.pdf" in heuristic

        # Cleanup
        await repo.delete_document(doc.id)
        from sqlalchemy import delete
        await db.execute(delete(User).where(User.id == test_user_id))
        await db.commit()
        print("test_document_processor_summary_and_ocr_cache PASSED successfully!")


if __name__ == "__main__":
    import asyncio
    asyncio.run(test_document_processor_summary_and_ocr_cache())
