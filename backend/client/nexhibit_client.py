"""Drop-in client for the CV worker (Rohit's run_reid.py). Never raises: a dead backend
must not crash the tracking loop.

    from client.nexhibit_client import NexhibitClient
    api = NexhibitClient("http://localhost:8000")

    # once per ~1s of video time:
    api.post_events("cam1", ts=frame_idx / fps, frame_w=w, frame_h=h, people=[
        {"track_id": 7, "visitor_id": "V1002" or None, "score": 0.77,
         "x": (x1 + x2) / 2, "y": y2},          # foot point = bottom-centre of the box
    ])

    # a few times per second, annotated + downscaled (~640px wide, quality 70):
    ok, buf = cv2.imencode(".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, 70])
    api.post_frame(buf.tobytes())
"""
import requests


class NexhibitClient:
    def __init__(self, base_url="http://localhost:8000", api_key="", timeout=2.0):
        self.base = base_url.rstrip("/")
        self.timeout = timeout
        self.headers = {"X-API-Key": api_key} if api_key else {}

    def post_events(self, camera_id, ts, frame_w, frame_h, people):
        try:
            r = requests.post(f"{self.base}/api/events", headers=self.headers, timeout=self.timeout,
                              json={"camera_id": camera_id, "ts": ts, "frame_w": frame_w,
                                    "frame_h": frame_h, "people": people})
            r.raise_for_status()
            return r.json()
        except Exception as exc:
            print(f"[client] post_events failed: {exc}")
            return None

    def post_frame(self, jpeg_bytes):
        try:
            r = requests.post(f"{self.base}/api/frame", data=jpeg_bytes, timeout=self.timeout,
                              headers={**self.headers, "Content-Type": "image/jpeg"})
            r.raise_for_status()
            return True
        except Exception as exc:
            print(f"[client] post_frame failed: {exc}")
            return False

    def get_stalls(self):
        """Zones (normalised polygons) so the worker can draw them on annotated frames."""
        try:
            return requests.get(f"{self.base}/api/stalls", timeout=self.timeout).json()
        except Exception as exc:
            print(f"[client] get_stalls failed: {exc}")
            return []
