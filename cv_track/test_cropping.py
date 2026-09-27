import cv2
from ultralytics import YOLO

from cropping import (
    crop_person,
    is_good_crop,
    keep_best_crop
)


MODEL_PATH = "yolov8s.pt"
VIDEO_PATH = "videos/exhibition3.mp4"


model = YOLO(MODEL_PATH)

cap = cv2.VideoCapture(VIDEO_PATH)

# Stores best crops for every Track ID
best_crops = {}


while cap.isOpened():

    success, frame = cap.read()

    if not success:
        break

    results = model.track(
        frame,
        classes=[0],
        tracker="trackers/my_bytetrack.yaml",
        persist=True,
        conf=0.3,
        iou=0.5,
        verbose=False
    )

    result = results[0]

    if result.boxes is not None and result.boxes.id is not None:

        boxes = result.boxes.xyxy.cpu().numpy()
        track_ids = result.boxes.id.cpu().numpy()

        for bbox, track_id in zip(boxes, track_ids):

            track_id = int(track_id)

            # Crop person
            crop = crop_person(frame, bbox)

            # Check crop quality/size
            if is_good_crop(crop):

                # Keep only the best crops
                keep_best_crop(
                    best_crops,
                    track_id,
                    crop,
                    max_crops=5
                )

            # Draw tracking box
            x1, y1, x2, y2 = map(int, bbox)

            cv2.rectangle(
                frame,
                (x1, y1),
                (x2, y2),
                (0, 255, 0),
                2
            )

            cv2.putText(
                frame,
                f"ID: {track_id}",
                (x1, y1 - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (0, 255, 0),
                2
            )

    cv2.imshow("Exhibition Tracking", frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break


cap.release()
cv2.destroyAllWindows()


# -----------------------------------
# Show results
# -----------------------------------

print("\nBEST CROPS SELECTED")
print("-------------------")

for track_id, crops in best_crops.items():

    print(f"\nTrack ID: {track_id}")

    for i, (score, crop) in enumerate(crops):

        print(
            f"  Crop {i + 1}: "
            f"Sharpness = {score:.2f}"
        )

        cv2.imshow(
            f"Track {track_id} - Best {i + 1}",
            crop
        )

cv2.waitKey(0)
cv2.destroyAllWindows()