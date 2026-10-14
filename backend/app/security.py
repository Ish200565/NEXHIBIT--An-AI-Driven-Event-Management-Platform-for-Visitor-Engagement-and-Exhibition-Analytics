from typing import Optional

from fastapi import Header, HTTPException

from .config import settings


def require_key(x_api_key: Optional[str] = Header(default=None)):
    """No-op unless API_KEY is configured (so local dev needs no setup)."""
    if settings.api_key and x_api_key != settings.api_key:
        raise HTTPException(status_code=401, detail="Invalid or missing X-API-Key")
