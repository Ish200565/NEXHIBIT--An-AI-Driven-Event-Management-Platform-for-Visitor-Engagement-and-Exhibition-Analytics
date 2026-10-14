"""End-to-end API tests. Runs on SQLite by default; set DATABASE_URL to a Postgres URL to
run the same tests against Postgres:   DATABASE_URL=postgresql://... pytest -q
"""
import os
import sys

os.environ.setdefault("DATABASE_URL", "sqlite:///./test_nexhibit.db")
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.main import app
from app.services.live_state import live as live_state
from seed import seed

W, H = 1280, 720
IN_A = (0.2 * W, 0.7 * H)     # inside Stall A rectangle
IN_B = (0.5 * W, 0.7 * H)     # inside Stall B
OUTSIDE = (0.5 * W, 0.1 * H)  # top of frame, in no stall


@pytest.fixture()
def client():
    seed(reset=True)
    live_state.reset()
    with TestClient(app) as c:
        yield c


def batch(ts, *people):
    return {"camera_id": "cam1", "ts": ts, "frame_w": W, "frame_h": H, "people": list(people)}


def person(track, vid, pos, score=0.8):
    return {"track_id": track, "visitor_id": vid, "score": score, "x": pos[0], "y": pos[1]}


def test_health(client):
    assert client.get("/api/health").json()["status"] == "ok"


def test_register_and_checkin_are_idempotent(client):
    reg = client.post("/api/register", json={"name": "Test", "email": "t@x.com"}).json()
    rid = reg["registration_id"]
    first = client.post("/api/checkin", json={"registration_id": rid}).json()
    again = client.post("/api/checkin", json={"registration_id": rid}).json()
    assert first["visitor_id"] == "V1004" and first["already_checked_in"] is False
    assert again["visitor_id"] == "V1004" and again["already_checked_in"] is True
    assert client.post("/api/checkin", json={"registration_id": "nope"}).status_code == 404


def test_dwell_triggers_engagement_and_notification_once(client):
    engaged_at = None
    for t in range(0, 15):
        res = client.post("/api/events", json=batch(t, person(1, "V1001", IN_A))).json()
        if res["engaged"] and engaged_at is None:
            engaged_at = t
        if engaged_at is not None and t > engaged_at:
            assert res["engaged"] == []          # fires exactly once
    assert engaged_at == 10                       # threshold 10s, 1s cadence

    feed = client.get("/api/activity").json()
    assert len(feed) == 1 and feed[0]["visitor_id"] == "V1001" and feed[0]["stall_id"] == "A"
    assert "name" not in feed[0]                  # organiser view stays anonymous

    mine = client.get("/api/notifications/V1001").json()
    assert len(mine) == 1 and "Stall A" in mine[0]["message"]

    leads = client.get("/api/stalls/A/leads").json()
    assert leads[0]["name"] == "Ishika"           # details only in the exhibitor view

    stats = {s["stall_id"]: s for s in client.get("/api/stalls/stats").json()}
    assert stats["A"]["engaged"] == 1 and stats["A"]["unique_visitors"] == 1


def test_short_pass_and_gaps_do_not_engage(client):
    client.post("/api/events", json=batch(0, person(1, "V1002", IN_B)))
    client.post("/api/events", json=batch(1, person(1, "V1002", IN_B)))
    client.post("/api/events", json=batch(30, person(1, "V1002", IN_B)))   # gap > grace
    client.post("/api/events", json=batch(31, person(1, "V1002", IN_B)))
    assert client.get("/api/activity").json() == []
    stats = {s["stall_id"]: s for s in client.get("/api/stalls/stats").json()}
    assert stats["B"]["avg_dwell_s"] == 2.0       # 1s + 1s, the 29s gap is not counted


def test_unknown_and_invalid_ids_do_not_crash(client):
    res = client.post("/api/events", json=batch(
        0, person(1, None, IN_A, 0.5), person(2, "V9999", IN_A))).json()
    assert res["accepted"] == 2 and res["rejected_visitor_ids"] == ["V9999"]
    live = client.get("/api/live").json()
    assert live["counters"]["inside_hall"] == 2 and live["counters"]["unknown"] == 2
    assert client.get("/api/activity").json() == []


def test_duplicate_tracks_for_one_visitor_count_time_once(client):
    for t in range(0, 6):
        client.post("/api/events", json=batch(
            t, person(1, "V1001", IN_A, 0.8), person(9, "V1001", IN_A, 0.7)))
    stats = {s["stall_id"]: s for s in client.get("/api/stalls/stats").json()}
    assert stats["A"]["avg_dwell_s"] == 5.0


def test_live_and_heatmap(client):
    client.post("/api/events", json=batch(
        0, person(1, "V1001", IN_A), person(2, None, OUTSIDE, 0.4)))
    live = client.get("/api/live").json()
    assert live["stale"] is False
    stalls = {s["stall_id"]: s["current"] for s in live["stalls"]}
    assert stalls["A"] == 1 and live["counters"]["identified"] == 1

    hm = client.get("/api/heatmap").json()
    assert hm["rows"] == 9 and hm["cols"] == 16
    assert hm["total_points"] == 2 and hm["max"] == 1
    assert sum(sum(r) for r in hm["cells"]) == 2
    # the outside point is in the top rows, stall A point in the lower half
    assert sum(hm["cells"][0]) + sum(hm["cells"][1]) == 1


def test_frame_roundtrip(client):
    assert client.get("/api/frame.jpg").status_code == 404
    jpg = b"\xff\xd8\xff\xe0fakejpegbytes\xff\xd9"
    assert client.post("/api/frame", content=jpg, headers={"Content-Type": "image/jpeg"}).json()["ok"]
    got = client.get("/api/frame.jpg")
    assert got.status_code == 200 and got.content == jpg


def test_zone_update_validation(client):
    ok = client.put("/api/stalls/A/zone", json={"zone": [[0, 0], [1, 0], [1, 1]]})
    assert ok.status_code == 200
    assert client.put("/api/stalls/A/zone", json={"zone": [[0, 0], [2, 0], [1, 1]]}).status_code == 422
    assert client.put("/api/stalls/Z/zone", json={"zone": [[0, 0], [1, 0], [1, 1]]}).status_code == 404


def test_reset_clears_run_data(client):
    for t in range(12):
        client.post("/api/events", json=batch(t, person(1, "V1001", IN_A)))
    assert client.get("/api/activity").json()
    client.post("/api/admin/reset")
    assert client.get("/api/activity").json() == []
    assert client.get("/api/heatmap").json()["total_points"] == 0
    assert client.get("/api/live").json()["stale"] is True


def test_api_key_enforced_when_configured(client, monkeypatch):
    monkeypatch.setattr(settings, "api_key", "secret")
    body = batch(0, person(1, "V1001", IN_A))
    assert client.post("/api/events", json=body).status_code == 401
    assert client.post("/api/events", json=body, headers={"X-API-Key": "secret"}).status_code == 200
    assert client.get("/api/live").status_code == 200   # dashboard reads stay open
