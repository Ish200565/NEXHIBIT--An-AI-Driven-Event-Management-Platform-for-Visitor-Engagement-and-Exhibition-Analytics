import sys
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
sys.path.append(PROJECT_ROOT)

from embedding.embedding import extractor
from matching.match import find_best_match
import torch

# Simulate: a new frame comes in, e.g. one crop from person1's folder
crop_folder = os.path.join(PROJECT_ROOT, "capture", "crops_best", "person1")
test_image = os.path.join(crop_folder, os.listdir(crop_folder)[0])

features = extractor(test_image)
query_emb = torch.nn.functional.normalize(features[0], p=2, dim=0)

visitor_id, score = find_best_match(query_emb)
print(f"Matched: {visitor_id}, confidence: {score:.4f}")