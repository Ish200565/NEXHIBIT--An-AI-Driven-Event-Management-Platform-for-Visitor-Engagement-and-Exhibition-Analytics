"""In-memory 'right now' state. The database holds history; this holds the latest snapshot."""
import time
from threading import Lock
from typing import Optional


class LiveState:
    def __init__(self):
        self.lock = Lock()
        self._clear()

    def _clear(self):
        self.people: list = []
        self.ts: Optional[float] = None
        self.camera_id: Optional[str] = None
        self.updated_at: float = 0.0
        self.frame: Optional[bytes] = None
        self.frame_at: float = 0.0

    def reset(self):
        with self.lock:
            self._clear()

    def set_people(self, people, ts, camera_id):
        with self.lock:
            self.people, self.ts, self.camera_id, self.updated_at = people, ts, camera_id, time.time()

    def set_frame(self, data: bytes):
        with self.lock:
            self.frame, self.frame_at = data, time.time()

    def snapshot(self):
        with self.lock:
            return list(self.people), self.ts, self.camera_id, self.updated_at


live = LiveState()
