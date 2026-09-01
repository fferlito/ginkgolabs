"""Cloud Run proxy for iNaturalist Computer Vision. Does not persist images."""

from __future__ import annotations

import os

from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from inaturalist import IdentifyError, score_image

IDENTIFY_SERVICE_SECRET = os.environ.get("IDENTIFY_SERVICE_SECRET", "").strip()
MAX_BYTES = 8 * 1024 * 1024

app = FastAPI(title="MushroomRadar identify", default_response_class=JSONResponse)


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/identify")
async def identify(
    image: UploadFile = File(...),
    latitude: float | None = Form(default=None),
    longitude: float | None = Form(default=None),
    authorization: str | None = Header(default=None),
):
    if IDENTIFY_SERVICE_SECRET:
        token = ""
        if authorization and authorization.lower().startswith("bearer "):
            token = authorization.split(" ", 1)[1].strip()
        if token != IDENTIFY_SERVICE_SECRET:
            raise HTTPException(status_code=401, detail="Unauthorized.")
    data = await image.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty image.")
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="Image is too large (max 8 MB).")
    try:
        results = score_image(
            data,
            image.filename or "scan.jpg",
            image.content_type or "image/jpeg",
            latitude,
            longitude,
        )
    except IdentifyError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc
    return {"results": results}
