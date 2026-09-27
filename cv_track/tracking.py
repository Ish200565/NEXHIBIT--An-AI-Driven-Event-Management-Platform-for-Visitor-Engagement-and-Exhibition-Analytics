from ultralytics import YOLO


MODEL_PATH = "yolov8s.pt"
VIDEO_PATH = "videos/exhibition3.mp4"


def track_people():
    model = YOLO(MODEL_PATH)

    results = model.track(
        source=VIDEO_PATH,
        classes=[0],
        tracker="trackers/my_bytetrack.yaml",
        persist=True,
        conf=0.3,
        iou=0.5,
        save=True,
        project="runs",
        name="tracking",
    )

    return results


if __name__ == "__main__":
    track_people()