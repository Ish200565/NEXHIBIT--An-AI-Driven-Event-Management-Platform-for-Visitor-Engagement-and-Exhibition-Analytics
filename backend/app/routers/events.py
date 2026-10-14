from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas import EventBatch
from ..security import require_key
from ..services.dwell import process_batch
from ..services.live_state import live
from ..services.notify import send_email_notification

router = APIRouter(tags=["worker"], dependencies=[Depends(require_key)])

MAX_FRAME_BYTES = 2_000_000


@router.post("/events")
def post_events(batch: EventBatch, background: BackgroundTasks, db: Session = Depends(get_db)):
    """CV worker -> backend. One batch roughly every second of stream time."""
    result = process_batch(db, batch)
    for notif_id in result.pop("email_job_ids"):
        background.add_task(send_email_notification, notif_id)
    return result


@router.post("/frame")
async def post_frame(request: Request):
    """CV worker -> backend. Raw JPEG bytes of the latest annotated frame."""
    data = await request.body()
    if not data:
        raise HTTPException(400, "Empty body")
    if len(data) > MAX_FRAME_BYTES:
        raise HTTPException(413, "Frame too large; downscale/compress before posting")
    live.set_frame(data)
    return {"ok": True, "bytes": len(data)}
