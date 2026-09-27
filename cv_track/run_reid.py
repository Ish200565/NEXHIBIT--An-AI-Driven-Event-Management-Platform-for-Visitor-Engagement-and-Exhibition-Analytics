import os
import tempfile
import torch

from ultralytics import YOLO

from reid import ReIDExtractor
from cropping import crop_person, is_good_crop, keep_best_crop
from matching import find_best_match


# ============================================================
# CONFIGURATION
# ============================================================

MODEL_PATH = "yolov8s.pt"
VIDEO_PATH = "videos/exhibition3.mp4"
TRACKER_PATH = "trackers/my_bytetrack.yaml"

REFERENCE_DIR = "capture/crops_best"

# Names corresponding to the reference folders
PERSON_NAMES = {
    "person1": "Ishika",
    "person2": "Trusha",
    "person3": "Yug",
}

CONFIDENCE = 0.3
IOU = 0.5

# We are focusing on identifying the 3 known visitors for now.
THRESHOLD = 0.40

MAX_CROPS = 5


# ============================================================
# BUILD REFERENCE EMBEDDINGS
# ============================================================

def build_reference_embeddings(reid):
    reference_embeddings = {}

    for person_id in PERSON_NAMES:
        folder = os.path.join(REFERENCE_DIR, person_id)

        images = [
            os.path.join(folder, f)
            for f in os.listdir(folder)
            if f.lower().endswith((".jpg", ".jpeg", ".png"))
        ]

        if not images:
            print(f"[WARNING] No reference images found for {person_id}")
            continue

        reference_embeddings[person_id] = reid.get_embedding(images)

    return reference_embeddings


# ============================================================
# SAVE TEMPORARY CROPS
# ============================================================

def save_temporary_crops(best_crops, temp_dir):
    track_paths = {}

    for track_id, crops in best_crops.items():

        track_dir = os.path.join(
            temp_dir,
            f"track_{track_id}"
        )

        os.makedirs(track_dir, exist_ok=True)

        image_paths = []

        for i, (_, crop) in enumerate(crops):

            path = os.path.join(
                track_dir,
                f"crop_{i + 1}.jpg"
            )

            import cv2
            cv2.imwrite(path, crop)

            image_paths.append(path)

        track_paths[track_id] = image_paths

    return track_paths


# ============================================================
# MAIN
# ============================================================

def main():

    print()
    print("=" * 50)
    print("       NEXHIBIT - VISITOR RE-ID")
    print("=" * 50)
    print()

    # --------------------------------------------------------
    # Load Re-ID model
    # --------------------------------------------------------

    print("[INFO] Loading Re-ID model...")

    reid = ReIDExtractor()

    # --------------------------------------------------------
    # Build reference embeddings
    # --------------------------------------------------------

    print("[INFO] Building reference embeddings...")

    reference_embeddings = build_reference_embeddings(reid)

    print(
        f"[INFO] Loaded {len(reference_embeddings)} "
        f"reference visitors."
    )

    print()

    # --------------------------------------------------------
    # Load YOLO
    # --------------------------------------------------------

    print("[INFO] Starting YOLO + ByteTrack...")

    model = YOLO(MODEL_PATH)

    # --------------------------------------------------------
    # Store best crops for every ByteTrack ID
    # --------------------------------------------------------

    best_crops = {}

    # --------------------------------------------------------
    # Process video
    # --------------------------------------------------------

    results = model.track(
        source=VIDEO_PATH,
        classes=[0],
        tracker=TRACKER_PATH,
        persist=True,
        conf=CONFIDENCE,
        iou=IOU,
        stream=True,
        verbose=False
    )

    for result in results:

        if result.boxes is None:
            continue

        if result.boxes.id is None:
            continue

        boxes = result.boxes.xyxy.cpu().numpy()
        track_ids = result.boxes.id.cpu().numpy().astype(int)

        for bbox, track_id in zip(boxes, track_ids):

            crop = crop_person(
                result.orig_img,
                bbox
            )

            if not is_good_crop(crop):
                continue

            keep_best_crop(
                best_crops,
                track_id,
                crop,
                max_crops=MAX_CROPS
            )

    print()
    print("[INFO] Video processing complete.")
    print(
        f"[INFO] ByteTrack produced "
        f"{len(best_crops)} track IDs."
    )
    print()

    # --------------------------------------------------------
    # Create temporary crop folders
    # --------------------------------------------------------

    with tempfile.TemporaryDirectory() as temp_dir:

        track_paths = save_temporary_crops(
            best_crops,
            temp_dir
        )

        detected_people = {}

        # ----------------------------------------------------
        # Re-ID every track
        # ----------------------------------------------------

        for track_id, image_paths in track_paths.items():

            if len(image_paths) == 0:
                continue

            query_embedding = reid.get_embedding(
                image_paths
            )

            person_id, score = find_best_match(
                query_embedding,
                reference_embeddings,
                threshold=THRESHOLD
            )

            # ------------------------------------------------
            # Store only the best evidence for each person
            # ------------------------------------------------

            if person_id != "UNKNOWN":

                if (
                    person_id not in detected_people
                    or score > detected_people[person_id]["score"]
                ):
                    detected_people[person_id] = {
                        "track_id": track_id,
                        "score": score
                    }

    # ========================================================
    # FINAL RESULT
    # ========================================================

    print()
    print("=" * 50)
    print("          FINAL VISITOR SUMMARY")
    print("=" * 50)
    print()

    for person_id, name in PERSON_NAMES.items():

        if person_id in detected_people:

            track_id = detected_people[person_id]["track_id"]
            score = detected_people[person_id]["score"]

            print(f"[✓] {name} PRESENT")
            print(f"    Track ID : {track_id}")
            print(f"    Similarity: {score:.4f}")
            print()

        else:

            print(f"[ ] {name} NOT DETECTED")
            print()

    print("-" * 50)

    present_count = len(detected_people)

    print(
        f"Known Visitors Detected: "
        f"{present_count}/{len(PERSON_NAMES)}"
    )

    print("-" * 50)
    print()


if __name__ == "__main__":
    main()