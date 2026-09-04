"""Mushroom definitions from the pedia catalog, with optional CSV stats files."""

from __future__ import annotations

import json
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent / "data"
PEDIA_DIR = DATA_DIR / "pedia"
CATALOG_PATH = PEDIA_DIR / "catalog.json"


def _legacy_csv_index() -> dict[str, str]:
    mapping: dict[str, str] = {}
    if not DATA_DIR.is_dir():
        return mapping
    for path in DATA_DIR.glob("*.json"):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            continue
        if isinstance(data, dict) and data.get("id") and data.get("csv_file"):
            mapping[str(data["id"])] = str(data["csv_file"])
            sci = str(data.get("scientificName") or "").strip().lower()
            if sci:
                mapping[sci] = str(data["csv_file"])
    return mapping


def _normalize(entry: dict, csv_index: dict[str, str]) -> dict | None:
    if not isinstance(entry, dict):
        return None
    mushroom_id = str(entry.get("id") or "").strip()
    scientific = str(entry.get("scientificName") or "").strip()
    if not mushroom_id or not scientific:
        return None
    names = entry.get("names") if isinstance(entry.get("names"), dict) else {}
    name = (
        str(names.get("en") or "").strip()
        or str(entry.get("name") or "").strip()
        or scientific
    )
    csv_file = entry.get("csv_file") or csv_index.get(mushroom_id) or csv_index.get(scientific.lower())
    photos = entry.get("photos") if isinstance(entry.get("photos"), list) else []
    description = entry.get("description")
    if isinstance(description, str):
        description = {"en": description}
    elif not isinstance(description, dict):
        description = {}
    return {
        "id": mushroom_id,
        "name": name,
        "scientificName": scientific,
        "names": {str(k): str(v) for k, v in names.items() if v},
        "edible": bool(entry.get("edible")),
        "poisonous": bool(entry.get("poisonous")),
        "seasonMonths": [int(m) for m in (entry.get("seasonMonths") or []) if str(m).isdigit() or isinstance(m, int)],
        "description": {str(k): str(v) for k, v in description.items() if v},
        "photos": [p for p in photos if isinstance(p, dict) and p.get("url")],
        "thumbUrl": str(entry.get("thumbUrl") or "").strip() or None,
        "csv_file": csv_file,
        "statistics": entry.get("statistics") if isinstance(entry.get("statistics"), list) else [],
    }


def _load_mushroom_definitions() -> list[dict]:
    csv_index = _legacy_csv_index()
    if CATALOG_PATH.is_file():
        try:
            raw = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            raw = []
        if isinstance(raw, list):
            rows = [_normalize(item, csv_index) for item in raw]
            return [row for row in rows if row]

    definitions = []
    if DATA_DIR.is_dir():
        for path in sorted(DATA_DIR.glob("*.json")):
            try:
                data = json.loads(path.read_text(encoding="utf-8"))
            except (json.JSONDecodeError, OSError):
                continue
            row = _normalize(data, csv_index)
            if row:
                definitions.append(row)
    return definitions


MUSHROOM_DEFINITIONS = _load_mushroom_definitions()


def get_csv_path(mushroom_id: str) -> Path | None:
    """Return the CSV path for a mushroom id, or None if not found."""
    for mushroom in MUSHROOM_DEFINITIONS:
        if mushroom["id"] == mushroom_id:
            csv_file = mushroom.get("csv_file")
            if not csv_file:
                return None
            path = DATA_DIR / csv_file
            return path if path.exists() else None
    return None


def has_stats(mushroom_id: str) -> bool:
    return get_csv_path(mushroom_id) is not None
