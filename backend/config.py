"""Mushroom definitions (loaded from JSON in data/) and CSV file mapping for the API."""

import json
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent / "data"


def _load_mushroom_definitions() -> list[dict]:
    """Load all mushroom definition JSONs from data/. A valid definition has id, name, and csv_file."""
    definitions = []
    if not DATA_DIR.is_dir():
        return definitions
    for path in sorted(DATA_DIR.glob("*.json")):
        try:
            with open(path, encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, dict) and data.get("id") and data.get("name") and data.get("csv_file"):
                definitions.append(data)
        except (json.JSONDecodeError, OSError):
            continue
    return definitions


MUSHROOM_DEFINITIONS = _load_mushroom_definitions()


def get_csv_path(mushroom_id: str) -> Path | None:
    """Return the CSV path for a mushroom id, or None if not found."""
    for m in MUSHROOM_DEFINITIONS:
        if m["id"] == mushroom_id:
            p = DATA_DIR / m["csv_file"]
            return p if p.exists() else None
    return None
