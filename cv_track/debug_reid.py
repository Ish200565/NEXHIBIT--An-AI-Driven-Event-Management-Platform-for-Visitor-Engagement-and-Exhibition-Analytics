import os
import torch

from reid import ReIDExtractor


REFERENCE_DIR = "capture/crops_best"

TRACK_DIR = "runs/reid_crops"


reid = ReIDExtractor()


# --------------------------------------------------
# Build reference embeddings
# --------------------------------------------------

reference_embeddings = {}

for person in ["person1", "person2", "person3"]:

    folder = os.path.join(
        REFERENCE_DIR,
        person
    )

    images = [
        os.path.join(folder, f)
        for f in os.listdir(folder)
        if f.lower().endswith((".jpg", ".jpeg", ".png"))
    ]

    reference_embeddings[person] = reid.get_embedding(images)


# --------------------------------------------------
# Test every stall track
# --------------------------------------------------

print("\nSTALL → ENTRANCE SIMILARITY")
print("=" * 50)

for track_name in sorted(os.listdir(TRACK_DIR)):

    track_path = os.path.join(
        TRACK_DIR,
        track_name
    )

    if not os.path.isdir(track_path):
        continue

    images = [
        os.path.join(track_path, f)
        for f in os.listdir(track_path)
        if f.lower().endswith(".jpg")
    ]

    if not images:
        continue

    query_embedding = reid.get_embedding(images)

    print(f"\n{track_name}")

    for person, reference_embedding in reference_embeddings.items():

        similarity = torch.dot(
            query_embedding,
            reference_embedding
        ).item()

        print(
            f"  {person}: {similarity:.4f}"
        )