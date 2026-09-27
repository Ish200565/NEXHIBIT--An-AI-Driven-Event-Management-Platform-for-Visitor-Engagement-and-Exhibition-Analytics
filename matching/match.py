import torch
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from storage.store import load_all

def find_best_match(query_embedding, threshold=0.80):
    stored = load_all()
    if not stored:
        return None, 0.0

    best_id = None
    best_score = -1.0

    for visitor_id, emb_list in stored.items():
        stored_emb = torch.tensor(emb_list)
        score = torch.dot(query_embedding, stored_emb).item()
        if score > best_score:
            best_score = score
            best_id = visitor_id

    if best_score < threshold:
        return None, best_score  # no confident match

    return best_id, best_score