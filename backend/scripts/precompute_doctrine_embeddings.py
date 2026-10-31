"""Precompute InLegalBERT doctrine embeddings and save to disk."""

import os
import sys
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.data.criminal_statutes_concordance import CRIMINAL_CONCORDANCE_DATA
from app.services.inlegal_bert_service import inlegal_bert_service

output_path = Path(__file__).parent.parent / "app" / "data" / "doctrine_embeddings.npz"

print(f"Precomputing embeddings for {len(CRIMINAL_CONCORDANCE_DATA)} provisions...")

cids = []
vectors = []

for item in CRIMINAL_CONCORDANCE_DATA:
    cid = item["id"]
    text = f"{item['concept_doctrine']} {item['doctrine_summary']}"
    vec = inlegal_bert_service.embed_text(text)
    cids.append(cid)
    vectors.append(vec)

np.savez_compressed(output_path, cids=np.array(cids), vectors=np.array(vectors, dtype=np.float32))
print(f"Saved precomputed doctrine embeddings to {output_path} (shape: {np.array(vectors).shape})")
