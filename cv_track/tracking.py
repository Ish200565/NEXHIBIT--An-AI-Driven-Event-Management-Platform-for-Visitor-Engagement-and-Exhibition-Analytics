from ultralytics import YOLO


MODEL_PATH = "yolov8n.pt"
VIDEO_PATH = "videos/exhibition1.mp4"
OUTPUT_PATH = "tracking"


def track_people():
    model = YOLO(MODEL_PATH)

    results = model.track(
        source=VIDEO_PATH,
        classes=[0],                 # 0 = person
        tracker="bytetrack.yaml",
        persist=True,
        conf=0.5,
        save=True,
        project="runs",
        name="tracking",
    )

    return results


if __name__ == "__main__":
    track_people()