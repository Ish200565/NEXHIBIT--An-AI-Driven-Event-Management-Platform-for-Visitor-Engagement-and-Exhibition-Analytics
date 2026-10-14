import secrets

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Notification, Registration, Stall, Visitor
from ..schemas import CheckinIn, RegisterIn
from ..security import require_key
from ..services.live_state import live

router = APIRouter(tags=["visitors"])


@router.post("/register")
def register(body: RegisterIn, db: Session = Depends(get_db)):
    """Pre-registration. The frontend renders qr_payload as a QR code."""
    reg = Registration(registration_id="R" + secrets.token_hex(3).upper(), name=body.name,
                       email=body.email, phone=body.phone, company=body.company)
    db.add(reg)
    db.commit()
    return {"registration_id": reg.registration_id, "qr_payload": reg.registration_id}


@router.post("/checkin")
def checkin(body: CheckinIn, db: Session = Depends(get_db)):
    """QR scan -> anonymous Visitor ID. Idempotent. The capture script then stores the
    embedding under the returned visitor_id."""
    reg = db.get(Registration, body.registration_id)
    if reg is None:
        raise HTTPException(404, "Unknown registration_id")
    existing = db.scalar(select(Visitor).where(Visitor.registration_id == reg.registration_id))
    if existing:
        return {"visitor_id": existing.visitor_id, "already_checked_in": True}
    last = db.scalar(select(func.max(Visitor.visitor_id)))
    visitor = Visitor(visitor_id=f"V{int(last[1:]) + 1 if last else 1001}",
                      registration_id=reg.registration_id)
    db.add(visitor)
    db.commit()
    return {"visitor_id": visitor.visitor_id, "already_checked_in": False}


@router.get("/visitors")
def list_visitors(db: Session = Depends(get_db)):
    """IDs only: the organiser view never exposes personal details."""
    return [{"visitor_id": v.visitor_id, "checked_in_at": v.checked_in_at}
            for v in db.scalars(select(Visitor).order_by(Visitor.visitor_id))]


@router.get("/notifications/{visitor_id}")
def visitor_notifications(visitor_id: str, db: Session = Depends(get_db)):
    """The visitor's own phone view."""
    if db.get(Visitor, visitor_id) is None:
        raise HTTPException(404, "Unknown visitor_id")
    rows = db.execute(
        select(Notification, Stall.name)
        .join(Stall, Stall.stall_id == Notification.stall_id)
        .where(Notification.visitor_id == visitor_id, Notification.channel == "in_app")
        .order_by(Notification.id.desc())
    ).all()
    return [{"id": n.id, "stall_id": n.stall_id, "stall": name, "message": n.message,
             "created_at": n.created_at} for n, name in rows]


@router.post("/admin/reset", dependencies=[Depends(require_key)])
def reset_demo(db: Session = Depends(get_db)):
    """Wipe run data (presence, dwell, notifications) so you can re-run the demo cleanly."""
    from ..models import DwellSession, Presence
    for model in (Notification, DwellSession, Presence):
        db.query(model).delete()
    db.commit()
    live.reset()
    return {"ok": True}
