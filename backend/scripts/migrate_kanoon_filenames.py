"""Migrate DB: fix full Kanoon URL filenames to numeric TIDs."""
import sqlite3, json, re

conn = sqlite3.connect("suits.db", timeout=30, check_same_thread=False)
conn.execute("PRAGMA busy_timeout=30000")
c = conn.cursor()

KANOON_PAT = re.compile(r'indiankanoon\.org/doc/(\d+)')

def extract_tid(s):
    m = KANOON_PAT.search(str(s))
    return m.group(1) if m else None

# 1. Fix cached_orders with full URL filenames
c.execute("SELECT id, cnr, filename FROM cached_orders WHERE filename LIKE '%indiankanoon.org%'")
rows = c.fetchall()
print(f"Found {len(rows)} cached_orders with full URL filenames")
for _id, cnr, fname in rows:
    tid = extract_tid(fname)
    if tid:
        c.execute("UPDATE cached_orders SET filename=? WHERE id=?", (tid, _id))
        print(f"  Fixed order: {fname} -> {tid}")

# 2. Fix cached_ai_analysis with full URL filenames
c.execute("SELECT id, cnr, filename FROM cached_ai_analysis WHERE filename LIKE '%indiankanoon.org%'")
rows2 = c.fetchall()
print(f"Found {len(rows2)} cached_ai_analysis with full URL filenames")
for _id, cnr, fname in rows2:
    tid = extract_tid(fname)
    if tid:
        c.execute("UPDATE cached_ai_analysis SET filename=? WHERE id=?", (tid, _id))
        print(f"  Fixed ai: {fname} -> {tid}")

# 3. Fix cached_cases where response_json has full URL as order filename
c.execute("SELECT cnr, response_json FROM cached_cases WHERE response_json LIKE '%indiankanoon.org%'")
rows3 = c.fetchall()
print(f"Found {len(rows3)} cached_cases with full Kanoon URLs in JSON")
for cnr, rjson in rows3:
    try:
        data = json.loads(rjson)
        changed = False
        for key in ("judgmentOrders", "interimOrders"):
            for order in data.get(key, []):
                if "filename" in order and "indiankanoon.org" in str(order["filename"]):
                    tid = extract_tid(str(order["filename"]))
                    if tid:
                        order["filename"] = tid
                        changed = True
        if changed:
            c.execute("UPDATE cached_cases SET response_json=? WHERE cnr=?", (json.dumps(data), cnr))
            print(f"  Fixed case JSON: {cnr}")
    except Exception as e:
        print(f"  Error on {cnr}: {e}")

conn.commit()
conn.close()
print("Done - all Kanoon URL filenames migrated to numeric TIDs!")
