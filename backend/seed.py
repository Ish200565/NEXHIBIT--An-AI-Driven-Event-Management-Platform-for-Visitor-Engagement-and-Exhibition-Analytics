"""Seed demo data: 3 registered+checked-in visitors (V1001-V1003) and 3 stalls.

    python seed.py            # add missing rows
    python seed.py --reset    # drop ALL tables and rebuild (demo hygiene)

V1001-V1003 match the keys in visitor_embeddings.json (person1/2/3 = Ishika/Trusha/Yug).
Put REAL email addresses below if you want the email notification to reach an inbox.
"""
import sys

from sqlalchemy import select

from app.database import Base, SessionLocal, engine
from app.models import Registration, Stall, Visitor

PEOPLE = [
    ("R000001", "V1001", "Ishika", "ishika@example.com", "NExhibit Team"),
    ("R000002", "V1002", "Trusha", "trusha@example.com", "NExhibit Team"),
    ("R000003", "V1003", "Yug", "yug@example.com", "NExhibit Team"),
]

# Normalised (0..1) rectangles over the camera frame. ADJUST to match exhibition3.mp4:
# PUT /api/stalls/{id}/zone updates them without touching code.
def rect(x0, y0, x1, y1):
    return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]

STALLS = [
    ("A", "Stall A", "Exhibitor A", rect(0.05, 0.40, 0.35, 0.95)),
    ("B", "Stall B", "Exhibitor B", rect(0.38, 0.40, 0.65, 0.95)),
    ("C", "Stall C", "Exhibitor C", rect(0.68, 0.40, 0.95, 0.95)),
]


def seed(reset: bool = False) -> None:
    if reset:
        Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    db = SessionLocal()
    try:
        for rid, vid, name, email, company in PEOPLE:
            if db.get(Registration, rid) is None:
                db.add(Registration(registration_id=rid, name=name, email=email, company=company))
        db.flush()
        for rid, vid, *_ in PEOPLE:
            if db.get(Visitor, vid) is None:
                db.add(Visitor(visitor_id=vid, registration_id=rid))
        for sid, name, exhibitor, zone in STALLS:
            if db.get(Stall, sid) is None:
                db.add(Stall(stall_id=sid, name=name, exhibitor=exhibitor, zone=zone))
        db.commit()
        print(f"Seeded: {db.scalar(select(Visitor.visitor_id).limit(1))} ... "
              f"{len(PEOPLE)} visitors, {len(STALLS)} stalls on {engine.url.render_as_string(hide_password=True)}")
    finally:
        db.close()


if __name__ == "__main__":
    seed(reset="--reset" in sys.argv)
