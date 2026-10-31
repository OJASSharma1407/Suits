"""Migrate all data from local SQLite (suits.db) to PostgreSQL with strict schema & type alignment."""

import os
import sqlite3
import psycopg2
import json

SQLITE_PATH = os.environ.get("SQLITE_PATH", "suits.db")
raw_url = os.environ.get("DATABASE_URL", "postgresql://suits:suits@localhost:5432/suits")
PG_DSN = raw_url.replace("+asyncpg", "").replace("+psycopg2", "")


def migrate():
    print("Connecting to SQLite...")
    s_conn = sqlite3.connect(SQLITE_PATH)
    s_conn.row_factory = sqlite3.Row
    s_cur = s_conn.cursor()

    print("Connecting to PostgreSQL...")
    p_conn = psycopg2.connect(PG_DSN)
    p_cur = p_conn.cursor()

    # Tables in dependency order (foreign keys respected)
    tables = [
        "users",
        "email_verifications",
        "cached_cases",
        "cached_orders",
        "cached_ai_analysis",
        "cached_headnotes",
        "cached_era_analyses",
        "user_documents",
        "document_chunks",
        "saved_files",
        "bookmarks",
        "search_history",
        "case_view_history",
        "conversations",
        "messages",
        "refresh_logs",
        "api_usage_logs",
    ]

    for table in tables:
        try:
            # 1. Fetch valid column metadata from PostgreSQL
            p_cur.execute(
                """
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = %s
                """,
                (table,),
            )
            pg_col_map = {row[0]: row[1] for row in p_cur.fetchall()}
            if not pg_col_map:
                print(f"Table {table}: Not found in PostgreSQL (skipped)")
                continue

            # 2. Fetch SQLite rows
            if table == "cached_orders":
                s_cur.execute("SELECT * FROM cached_orders WHERE cnr IN (SELECT cnr FROM cached_cases)")
            elif table == "cached_headnotes":
                s_cur.execute("SELECT * FROM cached_headnotes WHERE order_id IN (SELECT id FROM cached_orders) AND cnr IN (SELECT cnr FROM cached_cases)")
            else:
                s_cur.execute(f"SELECT * FROM {table}")
            rows = s_cur.fetchall()
            if not rows:
                print(f"Table {table}: 0 rows (skipped)")
                continue

            sqlite_cols = [col[0] for col in s_cur.description]
            # Common columns only
            valid_cols = [c for c in sqlite_cols if c in pg_col_map]

            col_names = ", ".join(valid_cols)
            placeholders = ", ".join(["%s"] * len(valid_cols))
            insert_query = f"INSERT INTO {table} ({col_names}) VALUES ({placeholders}) ON CONFLICT DO NOTHING"

            batch = []
            for r in rows:
                row_vals = []
                for c in valid_cols:
                    val = r[c]
                    col_type = pg_col_map[c]

                    # Convert boolean
                    if col_type == "boolean":
                        if val is not None:
                            val = bool(val)
                    # Convert json/jsonb if needed
                    elif col_type in ("json", "jsonb") and isinstance(val, str):
                        try:
                            # Verify valid JSON
                            json.loads(val)
                        except Exception:
                            val = json.dumps(val)

                    row_vals.append(val)
                batch.append(row_vals)

            print(f"Migrating {table} ({len(rows)} rows, {len(valid_cols)} cols)...")
            p_cur.executemany(insert_query, batch)
            p_conn.commit()
            print(f"  -> Successfully migrated {len(rows)} rows into {table}")

        except Exception as e:
            p_conn.rollback()
            print(f"  Error migrating {table}: {e}")

    s_conn.close()
    p_conn.close()
    print("Done migration!")


if __name__ == "__main__":
    migrate()
