"""Purge stale error cache entries and reset cache for Indian Kanoon live integration."""

import asyncio
import os
import sqlite3
import redis.asyncio as aioredis


DB_PATH = os.path.join(os.path.dirname(__file__), "suits.db")


async def clear():
    print("[1/2] Cleaning database stale error cache entries...")
    if os.path.exists(DB_PATH):
        # Use timeout=30 and retry on lock
        conn = sqlite3.connect(DB_PATH, timeout=30.0)
        cursor = conn.cursor()

        # Execute in WAL friendly transaction
        cursor.execute("PRAGMA busy_timeout = 30000")

        # 1. Delete AI analysis entries where extraction failed
        cursor.execute("""
            DELETE FROM cached_ai_analysis
            WHERE ai_json LIKE '%"extractionConfidence": 0.0%'
            OR ai_json LIKE '%could not be analyzed%'
            OR ai_json LIKE '%unavailable%'
        """)
        deleted_ai = cursor.rowcount

        # 2. Delete cached order markdown entries that are just error messages
        cursor.execute("""
            DELETE FROM cached_orders
            WHERE markdown LIKE '*This court order%'
            OR markdown LIKE '*This court document%'
            OR markdown LIKE '%could not be retrieved%'
            OR markdown LIKE '%empty or could not be downloaded%'
        """)
        deleted_md = cursor.rowcount

        # 3. Delete demo cases
        cursor.execute("""
            DELETE FROM cached_cases
            WHERE case_title LIKE '%Apex Infrastructure%'
            OR response_json LIKE '%Apex Infrastructure%'
        """)
        deleted_cases = cursor.rowcount

        conn.commit()
        conn.close()
        print(f"[OK] Cleared {deleted_ai} bad AI rows, {deleted_md} bad Order rows, and {deleted_cases} demo cases from suits.db.")

    # 4. Flush Redis if available
    try:
        r = aioredis.from_url("redis://localhost:6379/0", decode_responses=True)
        await r.flushdb()
        await r.aclose()
        print("[OK] Flushed Redis cache keys successfully.")
    except Exception as e:
        print(f"[INFO] Redis flush skipped or unavailable: {e}")

    print("\n[READY] All search, case, order AI summary, and chatbot queries will fetch real live Indian Kanoon records.")


if __name__ == "__main__":
    asyncio.run(clear())
