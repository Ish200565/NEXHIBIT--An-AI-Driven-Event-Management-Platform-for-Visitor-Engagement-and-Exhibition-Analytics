import sys, os
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(SCRIPT_DIR)

from embedding.embedding import extractor, get_embedding
from matching.match import find_best_match

unknown_crop_dir = os.path.join(SCRIPT_DIR, "capture", "crops_best", "person4")
unknown_embedding = get_embedding(unknown_crop_dir)

visitor_id, score = find_best_match(unknown_embedding)
print(f"Best match: {visitor_id}, confidence: {score:.4f}")