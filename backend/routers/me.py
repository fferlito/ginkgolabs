"""Clerk-scoped places, observations, photo upload URLs, and scan identify."""

from __future__ import annotations

import os
import time
from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from clerk_auth import current_clerk_user
from database import get_db
from gcs_storage import assert_owned_object, new_object_key, signed_read_url, signed_upload_url
from inaturalist import IdentifyError, score_image
from models import Observation, Place, User

router = APIRouter(prefix="/api/me", tags=["me"])

IDENTIFY_MAX_BYTES = 8 * 1024 * 1024
IDENTIFY_RATE = int(os.environ.get("IDENTIFY_RATE_LIMIT", "10"))
IDENTIFY_WINDOW_SEC = int(os.environ.get("IDENTIFY_RATE_WINDOW_SEC", "60"))
_identify_hits: dict[str, list[float]] = {}


class PlaceIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    notes: str | None = None
    latitude: float | None = None
    longitude: float | None = None


class PlacePatch(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    notes: str | None = None
    latitude: float | None = None
    longitude: float | None = None


class PlaceOut(BaseModel):
    id: UUID
    name: str
    notes: str | None
    latitude: float | None
    longitude: float | None
    createdAt: str
    updatedAt: str


class UploadUrlIn(BaseModel):
    contentType: str
    isPublic: bool = False


class ObservationIn(BaseModel):
    speciesId: str | None = None
    speciesName: str = Field(min_length=1, max_length=200)
    scientificName: str | None = None
    observedOn: date
    latitude: float
    longitude: float
    isPublic: bool = False
    notes: str | None = None
    objectKey: str
    source: str = "manual"


class ObservationPatch(BaseModel):
    speciesId: str | None = None
    speciesName: str | None = Field(default=None, min_length=1, max_length=200)
    scientificName: str | None = None
    observedOn: date | None = None
    latitude: float | None = None
    longitude: float | None = None
    isPublic: bool | None = None
    notes: str | None = None


class ObservationOut(BaseModel):
    id: UUID
    speciesId: str | None
    speciesName: str
    scientificName: str | None
    observedOn: str
    latitude: float
    longitude: float
    isPublic: bool
    notes: str | None
    photoObject: str
    photoUrl: str | None
    source: str
    createdAt: str
    updatedAt: str


def _iso(dt) -> str:
    return dt.isoformat() if dt else ""


def _place_out(row: Place) -> PlaceOut:
    return PlaceOut(
        id=row.id,
        name=row.name,
        notes=row.notes,
        latitude=row.latitude,
        longitude=row.longitude,
        createdAt=_iso(row.created_at),
        updatedAt=_iso(row.updated_at),
    )


def _obs_out(row: Observation) -> ObservationOut:
    try:
        photo_url = signed_read_url(row.photo_object)
    except Exception:
        photo_url = None
    return ObservationOut(
        id=row.id,
        speciesId=row.species_id,
        speciesName=row.species_name,
        scientificName=row.scientific_name,
        observedOn=row.observed_on.isoformat(),
        latitude=row.latitude,
        longitude=row.longitude,
        isPublic=row.is_public,
        notes=row.notes,
        photoObject=row.photo_object,
        photoUrl=photo_url,
        source=row.source,
        createdAt=_iso(row.created_at),
        updatedAt=_iso(row.updated_at),
    )


def _owned_place(db: Session, user: User, place_id: UUID) -> Place:
    row = db.get(Place, place_id)
    if row is None or row.clerk_user_id != user.clerk_user_id:
        raise HTTPException(status_code=404, detail="Place not found.")
    return row


def _owned_obs(db: Session, user: User, observation_id: UUID) -> Observation:
    row = db.get(Observation, observation_id)
    if row is None or row.clerk_user_id != user.clerk_user_id:
        raise HTTPException(status_code=404, detail="Observation not found.")
    return row


@router.get("/places", response_model=list[PlaceOut])
def list_places(user: User = Depends(current_clerk_user), db: Session = Depends(get_db)):
    rows = (
        db.query(Place)
        .filter(Place.clerk_user_id == user.clerk_user_id)
        .order_by(Place.created_at.desc())
        .all()
    )
    return [_place_out(r) for r in rows]


@router.post("/places", response_model=PlaceOut)
def create_place(body: PlaceIn, user: User = Depends(current_clerk_user), db: Session = Depends(get_db)):
    row = Place(
        clerk_user_id=user.clerk_user_id,
        name=body.name.strip(),
        notes=(body.notes or "").strip() or None,
        latitude=body.latitude,
        longitude=body.longitude,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _place_out(row)


@router.patch("/places/{place_id}", response_model=PlaceOut)
def update_place(
    place_id: UUID,
    body: PlacePatch,
    user: User = Depends(current_clerk_user),
    db: Session = Depends(get_db),
):
    row = _owned_place(db, user, place_id)
    if body.name is not None:
        row.name = body.name.strip()
    if body.notes is not None:
        row.notes = body.notes.strip() or None
    if body.latitude is not None:
        row.latitude = body.latitude
    if body.longitude is not None:
        row.longitude = body.longitude
    db.commit()
    db.refresh(row)
    return _place_out(row)


@router.delete("/places/{place_id}")
def delete_place(place_id: UUID, user: User = Depends(current_clerk_user), db: Session = Depends(get_db)):
    row = _owned_place(db, user, place_id)
    db.delete(row)
    db.commit()
    return {"ok": True}


@router.post("/observations/upload-url")
def observation_upload_url(body: UploadUrlIn, user: User = Depends(current_clerk_user)):
    key = new_object_key(user.clerk_user_id, body.contentType, body.isPublic)
    try:
        url = signed_upload_url(key, body.contentType)
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Photo storage is not configured.") from exc
    return {"uploadUrl": url, "objectKey": key}


@router.get("/observations", response_model=list[ObservationOut])
def list_observations(user: User = Depends(current_clerk_user), db: Session = Depends(get_db)):
    rows = (
        db.query(Observation)
        .filter(Observation.clerk_user_id == user.clerk_user_id)
        .order_by(Observation.observed_on.desc(), Observation.created_at.desc())
        .all()
    )
    return [_obs_out(r) for r in rows]


@router.post("/observations", response_model=ObservationOut)
def create_observation(
    body: ObservationIn,
    user: User = Depends(current_clerk_user),
    db: Session = Depends(get_db),
):
    source = body.source if body.source in {"manual", "scan"} else "manual"
    assert_owned_object(user.clerk_user_id, body.objectKey)
    row = Observation(
        clerk_user_id=user.clerk_user_id,
        species_id=body.speciesId,
        species_name=body.speciesName.strip(),
        scientific_name=(body.scientificName or "").strip() or None,
        observed_on=body.observedOn,
        latitude=body.latitude,
        longitude=body.longitude,
        is_public=body.isPublic,
        notes=(body.notes or "").strip() or None,
        photo_object=body.objectKey,
        source=source,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _obs_out(row)


@router.patch("/observations/{observation_id}", response_model=ObservationOut)
def update_observation(
    observation_id: UUID,
    body: ObservationPatch,
    user: User = Depends(current_clerk_user),
    db: Session = Depends(get_db),
):
    row = _owned_obs(db, user, observation_id)
    if body.speciesId is not None:
        row.species_id = body.speciesId
    if body.speciesName is not None:
        row.species_name = body.speciesName.strip()
    if body.scientificName is not None:
        row.scientific_name = body.scientificName.strip() or None
    if body.observedOn is not None:
        row.observed_on = body.observedOn
    if body.latitude is not None:
        row.latitude = body.latitude
    if body.longitude is not None:
        row.longitude = body.longitude
    if body.isPublic is not None:
        row.is_public = body.isPublic
    if body.notes is not None:
        row.notes = body.notes.strip() or None
    db.commit()
    db.refresh(row)
    return _obs_out(row)


@router.delete("/observations/{observation_id}")
def delete_observation(
    observation_id: UUID,
    user: User = Depends(current_clerk_user),
    db: Session = Depends(get_db),
):
    row = _owned_obs(db, user, observation_id)
    db.delete(row)
    db.commit()
    return {"ok": True}


def _rate_identify(clerk_user_id: str) -> None:
    now = time.monotonic()
    hits = [t for t in _identify_hits.get(clerk_user_id, []) if now - t < IDENTIFY_WINDOW_SEC]
    if len(hits) >= IDENTIFY_RATE:
        raise HTTPException(status_code=429, detail="Too many identification requests.")
    hits.append(now)
    _identify_hits[clerk_user_id] = hits


@router.post("/identify")
async def identify_photo(
    image: UploadFile = File(...),
    latitude: float | None = Form(default=None),
    longitude: float | None = Form(default=None),
    user: User = Depends(current_clerk_user),
):
    _rate_identify(user.clerk_user_id)
    data = await image.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty image.")
    if len(data) > IDENTIFY_MAX_BYTES:
        raise HTTPException(status_code=413, detail="Image is too large (max 8 MB).")
    identify_url = os.environ.get("IDENTIFY_URL", "").strip()
    if identify_url:
        import httpx

        secret = os.environ.get("IDENTIFY_SERVICE_SECRET", "").strip()
        headers = {"Authorization": f"Bearer {secret}"} if secret else {}
        files = {"image": (image.filename or "scan.jpg", data, image.content_type or "image/jpeg")}
        form = {}
        if latitude is not None:
            form["latitude"] = str(latitude)
        if longitude is not None:
            form["longitude"] = str(longitude)
        try:
            async with httpx.AsyncClient(timeout=50.0) as client:
                res = await client.post(identify_url.rstrip("/") + "/identify", headers=headers, data=form, files=files)
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=502, detail="Identification service is unreachable.") from exc
        if res.status_code >= 400:
            raise HTTPException(status_code=502, detail="Identification service failed.")
        return res.json()
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
