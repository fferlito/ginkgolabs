"""Helpers to shape Mushroompedia API payloads."""

from __future__ import annotations

from config import has_stats


def season_label(months: list[int]) -> str:
    names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    uniq = sorted({int(m) for m in months if isinstance(m, int) and 1 <= m <= 12})
    if not uniq:
        return ""
    return ", ".join(names[m - 1] for m in uniq)


def default_statistics(mushroom: dict) -> list[dict]:
    existing = mushroom.get("statistics") or []
    if existing:
        return existing
    months = mushroom.get("seasonMonths") or []
    if mushroom.get("poisonous"):
        edibility = "Poisonous"
    elif mushroom.get("edible"):
        edibility = "Edible"
    else:
        edibility = "Not edible"
    stats = [
        {"label": "Edibility", "value": edibility},
        {"label": "Season", "value": season_label(months) or "Variable"},
    ]
    return stats


def pick_description(mushroom: dict, lang: str = "en") -> str:
    descriptions = mushroom.get("description") or {}
    if isinstance(descriptions, str):
        return descriptions
    return str(descriptions.get(lang) or descriptions.get("en") or "")


def list_payload(mushroom: dict) -> dict:
    photos = [p for p in (mushroom.get("photos") or []) if isinstance(p, dict) and p.get("url")]
    compact = [
        {"url": photo["url"], "credit": photo.get("credit"), "license": photo.get("license")}
        for photo in photos
    ]
    return {
        "id": mushroom["id"],
        "name": mushroom.get("name") or mushroom["scientificName"],
        "scientificName": mushroom["scientificName"],
        "names": mushroom.get("names") or {},
        "edible": bool(mushroom.get("edible")),
        "poisonous": bool(mushroom.get("poisonous")),
        "seasonMonths": mushroom.get("seasonMonths") or [],
        "photos": compact,
        "thumbUrl": mushroom.get("thumbUrl") or (compact[0]["url"] if compact else None),
        "hasStats": has_stats(mushroom["id"]),
    }


def detail_payload(mushroom: dict) -> dict:
    payload = list_payload(mushroom)
    payload["description"] = pick_description(mushroom)
    payload["statistics"] = default_statistics(mushroom)
    if mushroom.get("csv_file"):
        payload["csv_file"] = mushroom["csv_file"]
    return payload
