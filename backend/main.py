"""
FastAPI backend for Mushroompedia plus signed-in places and observations.
Mushroompedia GETs stay API-key gated when API_KEY is set. /api/me/* uses Clerk JWT.

Security: rate limiting (per IP) and optional API key (set API_KEY in env;
frontend sends X-API-Key from VITE_API_KEY). Configure via env:
  API_KEY, RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW_SEC, BLOCK_WINDOW_SEC,
  DATABASE_URL, CLERK_ISSUER, GCS_USER_MEDIA_BUCKET, GCS_SERVICE_ACCOUNT_JSON.
"""

from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import MUSHROOM_DEFINITIONS, get_csv_path
from pedia import detail_payload, list_payload
from database import Base, engine
from routers.me import router as me_router
from security import RateLimitAndAuthMiddleware
from services.data_service import (
    load_df,
    climate_14day,
    elevation_distribution,
    season_activity,
    slope_distribution,
    aspect_distribution,
    geomorphon_distribution,
    landcover_distribution,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Mushroompedia API",
    description="Mushroom definitions, chart data, and signed-in places/observations.",
    version="1.0.0",
    default_response_class=JSONResponse,
)

app.add_middleware(RateLimitAndAuthMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(me_router)


@app.get("/")
def root():
    return {"service": "Mushroompedia API", "docs": "/docs"}


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/api/mushrooms")
def list_mushrooms():
    """List mushroompedia entries (compact: names, photos, edibility, season)."""
    return [list_payload(m) for m in MUSHROOM_DEFINITIONS]


@app.get("/api/mushrooms/{mushroom_id}")
def get_mushroom(mushroom_id: str):
    """Get one mushroompedia entry by id."""
    for m in MUSHROOM_DEFINITIONS:
        if m["id"] == mushroom_id:
            return detail_payload(m)
    raise HTTPException(status_code=404, detail="Mushroom not found")


@app.get("/api/mushrooms/{mushroom_id}/climate")
def get_climate(mushroom_id: str):
    """14-day average climate (temperature, humidity, rain) with ±1 SD from CSV."""
    csv_path = get_csv_path(mushroom_id)
    if not csv_path:
        raise HTTPException(status_code=404, detail="Mushroom or CSV not found")
    df = load_df(csv_path)
    data = climate_14day(df)
    if not data:
        raise HTTPException(status_code=503, detail="Could not compute climate data")
    return {"days": data}


@app.get("/api/mushrooms/{mushroom_id}/elevation")
def get_elevation(mushroom_id: str, bins: int = 15):
    """Elevation (dem) distribution for plotting histogram."""
    csv_path = get_csv_path(mushroom_id)
    if not csv_path:
        raise HTTPException(status_code=404, detail="Mushroom or CSV not found")
    df = load_df(csv_path)
    data = elevation_distribution(df, bins=bins)
    if not data:
        raise HTTPException(status_code=503, detail="Could not compute elevation data")
    return {"bins": data}


@app.get("/api/mushrooms/{mushroom_id}/season")
def get_season(mushroom_id: str):
    """Monthly sprouting activity (0–100) from observation dates."""
    csv_path = get_csv_path(mushroom_id)
    if not csv_path:
        raise HTTPException(status_code=404, detail="Mushroom or CSV not found")
    df = load_df(csv_path)
    data = season_activity(df)
    if not data:
        raise HTTPException(status_code=503, detail="Could not compute season data")
    return {"months": data}


@app.get("/api/mushrooms/{mushroom_id}/slope")
def get_slope(mushroom_id: str, bins: int = 15):
    """Slope distribution (histogram) for observations."""
    csv_path = get_csv_path(mushroom_id)
    if not csv_path:
        raise HTTPException(status_code=404, detail="Mushroom or CSV not found")
    df = load_df(csv_path)
    data = slope_distribution(df, bins=bins)
    if not data:
        raise HTTPException(status_code=503, detail="Could not compute slope data")
    return {"bins": data}


@app.get("/api/mushrooms/{mushroom_id}/aspect")
def get_aspect(mushroom_id: str, bins: int = 18):
    """Aspect distribution (0–360°) for observations."""
    csv_path = get_csv_path(mushroom_id)
    if not csv_path:
        raise HTTPException(status_code=404, detail="Mushroom or CSV not found")
    df = load_df(csv_path)
    data = aspect_distribution(df, bins=bins)
    if not data:
        raise HTTPException(status_code=503, detail="Could not compute aspect data")
    return {"bins": data}


@app.get("/api/mushrooms/{mushroom_id}/geomorphon")
def get_geomorphon(mushroom_id: str):
    """Geomorphon (terrain form) distribution for observations."""
    csv_path = get_csv_path(mushroom_id)
    if not csv_path:
        raise HTTPException(status_code=404, detail="Mushroom or CSV not found")
    df = load_df(csv_path)
    data = geomorphon_distribution(df)
    if not data:
        raise HTTPException(status_code=503, detail="Could not compute geomorphon data")
    return {"categories": data}


@app.get("/api/mushrooms/{mushroom_id}/landcover")
def get_landcover(mushroom_id: str):
    """Land cover (LC) code distribution for observations."""
    csv_path = get_csv_path(mushroom_id)
    if not csv_path:
        raise HTTPException(status_code=404, detail="Mushroom or CSV not found")
    df = load_df(csv_path)
    data = landcover_distribution(df)
    if not data:
        raise HTTPException(status_code=503, detail="Could not compute land cover data")
    return {"categories": data}
