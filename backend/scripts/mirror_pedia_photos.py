"""Download catalog photos, resize keeping aspect ratio, upload to the public pedia bucket."""

from __future__ import annotations

import io
import json
import os
import sys
import time
from pathlib import Path

import httpx
from dotenv import load_dotenv
from google.cloud import storage
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")
sys.path.insert(0, str(ROOT))

from gcs_storage import _sa_info_from_env  # noqa: E402

CATALOG = ROOT / "data" / "pedia" / "catalog.json"
MOBILE_CATALOG = ROOT.parent / "mobile_app" / "data" / "pedia" / "catalog.json"
BUCKET = os.environ.get("GCS_PEDIA_BUCKET", "mushroom-radar-pedia")
PUBLIC_BASE = f"https://storage.googleapis.com/{BUCKET}"
UA = "MushroomRadar/1.0 (https://mushroomradar.app; pedia-photos)"
MINI_SIDE = 256
DETAIL_SIDE = 800
JPEG_QUALITY = 82
CACHE_CONTROL = "public, max-age=31536000, immutable"


def public_url(object_key: str) -> str:
    return f"{PUBLIC_BASE}/{object_key}"


def client() -> storage.Client:
    info = _sa_info_from_env()
    if info:
        from google.oauth2 import service_account

        creds = service_account.Credentials.from_service_account_info(info)
        return storage.Client(credentials=creds, project=info.get("project_id"))
    return storage.Client()


def fit(image: Image.Image, max_side: int) -> Image.Image:
    image = ImageOps.exif_transpose(image)
    if image.mode in {"RGBA", "LA", "P"}:
        rgba = image.convert("RGBA")
        background = Image.new("RGB", rgba.size, (11, 14, 12))
        background.paste(rgba, mask=rgba.split()[-1])
        image = background
    elif image.mode != "RGB":
        image = image.convert("RGB")
    width, height = image.size
    longest = max(width, height)
    if longest <= max_side:
        return image
    scale = max_side / longest
    size = (max(1, round(width * scale)), max(1, round(height * scale)))
    return image.resize(size, Image.Resampling.LANCZOS)


def encode_jpeg(image: Image.Image) -> bytes:
    buf = io.BytesIO()
    image.save(buf, format="JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)
    return buf.getvalue()


def source_url(photo: dict) -> str:
    raw = str(photo.get("sourceUrl") or photo.get("url") or "").strip()
    if raw.startswith("http://"):
        return "https://" + raw[len("http://") :]
    return raw


def download(http: httpx.Client, url: str) -> bytes:
    last_exc: Exception | None = None
    for attempt in range(4):
        try:
            res = http.get(url, follow_redirects=True)
            if res.status_code in {429, 500, 502, 503, 504}:
                time.sleep(1.5 * (attempt + 1))
                continue
            res.raise_for_status()
            return res.content
        except Exception as exc:
            last_exc = exc
            time.sleep(1.5 * (attempt + 1))
    raise last_exc or RuntimeError(f"download failed: {url}")


def upload(bucket: storage.Bucket, object_key: str, data: bytes) -> None:
    blob = bucket.blob(object_key)
    blob.cache_control = CACHE_CONTROL
    blob.content_type = "image/jpeg"
    blob.upload_from_string(data, content_type="image/jpeg")


def main() -> None:
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    store = client().bucket(BUCKET)
    failures: list[str] = []
    with httpx.Client(timeout=40, headers={"User-Agent": UA, "Accept": "image/*,*/*"}) as http:
        for index, row in enumerate(catalog, start=1):
            mushroom_id = str(row.get("id") or "")
            photos = [p for p in (row.get("photos") or []) if isinstance(p, dict)]
            new_photos: list[dict] = []
            mini_url = None
            for photo_index, photo in enumerate(photos):
                url = source_url(photo)
                if not url:
                    continue
                try:
                    original = Image.open(io.BytesIO(download(http, url)))
                    original.load()
                    detail = encode_jpeg(fit(original, DETAIL_SIDE))
                    key = f"{mushroom_id}/{photo_index}.jpg"
                    upload(store, key, detail)
                    hosted = {
                        "url": public_url(key),
                        "sourceUrl": url if PUBLIC_BASE not in url else str(photo.get("sourceUrl") or url),
                        "credit": photo.get("credit") or "Wikimedia Commons",
                        "license": photo.get("license") or "Wikimedia Commons",
                    }
                    new_photos.append(hosted)
                    if mini_url is None:
                        mini = encode_jpeg(fit(original, MINI_SIDE))
                        mini_key = f"{mushroom_id}/mini.jpg"
                        upload(store, mini_key, mini)
                        mini_url = public_url(mini_key)
                except Exception as exc:
                    failures.append(f"{mushroom_id}[{photo_index}]: {exc}")
                    if photo.get("url"):
                        new_photos.append(photo)
                time.sleep(0.08)
            row["photos"] = new_photos
            if mini_url:
                row["thumbUrl"] = mini_url
            elif new_photos:
                row["thumbUrl"] = new_photos[0]["url"]
            print(
                f"[{index}/{len(catalog)}] {mushroom_id}: {len(new_photos)} photos"
                + ("" if mini_url else " (no mini)"),
                flush=True,
            )
            if index % 10 == 0 or index == len(catalog):
                payload = json.dumps(catalog, ensure_ascii=False, indent=2) + "\n"
                CATALOG.write_text(payload, encoding="utf-8")
                MOBILE_CATALOG.parent.mkdir(parents=True, exist_ok=True)
                MOBILE_CATALOG.write_text(payload, encoding="utf-8")
    payload = json.dumps(catalog, ensure_ascii=False, indent=2) + "\n"
    CATALOG.write_text(payload, encoding="utf-8")
    MOBILE_CATALOG.write_text(payload, encoding="utf-8")
    print(f"Wrote catalogs. Failures: {len(failures)}", flush=True)
    for line in failures:
        print(f"  {line}", flush=True)


if __name__ == "__main__":
    main()
