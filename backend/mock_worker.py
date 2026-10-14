"""Pretends to be the CV worker so the dashboard can be built and demoed WITHOUT running YOLO.

    pip install requests opencv-python
    python mock_worker.py                 # real-time pace, loops until Ctrl+C
    python mock_worker.py --fast          # no sleeping (quick backend check)

Scenario (60 s loop): V1001 settles in Stall A (engages), V1003 settles in Stall C (engages),
V1002 only passes by Stall B (does NOT engage), plus one unidentified person wandering.
"""
import sys
import time

from client.nexhibit_client import NexhibitClient

W, H = 1280, 720
FAST = "--fast" in sys.argv
api = NexhibitClient("http://localhost:8000")

# (visitor_id, [(t, x_px, y_px) waypoints]); None = unidentified
SCRIPT = [
    # walks in, settles in Stall A for the rest of the loop -> engages at ~10s
    ("V1001", [(0, 150, 150), (6, 280, 560), (60, 290, 580)]),
    # strolls past Stall B in a few seconds -> must NOT engage (the "passer-by")
    ("V1002", [(0, 640, 120), (20, 640, 200), (23, 640, 450), (26, 640, 480), (29, 700, 150), (60, 700, 120)]),
    # walks in, settles in Stall C -> engages
    ("V1003", [(0, 1000, 150), (6, 1000, 560), (60, 1020, 610)]),
    # unidentified visitor wandering the hall
    (None,    [(0, 640, 150), (30, 400, 650), (60, 900, 420)]),
]
DURATION = 60


def pos(waypoints, t):
    for (t0, x0, y0), (t1, x1, y1) in zip(waypoints, waypoints[1:]):
        if t0 <= t <= t1:
            k = (t - t0) / (t1 - t0)
            return x0 + k * (x1 - x0), y0 + k * (y1 - y0)
    return waypoints[-1][1], waypoints[-1][2]


def draw(people, stalls):
    try:
        import cv2
        import numpy as np
    except ImportError:
        return None
    img = np.full((H, W, 3), 25, dtype=np.uint8)
    for s in stalls:
        pts = np.array([[int(x * W), int(y * H)] for x, y in s["zone"]], np.int32)
        cv2.polylines(img, [pts], True, (90, 160, 200), 2)
        cv2.putText(img, s["name"], (pts[0][0] + 8, pts[0][1] + 24),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (90, 160, 200), 2)
    for p in people:
        x, y = int(p["x"]), int(p["y"])
        colour = (80, 200, 120) if p["visitor_id"] else (60, 60, 220)
        cv2.rectangle(img, (x - 30, y - 120), (x + 30, y), colour, 2)
        cv2.putText(img, p["visitor_id"] or "unknown", (x - 30, y - 128),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, colour, 2)
    img = cv2.resize(img, (640, 360))
    ok, buf = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 70])
    return buf.tobytes() if ok else None


def main():
    stalls = api.get_stalls()
    print("Mock worker running. Ctrl+C to stop.")
    loop = 0
    while True:
        for t in range(DURATION):
            ts = loop * DURATION + t
            people = []
            for i, (vid, wps) in enumerate(SCRIPT):
                x, y = pos(wps, t)
                people.append({"track_id": i + 1, "visitor_id": vid,
                               "score": 0.82 if vid else 0.52, "x": x, "y": y})
            res = api.post_events("cam1", ts, W, H, people)
            jpg = draw(people, stalls)
            if jpg:
                api.post_frame(jpg)
            if res and res["engaged"]:
                print(f"t={ts}s ENGAGED: {res['engaged']}")
            if not FAST:
                time.sleep(1)
        loop += 1


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("stopped")
