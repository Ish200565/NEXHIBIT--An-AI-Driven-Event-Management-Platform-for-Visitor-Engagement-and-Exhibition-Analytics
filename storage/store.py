#a local JSON file mapping Visitor ID → embedding
import json
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
STORE_PATH = os.path.join(SCRIPT_DIR, "visitor_embeddings.json")

def save_embedding(visitor_id, embedding_tensor):
    data = {}
    if os.path.exists(STORE_PATH):
        with open(STORE_PATH, "r") as f:
            data = json.load(f)

    data[visitor_id] = embedding_tensor.tolist()

    with open(STORE_PATH, "w") as f:
        json.dump(data, f)

    print(f"Saved embedding for {visitor_id}")

def load_embedding(visitor_id):
    with open(STORE_PATH, "r") as f:
        data = json.load(f)
    return data[visitor_id]

def load_all():
    if not os.path.exists(STORE_PATH):
        return {}
    with open(STORE_PATH, "r") as f:
        return json.load(f)
if __name__ == "__main__":
    import torch
    dummy_embedding = torch.rand(512)
    dummy_embedding = torch.nn.functional.normalize(dummy_embedding, p=2, dim=0)
    save_embedding("test_visitor", dummy_embedding)

    print(load_all())