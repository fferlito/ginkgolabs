"""
FastAPI backend for Mushroompedia: mushroom definitions and chart data from CSV.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from config import MUSHROOM_DEFINITIONS, get_csv_path
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

app = FastAPI(
    title="Mushroompedia API",
    description="Mushroom definitions and chart data (climate, elevation, season)",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"service": "Mushroompedia API", "docs": "/docs"}


@app.get("/api/mushrooms")
def list_mushrooms():
    """List all mushroom definitions (id, name, scientificName, no CSV data)."""
    return [
        {
            "id": m["id"],
            "name": m["name"],
            "scientificName": m["scientificName"],
            "description": m["description"],
            "statistics": m["statistics"],
        }
        for m in MUSHROOM_DEFINITIONS
    ]


@app.get("/api/mushrooms/{mushroom_id}")
def get_mushroom(mushroom_id: str):
    """Get one mushroom definition by id."""
    for m in MUSHROOM_DEFINITIONS:
        if m["id"] == mushroom_id:
            return {
                "id": m["id"],
                "name": m["name"],
                "scientificName": m["scientificName"],
                "description": m["description"],
                "statistics": m["statistics"],
                "csv_file": m["csv_file"],
            }
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
