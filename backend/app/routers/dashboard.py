import asyncio
import time
from collections import Counter

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import Response, StreamingResponse
from sqlalchemy import case, distinct, func, select
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..models import DwellSession, Notification, Presence, Registration, Stall, Visitor
from ..schemas import ZoneIn
from ..security import require_key
from ..services.live_state import live

router = APIRouter(tags=["dashboard"])

STALE_AFTER_S = 5.0


@router.get("/live")
def get_live(db: Session = Depends(get_db)):
    """Right-now view for the organiser: IDs only, never names."""
    people, ts, camera_id, updated_at = live.snapshot()
    occupancy = Counter(p["stall_id"] for p in people if p["stall_id"])
    identified = sum(1 for p in people if p["visitor_id"])
    stalls = db.scalars(select(Stall).order_by(Stall.stall_id)).all()
    return {
        "stale": (time.time() - updated_at) > STALE_AFTER_S if updated_at else True,
        "stream_ts": ts,
        "camera_id": camera_id,
        "counters": {
            "inside_hall": len(people),
            "identified": identified,
            "unknown": len(people) - identified,
            "unique_visitors_seen": db.scalar(select(func.count(distinct(Presence.visitor_id)))) or 0,
            "engaged_total": db.scalar(
                select(func.count()).select_from(DwellSession).where(DwellSession.engaged.is_(True))) or 0,
        },
        "stalls": [{"stall_id": s.stall_id, "name": s.name, "current": occupancy.get(s.stall_id, 0)}
                   for s in stalls],
        "people": people,
    }


@router.get("/heatmap")
def get_heatmap(window_s: float = 0, rows: int = 0, cols: int = 0, db: Session = Depends(get_db)):
    """Grid of foot-point counts (row 0 = top of frame). window_s=0 means whole run.
    Binned in Python on purpose: portable across Postgres/SQLite, fine at demo scale."""
    rows = rows or settings.heatmap_rows
    cols = cols or settings.heatmap_cols
    q = select(Presence.nx, Presence.ny)
    if window_s > 0:
        max_ts = db.scalar(select(func.max(Presence.ts)))
        if max_ts is not None:
            q = q.where(Presence.ts >= max_ts - window_s)
    cells = [[0] * cols for _ in range(rows)]
    total = 0
    for nx, ny in db.execute(q):
        cells[min(int(ny * rows), rows - 1)][min(int(nx * cols), cols - 1)] += 1
        total += 1
    peak = max((max(r) for r in cells), default=0)
    return {
        "rows": rows, "cols": cols, "total_points": total, "max": peak, "cells": cells,
        "normalized": [[round(v / peak, 3) if peak else 0 for v in r] for r in cells],
    }


@router.get("/stalls")
def list_stalls(db: Session = Depends(get_db)):
    return [{"stall_id": s.stall_id, "name": s.name, "exhibitor": s.exhibitor, "zone": s.zone}
            for s in db.scalars(select(Stall).order_by(Stall.stall_id))]


@router.put("/stalls/{stall_id}/zone", dependencies=[Depends(require_key)])
def set_zone(stall_id: str, body: ZoneIn, db: Session = Depends(get_db)):
    stall = db.get(Stall, stall_id)
    if stall is None:
        raise HTTPException(404, "Unknown stall")
    pts = body.zone
    if len(pts) < 3 or any(len(p) != 2 or not (0 <= p[0] <= 1 and 0 <= p[1] <= 1) for p in pts):
        raise HTTPException(422, "zone needs >= 3 [x, y] points, each between 0 and 1")
    stall.zone = pts
    db.commit()
    return {"stall_id": stall_id, "zone": pts}


@router.get("/stalls/stats")
def stall_stats(db: Session = Depends(get_db)):
    people, *_ = live.snapshot()
    occupancy = Counter(p["stall_id"] for p in people if p["stall_id"])
    agg = {
        sid: (n, avg, eng) for sid, n, avg, eng in db.execute(
            select(DwellSession.stall_id, func.count(), func.avg(DwellSession.total_seconds),
                   func.sum(case((DwellSession.engaged.is_(True), 1), else_=0)))
            .group_by(DwellSession.stall_id))
    }
    out = []
    for s in db.scalars(select(Stall).order_by(Stall.stall_id)):
        n, avg, eng = agg.get(s.stall_id, (0, 0, 0))
        out.append({
            "stall_id": s.stall_id, "name": s.name, "exhibitor": s.exhibitor,
            "unique_visitors": n, "engaged": int(eng or 0),
            "avg_dwell_s": round(float(avg or 0), 1), "current": occupancy.get(s.stall_id, 0),
        })
    return out


@router.get("/stalls/{stall_id}/leads")
def stall_leads(stall_id: str, db: Session = Depends(get_db)):
    """Exhibitor view: engaged visitors WITH details. Add a consent flag before real use."""
    if db.get(Stall, stall_id) is None:
        raise HTTPException(404, "Unknown stall")
    rows = db.execute(
        select(DwellSession, Registration)
        .join(Visitor, Visitor.visitor_id == DwellSession.visitor_id)
        .join(Registration, Registration.registration_id == Visitor.registration_id)
        .where(DwellSession.stall_id == stall_id, DwellSession.engaged.is_(True))
        .order_by(DwellSession.total_seconds.desc())
    ).all()
    return [{"visitor_id": d.visitor_id, "name": r.name, "email": r.email, "company": r.company,
             "dwell_s": round(d.total_seconds, 1), "engaged_at_ts": d.engaged_at_ts}
            for d, r in rows]


@router.get("/activity")
def activity(limit: int = 20, db: Session = Depends(get_db)):
    """Organiser feed of engagement alerts: visitor IDs only."""
    rows = db.execute(
        select(Notification, Stall.name)
        .join(Stall, Stall.stall_id == Notification.stall_id)
        .where(Notification.channel == "in_app")
        .order_by(Notification.id.desc()).limit(min(limit, 100))
    ).all()
    return [{"id": n.id, "visitor_id": n.visitor_id, "stall_id": n.stall_id, "stall": name,
             "dwell_s": n.dwell_s, "message": n.message, "created_at": n.created_at}
            for n, name in rows]


@router.get("/frame.jpg")
def latest_frame():
    if live.frame is None:
        raise HTTPException(404, "No frame received yet")
    return Response(content=live.frame, media_type="image/jpeg", headers={"Cache-Control": "no-store"})


@router.get("/stream")
async def stream(request: Request):
    """MJPEG stream of the worker's annotated frames: <img src=".../api/stream">."""
    async def gen():
        last = None
        while True:
            if await request.is_disconnected():
                break
            frame = live.frame
            if frame is not None and frame is not last:
                last = frame
                yield (b"--frame\r\nContent-Type: image/jpeg\r\nContent-Length: "
                       + str(len(frame)).encode() + b"\r\n\r\n" + frame + b"\r\n")
            await asyncio.sleep(0.05)

    return StreamingResponse(gen(), media_type="multipart/x-mixed-replace; boundary=frame")
