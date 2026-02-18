"""Load mushroom CSV data and compute aggregates for charts."""

from pathlib import Path
import pandas as pd
from typing import Any

MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def _temp_cols() -> list[str]:
    return [f"Temp_{i}" for i in range(1, 15)]


def _humidity_cols() -> list[str]:
    return [f"RelHum_{i}" for i in range(1, 15)]


def _rain_cols() -> list[str]:
    return [f"P_{i}" for i in range(1, 15)]


def _pressure_cols() -> list[str]:
    return [f"Pres_{i}" for i in range(1, 15)]


def load_df(csv_path: Path, max_rows: int = 50_000) -> pd.DataFrame | None:
    """Load CSV with optional row limit for performance."""
    if not csv_path or not csv_path.exists():
        return None
    try:
        df = pd.read_csv(csv_path, nrows=max_rows)
        return df
    except Exception:
        return None


def climate_14day(df: pd.DataFrame) -> list[dict[str, Any]] | None:
    """
    Compute 14-day ideal conditions: per-day mean ± std (temp, humidity, rain, pressure).
    Returns list of { day, idealTemperature, ..., idealPressure, idealPressureUpper, idealPressureLower }.
    """
    if df is None or df.empty:
        return None
    t_cols = _temp_cols()
    h_cols = _humidity_cols()
    r_cols = _rain_cols()
    p_cols = _pressure_cols()
    if not (all(c in df.columns for c in t_cols) and all(c in df.columns for c in h_cols) and all(c in df.columns for c in r_cols)):
        return None
    has_pressure = all(c in df.columns for c in p_cols)
    out = []
    for i in range(14):
        day = i + 1
        t_col, h_col, r_col = t_cols[i], h_cols[i], r_cols[i]
        t_mean, t_std = df[t_col].mean(), df[t_col].std()
        h_mean, h_std = df[h_col].mean(), df[h_col].std()
        r_mean, r_std = df[r_col].mean(), df[r_col].std()
        if pd.isna(t_std) or t_std == 0: t_std = 1.5
        if pd.isna(h_std) or h_std == 0: h_std = 8.0
        if pd.isna(r_std) or r_std == 0: r_std = 0.5
        row = {
            "day": f"Day {day}",
            "idealTemperature": round(float(t_mean), 1),
            "idealTemperatureUpper": round(float(t_mean + t_std), 1),
            "idealTemperatureLower": round(float(t_mean - t_std), 1),
            "idealHumidity": round(float(h_mean), 1),
            "idealHumidityUpper": round(float(h_mean + h_std), 1),
            "idealHumidityLower": round(float(h_mean - h_std), 1),
            "idealRain": round(max(0, float(r_mean)), 1),
            "idealRainUpper": round(max(0, float(r_mean + r_std)), 1),
            "idealRainLower": round(max(0, float(r_mean - r_std)), 1),
        }
        if has_pressure:
            pr_mean = df[p_cols[i]].mean()
            pr_std = df[p_cols[i]].std()
            if pd.isna(pr_std) or pr_std == 0: pr_std = 100.0
            row["idealPressure"] = round(float(pr_mean), 0)
            row["idealPressureUpper"] = round(float(pr_mean + pr_std), 0)
            row["idealPressureLower"] = round(float(pr_mean - pr_std), 0)
        out.append(row)
    return out


def elevation_distribution(df: pd.DataFrame, bins: int = 15) -> list[dict[str, Any]] | None:
    """
    Return elevation (dem) distribution as histogram: list of { bin_start, bin_end, count }.
    """
    if df is None or "dem" not in df.columns:
        return None
    dem = pd.to_numeric(df["dem"], errors="coerce").dropna()
    if dem.empty:
        return None
    binned = pd.cut(dem, bins=bins)
    vc = binned.value_counts().sort_index()
    out = []
    for iv, count in vc.items():
        out.append({
            "bin_start": round(float(iv.left), 0),
            "bin_end": round(float(iv.right), 0),
            "count": int(count),
        })
    return out


def season_activity(df: pd.DataFrame) -> list[dict[str, Any]] | None:
    """
    Monthly sprouting activity (0–100) from observed_on. Normalize counts to 0–100 scale.
    """
    if df is None or "observed_on" not in df.columns:
        return None
    try:
        df = df.copy()
        df["observed_on"] = pd.to_datetime(df["observed_on"], errors="coerce")
        df = df.dropna(subset=["observed_on"])
        df["month"] = df["observed_on"].dt.month  # 1-12
        counts = df["month"].value_counts().sort_index()
        for m in range(1, 13):
            if m not in counts.index:
                counts[m] = 0
        counts = counts.sort_index()
        max_count = counts.max() or 1
        out = []
        for i, month_name in enumerate(MONTHS):
            m = i + 1
            activity = round(100 * counts.get(m, 0) / max_count)
            out.append({"month": month_name, "activity": int(activity)})
        return out
    except Exception:
        return None


def slope_distribution(df: pd.DataFrame, bins: int = 15) -> list[dict[str, Any]] | None:
    """Slope distribution as histogram: list of { bin_start, bin_end, count }."""
    if df is None or "slope" not in df.columns:
        return None
    slope = pd.to_numeric(df["slope"], errors="coerce").dropna()
    if slope.empty:
        return None
    binned = pd.cut(slope, bins=bins)
    vc = binned.value_counts().sort_index()
    return [
        {"bin_start": round(float(iv.left), 1), "bin_end": round(float(iv.right), 1), "count": int(c)}
        for iv, c in vc.items()
    ]


def aspect_distribution(df: pd.DataFrame, bins: int = 18) -> list[dict[str, Any]] | None:
    """Aspect distribution (0–360°) as histogram: list of { bin_start, bin_end, count }."""
    if df is None or "aspect" not in df.columns:
        return None
    aspect = pd.to_numeric(df["aspect"], errors="coerce").dropna()
    aspect = aspect[(aspect >= 0) & (aspect <= 360)]
    if aspect.empty:
        return None
    binned = pd.cut(aspect, bins=bins)
    vc = binned.value_counts().sort_index()
    return [
        {"bin_start": round(float(iv.left), 0), "bin_end": round(float(iv.right), 0), "count": int(c)}
        for iv, c in vc.items()
    ]


GEOMORPHON_LABELS = {
    1: "flat", 2: "summit", 3: "ridge", 4: "shoulder", 5: "spur",
    6: "slope", 7: "hollow", 8: "footslope", 9: "valley", 10: "pit",
}


def geomorphon_distribution(df: pd.DataFrame) -> list[dict[str, Any]] | None:
    """Geomorphon type distribution: list of { label, count }. Uses geomorphon_class if present else geomorphon code."""
    if df is None:
        return None
    if "geomorphon_class" in df.columns:
        col = df["geomorphon_class"].astype(str).str.strip().replace("", pd.NA).dropna()
    elif "geomorphon" in df.columns:
        col = pd.to_numeric(df["geomorphon"], errors="coerce").dropna()
        col = col.map(lambda x: GEOMORPHON_LABELS.get(int(x), str(int(x))))
    else:
        return None
    if col.empty:
        return None
    vc = col.value_counts()
    return [{"label": str(k), "count": int(v)} for k, v in vc.items()]


def landcover_distribution(df: pd.DataFrame) -> list[dict[str, Any]] | None:
    """Land cover (LC) distribution: list of { code, count }."""
    if df is None or "LC" not in df.columns:
        return None
    lc = pd.to_numeric(df["LC"], errors="coerce").dropna()
    if lc.empty:
        return None
    vc = lc.value_counts().sort_index()
    return [{"code": int(k), "count": int(v)} for k, v in vc.items()]
