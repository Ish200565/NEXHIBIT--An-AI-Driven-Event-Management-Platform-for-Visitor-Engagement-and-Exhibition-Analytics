#This code is only used for a single video containing multiple persons if there are separate videos then use the commented code after this code 


import torchreid
import torch
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from storage.store import save_embedding

extractor = torchreid.utils.FeatureExtractor(
    model_name='osnet_x1_0',
    device='cpu'
)

def get_embedding(crop_dir):
    image_paths = [os.path.join(crop_dir, f) for f in os.listdir(crop_dir)]
    features = extractor(image_paths)
    avg = features.mean(dim=0)
    return torch.nn.functional.normalize(avg, p=2, dim=0)

if __name__ == "__main__":
    # Maps each test person's crop folder to a real Visitor ID
    people = {
    "V1001": "../capture/crops_best/person1",
    "V1002": "../capture/crops_best/person2",
    "V1003": "../capture/crops_best/person3",
}

    embeddings = {}
    for visitor_id, crop_dir in people.items():
        emb = get_embedding(crop_dir)
        embeddings[visitor_id] = emb
        save_embedding(visitor_id, emb)   # <-- actually persists it now
        print(f"{visitor_id}: shape={emb.shape}, norm={emb.norm():.4f}")

    # Pairwise similarity check, same as Day 5
    keys = list(embeddings.keys())
    for i in range(len(keys)):
        for j in range(i + 1, len(keys)):
            sim = torch.dot(embeddings[keys[i]], embeddings[keys[j]])
            print(f"Similarity {keys[i]} vs {keys[j]}: {sim.item():.4f}")






# import torchreid
# import torch
# import os

# extractor = torchreid.utils.FeatureExtractor(
#     model_name='osnet_x1_0',
#     device='cpu'
# )

# crop_dir = "crops_best"
# image_paths = [os.path.join(crop_dir, f) for f in os.listdir(crop_dir)]

# features = extractor(image_paths)   # shape: [5, 512]
# avg_embedding = features.mean(dim=0)  # shape: [512]
# avg_embedding = torch.nn.functional.normalize(avg_embedding, p=2, dim=0)

# print(avg_embedding.shape)
# print(avg_embedding.norm())  # should be ~1.0