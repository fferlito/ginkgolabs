"""Generate European locale JSON files from the English catalog."""
from __future__ import annotations

import json
from copy import deepcopy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "locales"
EN = json.loads((ROOT / "en.json").read_text(encoding="utf-8"))


def save(code: str, patch: dict) -> None:
    data = deepcopy(EN)
    merge(data, patch)
    (ROOT / f"{code}.json").write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def merge(base: dict, patch: dict) -> None:
    for key, value in patch.items():
        if isinstance(value, dict) and isinstance(base.get(key), dict):
            merge(base[key], value)
        else:
            base[key] = value


def write_resources(codes: list[str]) -> None:
    lines = [f'import {code} from "./{code}.json";' for code in codes]
    lines.append("")
    lines.append("export const resources = {")
    for code in codes:
        lines.append(f"  {code}: {{ translation: {code} }},")
    lines.append("};")
    lines.append("")
    (ROOT / "resources.ts").write_text("\n".join(lines), encoding="utf-8")


if __name__ == "__main__":
    codes = sorted(path.stem for path in ROOT.glob("*.json"))
    write_resources(codes)
    print("wrote resources.ts for", ", ".join(codes))
