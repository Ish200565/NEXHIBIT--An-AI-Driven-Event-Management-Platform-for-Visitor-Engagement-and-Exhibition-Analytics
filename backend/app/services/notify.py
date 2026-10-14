import smtplib
from email.message import EmailMessage

from sqlalchemy import select

from ..config import settings
from ..database import SessionLocal
from ..models import Notification, Registration, Stall, Visitor


def smtp_enabled() -> bool:
    return bool(settings.smtp_host and settings.smtp_from)


def build_message(stall: Stall) -> str:
    return f"Thanks for visiting {stall.name}! Tap to download our catalogue."


def send_email_notification(notification_id: int) -> None:
    """Runs as a background task with its own DB session so ingestion never waits on SMTP."""
    db = SessionLocal()
    try:
        notif = db.get(Notification, notification_id)
        if notif is None:
            return
        row = db.execute(
            select(Registration.email, Registration.name)
            .join(Visitor, Visitor.registration_id == Registration.registration_id)
            .where(Visitor.visitor_id == notif.visitor_id)
        ).first()
        if row is None:
            notif.status = "failed"
            db.commit()
            return
        email, name = row
        msg = EmailMessage()
        msg["Subject"] = "Thanks for visiting our stall"
        msg["From"] = settings.smtp_from
        msg["To"] = email
        msg.set_content(f"Hi {name},\n\n{notif.message}\n\n- NExhibit")
        try:
            with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as smtp:
                smtp.starttls()
                if settings.smtp_user:
                    smtp.login(settings.smtp_user, settings.smtp_password)
                smtp.send_message(msg)
            notif.status = "sent"
        except Exception as exc:  # demo: record the failure, never crash ingestion
            print(f"[notify] email failed for {notif.visitor_id}: {exc}")
            notif.status = "failed"
        db.commit()
    finally:
        db.close()
