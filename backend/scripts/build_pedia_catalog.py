"""Fill EU common names and ~3 Commons photos for the pedia catalog."""

from __future__ import annotations

import json
import os
import re
import shutil
import sys
import time
from pathlib import Path
from urllib.parse import quote, unquote

import httpx
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")
sys.path.insert(0, str(ROOT / "data" / "pedia"))
from seed import SEED  # noqa: E402

OUT_PATH = ROOT / "data" / "pedia" / "catalog.json"
SPARQL = "https://query.wikidata.org/sparql"
COMMONS = "https://commons.wikimedia.org/w/api.php"
WIKI_SUMMARY = "https://en.wikipedia.org/api/rest_v1/page/summary/"
INAT_TAXA = "https://api.inaturalist.org/v1/taxa"
UA = "MushroomRadar/1.0 (https://mushroomradar.app; pedia-catalog)"
HEADERS = {"User-Agent": UA, "Accept": "application/json"}
INAT_TOKEN = os.environ.get("INATURALIST_API_TOKEN", "").strip()

EU_LANGS = [
    "sq", "eu", "be", "bs", "bg", "ca", "cs", "cy", "da", "de", "el", "en", "es",
    "et", "fi", "fo", "fr", "ga", "gd", "gl", "hr", "hu", "is", "it", "lb", "lt",
    "lv", "mk", "mt", "nb", "nl", "pl", "pt", "rm", "ro", "ru", "sk", "sl", "sr",
    "sv", "tr", "uk",
]
LANG_ALIASES = {
    "nb": ("nb", "no"),
    "sr": ("sr", "sr-ec", "sr-el", "sh"),
    "uk": ("uk",),
    "be": ("be", "be-tarask"),
}

SKIP_TITLE = (
    "map", "distribution", "range", "icon", "logo", "diagram", "drawing",
    "illustration", "svg", "flag", "coat of", "phylogeny", "microscop",
)
MOBILE_CATALOG = ROOT.parent / "mobile_app" / "data" / "pedia" / "catalog.json"
NONCOMMERCIAL_RE = re.compile(
    r"by-nc|cc-by-nc|non-?commercial|all-rights-reserved",
    re.IGNORECASE,
)
UNKNOWN_LICENSE = {"", "inaturalist", "copyright", "unknown", "arr"}


def chunks(items: list, size: int):
    for i in range(0, len(items), size):
        yield items[i : i + size]


def sparql(query: str) -> list[dict]:
    with httpx.Client(timeout=25, headers={**HEADERS, "Accept": "application/sparql-results+json"}) as client:
        res = client.post(SPARQL, data={"query": query, "format": "json"})
        res.raise_for_status()
        return res.json()["results"]["bindings"]


def fetch_names(scientific_names: list[str]) -> dict[str, dict[str, str]]:
    out: dict[str, dict[str, str]] = {name: {} for name in scientific_names}
    for group in chunks(scientific_names, 15):
        print(f"Fetching names for {len(group)} taxa…", flush=True)
        values = " ".join(f'"{name}"' for name in group)
        query = f"""
        SELECT ?sci ?lang ?name WHERE {{
          VALUES ?sci {{ {values} }}
          ?item wdt:P225 ?sci .
          ?item wdt:P1843 ?name .
          BIND(LANG(?name) AS ?lang)
        }}
        """
        try:
            rows = sparql(query)
        except Exception as exc:
            print(f"Wikidata names failed for chunk: {exc}", flush=True)
            time.sleep(2)
            continue
        for row in rows:
            sci = row["sci"]["value"]
            lang = row["lang"]["value"].lower()
            name = row["name"]["value"].strip()
            if not name or sci not in out:
                continue
            for eu in EU_LANGS:
                aliases = LANG_ALIASES.get(eu, (eu,))
                if lang in aliases and eu not in out[sci]:
                    out[sci][eu] = name
        time.sleep(0.4)
    return out


def fetch_p18(scientific_names: list[str]) -> dict[str, list[str]]:
    out: dict[str, list[str]] = {name: [] for name in scientific_names}
    for group in chunks(scientific_names, 40):
        values = " ".join(f'"{name}"' for name in group)
        query = f"""
        SELECT ?sci ?image WHERE {{
          VALUES ?sci {{ {values} }}
          ?item wdt:P225 ?sci .
          ?item wdt:P18 ?image .
        }}
        """
        try:
            rows = sparql(query)
        except Exception as exc:
            print(f"Wikidata images failed for chunk: {exc}")
            continue
        for row in rows:
            sci = row["sci"]["value"]
            url = row["image"]["value"]
            if sci in out and url not in out[sci]:
                out[sci].append(url)
        time.sleep(0.4)
    return out


def file_path_url(title_or_url: str) -> str:
    if "Special:FilePath/" in title_or_url:
        return title_or_url.split("?")[0] + "?width=800"
    if title_or_url.startswith("http"):
        return title_or_url
    filename = title_or_url.replace("File:", "").replace(" ", "_")
    return f"https://commons.wikimedia.org/wiki/Special:FilePath/{quote(filename, safe='_()-,.')}?width=800"


def is_photo_title(title: str) -> bool:
    lower = title.lower()
    return not any(token in lower for token in SKIP_TITLE)


def is_commercial_license(license_name: str, credit: str = "", url: str = "") -> bool:
    """True if the photo can be used in a commercial product with attribution."""
    blob = f"{license_name or ''} {credit or ''}"
    if NONCOMMERCIAL_RE.search(blob):
        return False
    lic = (license_name or "").strip().lower().replace("_", "-")
    if lic in UNKNOWN_LICENSE:
        return False
    if "inaturalist.org" in (url or "") and lic in UNKNOWN_LICENSE:
        return False
    return True


def commons_search(scientific: str, client: httpx.Client) -> list[dict]:
    photos: list[dict] = []
    try:
        res = client.get(
            COMMONS,
            params={
                "action": "query",
                "format": "json",
                "generator": "search",
                "gsrsearch": scientific,
                "gsrnamespace": 6,
                "gsrlimit": 20,
                "prop": "imageinfo",
                "iiprop": "url|mime|extmetadata",
                "iiurlwidth": 800,
            },
        )
        res.raise_for_status()
        pages = (res.json().get("query") or {}).get("pages") or {}
    except Exception as exc:
        print(f"Commons search failed for {scientific}: {exc}")
        return photos
    for page in pages.values():
        title = page.get("title") or ""
        if not is_photo_title(title):
            continue
        info = (page.get("imageinfo") or [{}])[0]
        mime = str(info.get("mime") or "")
        if not mime.startswith("image/") or "svg" in mime:
            continue
        url = info.get("thumburl") or info.get("url")
        if not url:
            continue
        meta = info.get("extmetadata") or {}
        artist = (meta.get("Artist") or {}).get("value") or ""
        credit = (meta.get("Credit") or {}).get("value") or ""
        license_name = (meta.get("LicenseShortName") or {}).get("value") or "Wikimedia Commons"
        # Strip simple HTML from artist
        artist_plain = (
            artist.replace("<p>", "")
            .replace("</p>", "")
            .split("<")[0]
            .strip()
        )
        photos.append({
            "url": url,
            "credit": artist_plain or credit.split("<")[0].strip() or "Wikimedia Commons",
            "license": license_name,
        })
        if not is_commercial_license(photos[-1]["license"], photos[-1]["credit"], url):
            photos.pop()
            continue
        if len(photos) >= 6:
            break
    return photos


def wikipedia_lang_names(scientific: str, client: httpx.Client) -> dict[str, str]:
    names: dict[str, str] = {}
    try:
        res = client.get(
            "https://en.wikipedia.org/w/api.php",
            params={
                "action": "query",
                "format": "json",
                "titles": scientific,
                "prop": "langlinks",
                "lllimit": 500,
                "redirects": 1,
            },
        )
        res.raise_for_status()
        pages = (res.json().get("query") or {}).get("pages") or {}
        for page in pages.values():
            for link in page.get("langlinks") or []:
                lang = str(link.get("lang") or "").lower()
                title = str(link.get("title") or "").strip()
                if not title:
                    continue
                for eu in EU_LANGS:
                    aliases = LANG_ALIASES.get(eu, (eu,))
                    if lang in aliases and eu not in names:
                        names[eu] = title.split("(")[0].strip()
    except Exception:
        return names
    return names


def inat_headers() -> dict[str, str]:
    headers = dict(HEADERS)
    if INAT_TOKEN:
        headers["Authorization"] = INAT_TOKEN
    return headers


def map_locale(locale: str) -> str | None:
    raw = (locale or "").lower().replace("_", "-")
    if not raw:
        return None
    short = raw.split("-")[0]
    for eu in EU_LANGS:
        aliases = LANG_ALIASES.get(eu, (eu,))
        if raw in aliases or short in aliases or eu == raw or eu == short:
            return eu
    return None


def inaturalist_taxon(scientific: str, client: httpx.Client) -> tuple[dict[str, str], list[dict]]:
    names: dict[str, str] = {}
    photos: list[dict] = []
    try:
        res = client.get(
            INAT_TAXA,
            params={"q": scientific, "is_active": "true", "rank": "species,complex", "per_page": 8},
            headers=inat_headers(),
        )
        res.raise_for_status()
        results = (res.json().get("results") or [])
    except Exception as exc:
        print(f"iNaturalist search failed for {scientific}: {exc}", flush=True)
        return names, photos
    taxon = next(
        (row for row in results if str(row.get("name") or "").lower() == scientific.lower()),
        results[0] if results else None,
    )
    if not taxon:
        return names, photos
    taxon_id = taxon.get("id")
    detail = taxon
    if taxon_id:
        try:
            show = client.get(
                f"{INAT_TAXA}/{taxon_id}",
                params={"all_names": "true"},
                headers=inat_headers(),
            )
            show.raise_for_status()
            shown = (show.json().get("results") or [show.json()])[0]
            if isinstance(shown, dict) and shown.get("id"):
                detail = shown
        except Exception:
            pass
    for row in detail.get("names") or []:
        locale = map_locale(str(row.get("locale") or row.get("language") or ""))
        value = str(row.get("name") or "").strip()
        if locale and value and locale not in names:
            names[locale] = value
    preferred = str(detail.get("preferred_common_name") or detail.get("english_common_name") or "").strip()
    if preferred:
        names.setdefault("en", preferred)
    for item in (detail.get("taxon_photos") or [])[:24]:
        photo = item.get("photo") or item
        license_code = str(photo.get("license_code") or item.get("license_code") or "").lower()
        url = photo.get("large_url") or photo.get("medium_url") or photo.get("url")
        credit = str(photo.get("attribution") or item.get("attribution") or "")
        if not url or not is_commercial_license(license_code, credit, str(url)):
            continue
        photos.append({
            "url": str(url).replace("http://", "https://"),
            "credit": credit or "iNaturalist",
            "license": license_code,
        })
        if len(photos) >= 3:
            break
    if not photos:
        default = detail.get("default_photo") or {}
        url = default.get("large_url") or default.get("medium_url") or default.get("url")
        license_code = str(default.get("license_code") or "").lower()
        credit = str(default.get("attribution") or "")
        if url and is_commercial_license(license_code, credit, str(url)):
            photos.append({
                "url": str(url).replace("http://", "https://"),
                "credit": credit or "iNaturalist",
                "license": license_code,
            })
    return names, photos


def wikipedia_thumb(scientific: str, client: httpx.Client) -> dict | None:
    try:
        res = client.get(WIKI_SUMMARY + quote(scientific.replace(" ", "_")), headers=HEADERS)
        if res.status_code >= 400:
            return None
        data = res.json()
        thumb = (data.get("thumbnail") or {}).get("source")
        if not thumb:
            return None
        return {
            "url": thumb,
            "credit": "Wikipedia / Wikimedia Commons",
            "license": "Wikimedia",
        }
    except Exception:
        return None


def unique_photos(items: list[dict], limit: int = 3) -> list[dict]:
    seen: set[str] = set()
    out: list[dict] = []
    for item in items:
        url = str(item.get("url") or "")
        credit = str(item.get("credit") or "Wikimedia Commons")
        license_name = str(item.get("license") or "Wikimedia Commons")
        if not is_commercial_license(license_name, credit, url):
            continue
        key = unquote(url.split("?")[0]).rsplit("/", 1)[-1].lower()
        if not url or key in seen:
            continue
        seen.add(key)
        out.append({
            "url": url,
            "credit": credit,
            "license": license_name,
        })
        if len(out) >= limit:
            break
    return out


def write_catalog(catalog: list[dict]) -> None:
    payload = json.dumps(catalog, ensure_ascii=False, indent=2) + "\n"
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(payload, encoding="utf-8")
    MOBILE_CATALOG.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(OUT_PATH, MOBILE_CATALOG)


def extra_photos(scientific: str, client: httpx.Client) -> list[dict]:
    _, inat_photos = inaturalist_taxon(scientific, client)
    extras: list[dict] = list(inat_photos)
    wiki = wikipedia_thumb(scientific, client)
    if wiki:
        extras.append(wiki)
    extras.extend(commons_search(scientific, client))
    return extras


def repair_catalog() -> None:
    catalog = json.loads(OUT_PATH.read_text(encoding="utf-8"))
    before_nc = 0
    short_ids: list[str] = []
    for row in catalog:
        original = list(row.get("photos") or [])
        kept = unique_photos(original, 3)
        before_nc += max(0, len(original) - len([p for p in original if is_commercial_license(p.get("license") or "", p.get("credit") or "", p.get("url") or "")]))
        row["photos"] = kept
        if len(kept) < 3:
            short_ids.append(row.get("scientificName") or row.get("id") or "?")
    print(f"Removed {before_nc} non-commercial/unknown photos; {len(short_ids)} species need replacements", flush=True)
    with httpx.Client(timeout=30, headers=HEADERS) as client:
        for index, row in enumerate(catalog, start=1):
            sci = row.get("scientificName") or ""
            if len(row.get("photos") or []) >= 3:
                continue
            extras = extra_photos(sci, client)
            row["photos"] = unique_photos(list(row.get("photos") or []) + extras, 3)
            print(f"[{index}/{len(catalog)}] {sci}: {len(row['photos'])} commercial photos", flush=True)
            if index % 10 == 0:
                write_catalog(catalog)
            time.sleep(0.35)
    write_catalog(catalog)
    missing = [row["scientificName"] for row in catalog if len(row.get("photos") or []) < 3]
    print(f"Wrote {OUT_PATH} and {MOBILE_CATALOG} ({len(catalog)} species, {len(missing)} still short)", flush=True)
    if missing:
        print("Short: " + ", ".join(missing), flush=True)


def main() -> None:
    print("Querying Wikidata for vernacular names…", flush=True)
    names_by_sci = fetch_names([row["scientificName"] for row in SEED])
    print("Querying Wikidata for lead images…", flush=True)
    p18 = fetch_p18([row["scientificName"] for row in SEED])
    print("Fetching Commons/Wikipedia media…", flush=True)
    catalog: list[dict] = []
    with httpx.Client(timeout=30, headers=HEADERS) as client:
        for index, row in enumerate(SEED, start=1):
            sci = row["scientificName"]
            names = dict(row.get("names") or {})
            inat_names, inat_photos = inaturalist_taxon(sci, client)
            for lang, value in inat_names.items():
                names.setdefault(lang, value)
            for lang, value in names_by_sci.get(sci, {}).items():
                names.setdefault(lang, value)
            for lang, value in wikipedia_lang_names(sci, client).items():
                names.setdefault(lang, value)
            photos: list[dict] = list(inat_photos)
            for url in p18.get(sci, []):
                photos.append({"url": file_path_url(url), "credit": "Wikimedia Commons", "license": "Wikimedia Commons"})
            wiki = wikipedia_thumb(sci, client)
            if wiki:
                photos.append(wiki)
            photos.extend(commons_search(sci, client))
            filled = dict(row)
            filled["names"] = names
            filled["photos"] = unique_photos(photos, 3)
            catalog.append(filled)
            print(f"[{index}/{len(SEED)}] {sci}: {len(filled['names'])} names, {len(filled['photos'])} photos", flush=True)
            if index % 10 == 0 or index == len(SEED):
                write_catalog(catalog)
            time.sleep(0.35)
    print(f"Wrote {OUT_PATH} ({len(catalog)} species)", flush=True)


if __name__ == "__main__":
    if "--repair" in sys.argv:
        repair_catalog()
    else:
        main()
