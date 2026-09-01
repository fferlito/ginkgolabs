"""Call iNaturalist Computer Vision and map results for the app."""

from __future__ import annotations

import os

import httpx

INAT_SCORE_URL = os.environ.get(
    "INATURALIST_SCORE_URL",
    "https://api.inaturalist.org/v1/computervision/score_image",
)
INAT_TOKEN = os.environ.get("INATURALIST_API_TOKEN", "").strip()
MAX_RESULTS = 8


class IdentifyError(Exception):
    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.status_code = status_code


def _normalize(payload: dict) -> list[dict]:
    rows = payload.get("results") or payload.get("results_comparison") or []
    out: list[dict] = []
    for row in rows:
        taxon = row.get("taxon") or {}
        score = row.get("combined_score") or row.get("vision_score") or row.get("score") or 0
        item = {
            "taxonId": taxon.get("id"),
            "scientificName": taxon.get("name") or "",
            "commonName": taxon.get("preferred_common_name") or taxon.get("english_common_name") or "",
            "score": float(score) if score is not None else 0.0,
            "iconicTaxon": taxon.get("iconic_taxon_name") or "",
        }
        if item["scientificName"] or item["commonName"]:
            out.append(item)
    fungi = [r for r in out if (r["iconicTaxon"] or "").lower() in {"fungi", "mushrooms"}]
    picked = fungi or out
    return picked[:MAX_RESULTS]


def score_image(image_bytes: bytes, filename: str, content_type: str, lat: float | None, lng: float | None) -> list[dict]:
    if not INAT_TOKEN:
        raise IdentifyError("Species ID is not configured yet.", status_code=503)
    headers = {"Authorization": INAT_TOKEN, "User-Agent": "MushroomRadar/1.0"}
    data: dict[str, str] = {}
    if lat is not None:
        data["lat"] = str(lat)
    if lng is not None:
        data["lng"] = str(lng)
    files = {"image": (filename or "scan.jpg", image_bytes, content_type or "image/jpeg")}
    try:
        with httpx.Client(timeout=45.0) as client:
            res = client.post(INAT_SCORE_URL, headers=headers, data=data, files=files)
    except httpx.HTTPError as exc:
        raise IdentifyError("Could not reach the identification service.") from exc
    if res.status_code >= 400:
        raise IdentifyError("Identification service rejected the photo.", status_code=502)
    try:
        payload = res.json()
    except ValueError as exc:
        raise IdentifyError("Identification service returned invalid data.") from exc
    return _normalize(payload if isinstance(payload, dict) else {})
