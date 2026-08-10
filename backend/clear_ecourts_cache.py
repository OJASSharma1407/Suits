"""
Clear all cached eCourts data AND old bookmarks so the system starts fresh with Indian Kanoon.
Run once after switching to Kanoon:
  cd e:\Projects\Suits\backend
  python clear_ecourts_cache.py
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "suits.db")


def main():
    if not os.path.exists(DB_PATH):
        print(f"❌ Database not found at: {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    operations = [
        ("cached_cases",        "DELETE FROM cached_cases"),
        ("cached_orders",       "DELETE FROM cached_orders"),
        ("cached_ai_analysis",  "DELETE FROM cached_ai_analysis"),
        ("bookmarks",           "DELETE FROM bookmarks"),
        ("search_history",      "DELETE FROM search_history"),
    ]

    for name, sql in operations:
        try:
            cursor.execute(sql)
            print(f"✅ Cleared {cursor.rowcount:>3} rows from '{name}'")
        except sqlite3.OperationalError as e:
            print(f"⚠️  Skipped '{name}': {e}")

    conn.commit()
    conn.close()
    print(
        "\n✅ Done. All eCourts data, old bookmarks, and search history cleared.\n"
        "   Do a fresh search in the app to get real Indian Kanoon results."
    )


main()
