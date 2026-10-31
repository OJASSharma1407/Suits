import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from app.data.criminal_statutes_concordance import CRIMINAL_CONCORDANCE_DATA

def test_search(query: str):
    query_clean = query.strip()
    query_lower = query_clean.lower()
    
    ipc_hint = bool(re.search(r'\b(ipc|indian penal|penal code)\b', query_lower))
    crpc_hint = bool(re.search(r'\b(crpc|code of criminal procedure|criminal procedure)\b', query_lower))
    iea_hint = bool(re.search(r'\b(iea|evidence act|indian evidence)\b', query_lower))
    bns_hint = bool(re.search(r'\b(bns|bharatiya nyaya|nyaya sanhita)\b', query_lower))
    bnss_hint = bool(re.search(r'\b(bnss|bharatiya nagarik|nagarik suraksha)\b', query_lower))
    bsa_hint = bool(re.search(r'\b(bsa|bharatiya sakshya|sakshya adhiniyam)\b', query_lower))
    
    section_matches = re.findall(r'(?:section|sec|u/s|s\.)?\s*(\d+[A-Za-z]*(?:\(\d+[A-Za-z]*\))*)', query_clean, re.IGNORECASE)
    section_tokens = [s.strip().lower() for s in section_matches if s.strip()]
    base_tokens = [re.sub(r'\(\w+\)', '', t) for t in section_tokens if '(' in t]
    all_sec_tokens = list(dict.fromkeys(section_tokens + base_tokens))
    
    scored = []
    for item in CRIMINAL_CONCORDANCE_DATA:
        score = 0.0
        old_sec = item['old_section'].lower()
        new_sec = item['new_section'].lower()
        old_code = item['old_code'].upper()
        new_code = item['new_code'].upper()
        
        if all_sec_tokens:
            for tok in all_sec_tokens:
                # Exact section match
                if tok == old_sec or tok in [s.strip() for s in old_sec.split('/')]:
                    score += 100.0
                    if ipc_hint and old_code == 'IPC': score += 50.0
                    elif crpc_hint and old_code == 'CRPC': score += 50.0
                    elif iea_hint and old_code == 'IEA': score += 50.0
                    elif ipc_hint and old_code != 'IPC': score -= 40.0
                    elif crpc_hint and old_code != 'CRPC': score -= 40.0
                    elif iea_hint and old_code != 'IEA': score -= 40.0
                elif tok == new_sec or tok in [s.strip() for s in new_sec.split('/')]:
                    score += 100.0
                    if bns_hint and new_code == 'BNS': score += 50.0
                    elif bnss_hint and new_code == 'BNSS': score += 50.0
                    elif bsa_hint and new_code == 'BSA': score += 50.0
                    elif bns_hint and new_code != 'BNS': score -= 40.0
                    elif bnss_hint and new_code != 'BNSS': score -= 40.0
                    elif bsa_hint and new_code != 'BSA': score -= 40.0
                elif re.search(rf'\b{re.escape(tok)}\b', old_sec):
                    score += 60.0
                    if ipc_hint and old_code == 'IPC': score += 30.0
                    elif crpc_hint and old_code == 'CRPC': score += 30.0
                elif re.search(rf'\b{re.escape(tok)}\b', new_sec):
                    score += 60.0
                    if bns_hint and new_code == 'BNS': score += 30.0
                    elif bnss_hint and new_code == 'BNSS': score += 30.0
        else:
            if query_lower in item['concept_doctrine'].lower(): score += 40.0
            if query_lower in item['old_title'].lower() or query_lower in item['new_title'].lower(): score += 30.0
            words = [w for w in re.findall(r'[a-z]+', query_lower) if len(w) >= 3 and w not in {'and', 'the', 'for', 'with', 'law', 'act'}]
            for w in words:
                if w in item['concept_doctrine'].lower(): score += 10.0
                if w in item['doctrine_summary'].lower(): score += 5.0
                
        if score > 0:
            scored.append((item, score))
            
    scored.sort(key=lambda x: x[1], reverse=True)
    print(f'=== Query: \"{query}\" === Matches: {len(scored)}')
    for it, sc in scored[:3]:
        print(f'  [{sc}] {it["old_code"]} S. {it["old_section"]} -> {it["new_code"]} S. {it["new_section"]}: {it["concept_doctrine"]}')

test_search('ipc section 57')
test_search('crpc 57')
test_search('section 57')
test_search('57')
test_search('bns 6')
test_search('438')
test_search('302')
test_search('anticipatory bail')
test_search('dying declaration')
test_search('randomxyz999')
