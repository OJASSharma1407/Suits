"""Unit tests for Headnote DB Cache and CacheRepository."""

import json
import pytest
from datetime import datetime, timezone

from app.database.session import async_session_factory
from app.models.cached_headnote import CachedHeadnote
from app.repositories.cache_repository import CacheRepository
from app.schemas.headnote import CaseHeadnote, CaseHeadnoteResponse
from app.services.headnote_service import HeadnoteService
from app.services.cache_service import cache_service


@pytest.mark.asyncio
async def test_headnote_cache_repository_crud():
    """Verify that CacheRepository saves and retrieves cached headnotes correctly."""
    async with async_session_factory() as db_session:
        repo = CacheRepository(db_session)
        test_cnr = "TESTCNR123456789"
        test_hash = "abc123def456"

    # 1. Create a dummy headnote payload
    headnote_data = {
        "catchwords": ["Arbitration Act", "Section 11", "Appointment of Arbitrator"],
        "held_points": ["Court has jurisdiction under Section 11."],
        "ratio_decidendi_summary": "Test ratio summary.",
        "obiter_dicta": [],
        "precedent_citator_table": [],
        "statutory_provisions_considered": [],
        "operative_disposition": "Allowed",
    }
    resp_obj = CaseHeadnoteResponse(
        target_cnr=test_cnr,
        order_title="Test Order",
        headnote=CaseHeadnote(**headnote_data),
        order_hash=test_hash,
        is_cached=False,
        generated_at=datetime.now(timezone.utc).isoformat(),
    )

    db_record = CachedHeadnote(
        cnr=test_cnr,
        order_hash=test_hash,
        headnote_json=json.dumps(resp_obj.model_dump()),
        generated_at=datetime.now(timezone.utc),
    )

    # 2. Save via CacheRepository (should auto-create parent CachedCase if absent)
    saved = await repo.save_cached_headnote(db_record)
    assert saved.cnr == test_cnr
    assert saved.order_hash == test_hash

    # 3. Retrieve by CNR and order_hash
    fetched = await repo.get_cached_headnote(test_cnr, test_hash)
    assert fetched is not None
    assert fetched.cnr == test_cnr
    assert fetched.order_hash == test_hash

    # 4. Retrieve by CNR only
    fetched_general = await repo.get_cached_headnote(test_cnr)
    assert fetched_general is not None
    assert fetched_general.cnr == test_cnr

    # 5. Invalidate
    await repo.invalidate_headnote(test_cnr, test_hash)
    assert await repo.get_cached_headnote(test_cnr, test_hash) is None
    await db_session.commit()
    print("test_headnote_cache_repository_crud PASSED successfully!")


@pytest.mark.asyncio
async def test_headnote_service_db_cache_hit():
    """Verify that HeadnoteService returns DB-cached headnote with is_cached=True without calling LLM."""
    async with async_session_factory() as db_session:
        repo = CacheRepository(db_session)
        test_cnr = "TESTCNR999999999"
        test_hash = "hash999888777"

        # Pre-seed DB cache directly
        headnote_data = {
            "catchwords": ["Constitutional Law", "Article 226", "Writ of Mandamus"],
            "held_points": ["Writ is maintainable."],
            "ratio_decidendi_summary": "Summary of ratio.",
            "obiter_dicta": [],
            "precedent_citator_table": [],
            "statutory_provisions_considered": [],
            "operative_disposition": "Allowed",
        }
        resp_obj = CaseHeadnoteResponse(
            target_cnr=test_cnr,
            order_title="Pre-cached Judgment",
            headnote=CaseHeadnote(**headnote_data),
            order_hash=test_hash,
            is_cached=False,
            generated_at=datetime.now(timezone.utc).isoformat(),
        )
        db_record = CachedHeadnote(
            cnr=test_cnr,
            order_hash=test_hash,
            headnote_json=json.dumps(resp_obj.model_dump()),
            generated_at=datetime.now(timezone.utc),
        )
        await repo.save_cached_headnote(db_record)
        await db_session.commit()

        # Instantiate HeadnoteService and request headnote
        svc = HeadnoteService(db_session)
        # Even without order text, it should hit the DB fallback cache
        res = await svc.get_or_generate_headnote(test_cnr)
        assert res is not None
        assert res.is_cached is True
        assert res.target_cnr == test_cnr
        assert res.headnote.operative_disposition == "Allowed"

        # Cleanup
        await repo.invalidate_headnote(test_cnr)
        await db_session.commit()
        print("test_headnote_service_db_cache_hit PASSED successfully!")


if __name__ == "__main__":
    import asyncio
    async def run_all():
        await test_headnote_cache_repository_crud()
        await test_headnote_service_db_cache_hit()
    asyncio.run(run_all())

