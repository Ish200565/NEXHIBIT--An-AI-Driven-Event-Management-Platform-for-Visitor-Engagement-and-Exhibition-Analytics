#This code is only used for a single video containing multiple persons if there are separate videos then use the commented code after this code 
import torchreid
import torch
import os

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
    people = ["crops_best/person1", "crops_best/person2", "crops_best/person3"]
    embeddings = {p: get_embedding(p) for p in people}

    for p, emb in embeddings.items():
        print(f"{p}: shape={emb.shape}, norm={emb.norm():.4f}")

    keys = list(embeddings.keys())
    for i in range(len(keys)):
        for j in range(i + 1, len(keys)):
            sim = torch.dot(embeddings[keys[i]], embeddings[keys[j]])
            print(f"Similarity {keys[i]} vs {keys[j]}: {sim.item():.4f}")

# quick same-person sanity check
img_paths = [os.path.join("crops_best/person1", f) for f in os.listdir("crops_best/person1")]
feats = extractor(img_paths)  # 5 individual embeddings, not averaged
feats = torch.nn.functional.normalize(feats, p=2, dim=1)

sim = torch.dot(feats[0], feats[1])
print(f"Same-person (2 different frames): {sim.item():.4f}")











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