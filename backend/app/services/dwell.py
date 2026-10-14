from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import settings
from ..models import DwellSession, Notification, Presence, Stall, Visitor
from ..schemas import EventBatch
from .geometry import stall_for_point
from .live_state import live
from .notify import build_message, smtp_enabled


def process_batch(db: Session, batch: EventBatch) -> dict:
    """Ingest one batch from the CV worker: store presence, update dwell, fire engagements."""
    stalls = db.scalars(select(Stall)).all()
    stalls_by_id = {s.stall_id: s for s in stalls}

    claimed = {p.visitor_id for p in batch.people if p.visitor_id}
    valid = set()
    if claimed:
        valid = set(db.scalars(select(Visitor.visitor_id).where(Visitor.visitor_id.in_(claimed))))
    rejected_ids = sorted(claimed - valid)

    # 1. Normalise positions, resolve stall membership, store presence
    people = []
    for p in batch.people:
        nx = min(max(p.x / batch.frame_w, 0.0), 1.0)
        ny = min(max(p.y / batch.frame_h, 0.0), 1.0)
        vid = p.visitor_id if p.visitor_id in valid else None
        people.append({
            "track_id": p.track_id, "visitor_id": vid, "score": p.score,
            "nx": round(nx, 4), "ny": round(ny, 4),
            "stall_id": stall_for_point(nx, ny, stalls), "dwell_s": None,
        })
    db.add_all([
        Presence(camera_id=batch.camera_id, track_id=e["track_id"], visitor_id=e["visitor_id"],
                 stall_id=e["stall_id"], nx=e["nx"], ny=e["ny"], score=e["score"], ts=batch.ts)
        for e in people
    ])

    # 2. One observation per visitor per batch (ByteTrack fragments can duplicate a visitor)
    best = {}
    for e in people:
        if e["visitor_id"] and e["stall_id"]:
            cur = best.get(e["visitor_id"])
            if cur is None or (e["score"] or 0) > (cur["score"] or 0):
                best[e["visitor_id"]] = e

    # 3. Dwell accumulation + engagement trigger
    engaged_now, email_jobs = [], []
    for vid, e in best.items():
        sid = e["stall_id"]
        sess = db.scalar(select(DwellSession).where(
            DwellSession.visitor_id == vid, DwellSession.stall_id == sid))
        if sess is None:
            sess = DwellSession(visitor_id=vid, stall_id=sid, total_seconds=0.0,
                                first_seen_ts=batch.ts, last_seen_ts=batch.ts, engaged=False)
            db.add(sess)
        else:
            dt = batch.ts - sess.last_seen_ts
            if 0 < dt <= settings.dwell_grace_s:      # gaps longer than grace are not counted
                sess.total_seconds += dt
            sess.last_seen_ts = batch.ts
        e["dwell_s"] = round(sess.total_seconds, 2)

        if not sess.engaged and sess.total_seconds >= settings.dwell_threshold_s:
            sess.engaged = True
            sess.engaged_at_ts = batch.ts
            msg = build_message(stalls_by_id[sid])
            db.add(Notification(visitor_id=vid, stall_id=sid, message=msg, channel="in_app",
                                status="sent", dwell_s=round(sess.total_seconds, 2)))
            if smtp_enabled():
                email_notif = Notification(visitor_id=vid, stall_id=sid, message=msg,
                                           channel="email", status="queued",
                                           dwell_s=round(sess.total_seconds, 2))
                db.add(email_notif)
                email_jobs.append(email_notif)
            engaged_now.append({"visitor_id": vid, "stall_id": sid, "dwell_s": e["dwell_s"]})

    db.commit()
    live.set_people(people, batch.ts, batch.camera_id)
    return {
        "accepted": len(people),
        "engaged": engaged_now,
        "rejected_visitor_ids": rejected_ids,
        "email_job_ids": [n.id for n in email_jobs],
    }
