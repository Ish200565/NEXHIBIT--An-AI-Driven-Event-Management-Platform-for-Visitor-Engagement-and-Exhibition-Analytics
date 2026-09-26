from reid import ReIDExtractor
from matching import find_best_match


# -------------------------
# Create Re-ID extractor
# -------------------------

reid = ReIDExtractor()


# -------------------------
# Reference images
# -------------------------

person1 = [
    "capture/crops_best/person1/frame_1.jpg",
    "capture/crops_best/person1/frame_47.jpg",
    "capture/crops_best/person1/frame_48.jpg",
    "capture/crops_best/person1/frame_46.jpg",
    "capture/crops_best/person1/frame_2.jpg",
]

person2 = [
    "capture/crops_best/person2/frame_62.jpg",
    "capture/crops_best/person2/frame_65.jpg",
    "capture/crops_best/person2/frame_68.jpg",
    "capture/crops_best/person2/frame_66.jpg",
    "capture/crops_best/person2/frame_67.jpg",
]

person3 = [
    "capture/crops_best/person3/frame_102.jpg",
    "capture/crops_best/person3/frame_103.jpg",
    "capture/crops_best/person3/frame_104.jpg",
    "capture/crops_best/person3/frame_105.jpg",
    "capture/crops_best/person3/frame_99.jpg",
]


# -------------------------
# Generate reference embeddings
# -------------------------

reference_embeddings = {
    "person1": reid.get_embedding(person1),
    "person2": reid.get_embedding(person2),
    "person3": reid.get_embedding(person3),
}


# -------------------------
# Test Person 1
# -------------------------

query_embedding = reid.get_embedding(person1)


match, score = find_best_match(
    query_embedding,
    reference_embeddings,
    threshold=0.80
)


print("\nMATCHING RESULT")
print("----------------")
print("Predicted:", match)
print("Similarity:", round(score, 4))