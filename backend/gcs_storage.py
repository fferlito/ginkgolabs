"""Private GCS user-media: signed upload/read URLs, object-key checks."""

from __future__ import annotations

import json
import os
from datetime import timedelta
from pathlib import Path
from uuid import uuid4

from dotenv import load_dotenv
from fastapi import HTTPException

load_dotenv(Path(__file__).resolve().parent / ".env")

GCS_BUCKET = os.environ.get("GCS_USER_MEDIA_BUCKET", "mushroom-radar-user-media")
UPLOAD_MINUTES = int(os.environ.get("GCS_UPLOAD_URL_MINUTES", "15"))
READ_MINUTES = int(os.environ.get("GCS_READ_URL_MINUTES", "60"))

_ALLOWED_TYPES = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
}


def _parse_sa_json(raw: str) -> dict:
    text = raw.strip().lstrip("\ufeff")
    last_exc: Exception | None = None
    seen: set[str] = set()
    for _ in range(6):
        if text in seen:
            break
        seen.add(text)
        try:
            info = json.loads(text)
        except json.JSONDecodeError as exc:
            last_exc = exc
            start, end = text.find("{"), text.rfind("}")
            if start != -1 and end > start:
                blob = text[start : end + 1]
                if blob not in seen:
                    text = blob
                    continue
            unescaped = text.replace('\\"', '"')
            if unescaped != text and unescaped not in seen:
                text = unescaped
                continue
            if len(text) >= 2 and text[0] == text[-1] and text[0] in {'"', "'"}:
                text = text[1:-1]
                continue
            break
        if isinstance(info, dict):
            if not info.get("private_key"):
                raise HTTPException(status_code=503, detail="Photo storage credentials are invalid.")
            return info
        if isinstance(info, str):
            text = info.strip()
            continue
        break
    raise HTTPException(status_code=503, detail="Photo storage credentials are invalid.") from last_exc


def _looks_like_sa_json(value: str) -> bool:
    head = value.strip().lstrip("\ufeff")[:800]
    return "{" in head and ("private_key" in head or "service_account" in head or '"type"' in head)


def _sa_info_from_env() -> dict | None:
    raw = os.environ.get("GCS_SERVICE_ACCOUNT_JSON", "").strip()
    path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "").strip()
    for value in (raw, path):
        if not value:
            continue
        if _looks_like_sa_json(value) or value.lstrip().startswith("{"):
            return _parse_sa_json(value)
        resolved = Path(value)
        if not resolved.is_absolute():
            resolved = Path(__file__).resolve().parent / value
        if resolved.is_file():
            return _parse_sa_json(resolved.read_text(encoding="utf-8"))
    return None


def _client():
    from google.cloud import storage
    from google.oauth2 import service_account

    info = _sa_info_from_env()
    if not info:
        raise HTTPException(
            status_code=503,
            detail="Photo storage is not configured. Set GCS_SERVICE_ACCOUNT_JSON on the API.",
        )
    creds = service_account.Credentials.from_service_account_info(info)
    return storage.Client(credentials=creds, project=info.get("project_id"))


def new_object_key(clerk_user_id: str, content_type: str, public: bool) -> str:
    ext = _ALLOWED_TYPES.get(content_type.lower())
    if not ext:
        raise HTTPException(status_code=400, detail="Unsupported image type.")
    prefix = "public" if public else "private"
    return f"{prefix}/{clerk_user_id}/{uuid4()}.{ext}"


def assert_owned_object(clerk_user_id: str, object_key: str) -> None:
    private = f"private/{clerk_user_id}/"
    public = f"public/{clerk_user_id}/"
    if not (object_key.startswith(private) or object_key.startswith(public)):
        raise HTTPException(status_code=400, detail="Invalid photo object.")


def signed_upload_url(object_key: str, content_type: str) -> str:
    try:
        blob = _client().bucket(GCS_BUCKET).blob(object_key)
        return blob.generate_signed_url(
            version="v4",
            expiration=timedelta(minutes=UPLOAD_MINUTES),
            method="PUT",
            content_type=content_type,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Photo storage could not sign an upload URL.") from exc


def signed_read_url(object_key: str) -> str | None:
    if not object_key:
        return None
    try:
        blob = _client().bucket(GCS_BUCKET).blob(object_key)
        return blob.generate_signed_url(
            version="v4",
            expiration=timedelta(minutes=READ_MINUTES),
            method="GET",
        )
    except HTTPException:
        return None
    except Exception:
        return None
