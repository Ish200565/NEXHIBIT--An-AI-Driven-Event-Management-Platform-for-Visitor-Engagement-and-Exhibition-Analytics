from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, engine
from .routers import dashboard, events, visitors


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(engine)
    print(f"[nexhibit] database: {engine.url.render_as_string(hide_password=True)}")
    yield


app = FastAPI(title="NExhibit API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(events.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(visitors.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok", "db": engine.dialect.name}
