from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import (JSON, Boolean, DateTime, Float, ForeignKey, Integer,
                        String, UniqueConstraint)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Registration(Base):
    """Personal details. Only the notification/lead layer ever reads this."""
    __tablename__ = "registrations"

    registration_id: Mapped[str] = mapped_column(String(20), primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(160))
    phone: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    company: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    visitor: Mapped[Optional["Visitor"]] = relationship(back_populates="registration", uselist=False)


class Visitor(Base):
    """Anonymous identity created at check-in. This is all the CV side ever sees."""
    __tablename__ = "visitors"

    visitor_id: Mapped[str] = mapped_column(String(20), primary_key=True)
    registration_id: Mapped[str] = mapped_column(
        ForeignKey("registrations.registration_id"), unique=True
    )
    checked_in_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    registration: Mapped[Registration] = relationship(back_populates="visitor")


class Stall(Base):
    __tablename__ = "stalls"

    stall_id: Mapped[str] = mapped_column(String(10), primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    exhibitor: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    # Normalised polygon [[x, y], ...] with 0..1 coordinates, so it is resolution independent.
    zone: Mapped[list] = mapped_column(JSON)


class Presence(Base):
    """One row per tracked person per event batch (identified or not)."""
    __tablename__ = "presence"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    camera_id: Mapped[str] = mapped_column(String(40))
    track_id: Mapped[int] = mapped_column(Integer)
    visitor_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("visitors.visitor_id"), nullable=True, index=True
    )
    stall_id: Mapped[Optional[str]] = mapped_column(ForeignKey("stalls.stall_id"), nullable=True)
    nx: Mapped[float] = mapped_column(Float)
    ny: Mapped[float] = mapped_column(Float)
    score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ts: Mapped[float] = mapped_column(Float, index=True)  # stream/video seconds
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class DwellSession(Base):
    __tablename__ = "dwell_sessions"
    __table_args__ = (UniqueConstraint("visitor_id", "stall_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    visitor_id: Mapped[str] = mapped_column(ForeignKey("visitors.visitor_id"), index=True)
    stall_id: Mapped[str] = mapped_column(ForeignKey("stalls.stall_id"), index=True)
    total_seconds: Mapped[float] = mapped_column(Float, default=0.0)
    first_seen_ts: Mapped[float] = mapped_column(Float)
    last_seen_ts: Mapped[float] = mapped_column(Float)
    engaged: Mapped[bool] = mapped_column(Boolean, default=False)
    engaged_at_ts: Mapped[Optional[float]] = mapped_column(Float, nullable=True)


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    visitor_id: Mapped[str] = mapped_column(ForeignKey("visitors.visitor_id"), index=True)
    stall_id: Mapped[str] = mapped_column(ForeignKey("stalls.stall_id"))
    message: Mapped[str] = mapped_column(String(300))
    channel: Mapped[str] = mapped_column(String(20))   # in_app | email
    status: Mapped[str] = mapped_column(String(20))    # sent | queued | failed
    dwell_s: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
