import httpx

test_queries = ['ipc section 57', '438', '302', 'anticipatory bail', 'randomxyz', '']
for q in test_queries:
    r = httpx.get('http://localhost:8000/api/statutes/era-transition/lookup', params={'query': q}, timeout=30.0)
    d = r.json().get('data', {})
    pairs = d.get('pairs', [])
    print(f'Query: "{q}" -> {len(pairs)} matches (status {r.status_code})')
    for p in pairs[:2]:
        print(f'   {p["old_code"]} {p["old_section"]} -> {p["new_code"]} {p["new_section"]}: {p["concept_doctrine"]}')
