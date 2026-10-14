from typing import Optional

from pydantic import BaseModel, Field


class PersonIn(BaseModel):
    track_id: int
    visitor_id: Optional[str] = None   # None / null = unidentified
    score: Optional[float] = None
    x: float                           # foot point in frame pixels (bottom-centre of the box)
    y: float


class EventBatch(BaseModel):
    camera_id: str = "cam1"
    ts: float                          # stream/video time in seconds (NOT wall-clock)
    frame_w: int = Field(gt=0)
    frame_h: int = Field(gt=0)
    people: list[PersonIn] = []


class RegisterIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: str = Field(min_length=3, max_length=160)
    phone: Optional[str] = None
    company: Optional[str] = None


class CheckinIn(BaseModel):
    registration_id: str


class ZoneIn(BaseModel):
    zone: list[list[float]]            # >= 3 points, each [x, y] in 0..1
