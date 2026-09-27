from reid import ReIDExtractor


reid = ReIDExtractor()

image_paths = [
    "capture/crops_best/person1/frame_1.jpg",
    "capture/crops_best/person1/frame_47.jpg",
    "capture/crops_best/person1/frame_48.jpg",
    "capture/crops_best/person1/frame_46.jpg",
    "capture/crops_best/person1/frame_2.jpg",
]

embedding = reid.get_embedding(image_paths)

print("Embedding shape:", embedding.shape)
print("Embedding norm:", embedding.norm().item())