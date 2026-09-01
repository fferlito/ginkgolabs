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


def _client():
    from google.cloud import storage
    from google.oauth2 import service_account

    raw = os.environ.get("GCS_SERVICE_ACCOUNT_JSON", "").strip()
    if raw:
        info = json.loads(raw)
        creds = service_account.Credentials.from_service_account_info(info)
        return storage.Client(credentials=creds, project=info.get("project_id"))
    path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "").strip()
    if path:
        resolved = Path(path)
        if not resolved.is_absolute():
            resolved = Path(__file__).resolve().parent / path
        creds = service_account.Credentials.from_service_account_file(str(resolved))
        return storage.Client(credentials=creds)
    return storage.Client()


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
    blob = _client().bucket(GCS_BUCKET).blob(object_key)
    return blob.generate_signed_url(
        version="v4",
        expiration=timedelta(minutes=UPLOAD_MINUTES),
        method="PUT",
        content_type=content_type,
    )


def signed_read_url(object_key: str) -> str | None:
    if not object_key:
        return None
    blob = _client().bucket(GCS_BUCKET).blob(object_key)
    return blob.generate_signed_url(
        version="v4",
        expiration=timedelta(minutes=READ_MINUTES),
        method="GET",
    )
