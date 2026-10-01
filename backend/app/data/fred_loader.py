"""
Bundled FRED datasets for the quarterly Indonesia study.

Unlike the World Bank path (annual, constant USD, fetched live), these are
quarterly real series in LOCAL currency shipped inside the repo, so the FRED
page works with no upload and no outbound API call. Adding a country later
means dropping two CSVs into app/data/fred/ and adding one DATASETS entry.

Raw values stay exactly as FRED publishes them (millions of local currency).
Rescaling for the optimizer happens in the route (see FRED_SCALE), not here.
"""

import copy
from functools import lru_cache
from pathlib import Path

import pandas as pd

FRED_DIR = Path(__file__).parent / "fred"

DATASETS: dict[str, dict] = {
    "IDN": {
        "id": "IDN",
        "name": "Indonesia",
        "currency": "IDR",
        "gdp_file": "IDN_real_gdp.csv",
        "gfcf_file": "IDN_real_gfcf.csv",
        "gdp_series": "NGDPRSAXDCIDQ",
        "gfcf_series": "NFIRSAXDCIDQ",
        "raw_unit": "Millions of Indonesian Rupiah (real)",
        "unit_label": "Trillion Rupiah",
        # raw value / display_divisor = value shown on charts (millions -> trillions)
        "display_divisor": 1_000_000.0,
        "source": "FRED, Federal Reserve Bank of St. Louis",
    }
}

MIN_OBSERVATIONS = 30


def list_datasets() -> list[dict]:
    """Public metadata for every bundled dataset (no data arrays)."""
    out = []
    for ds_id in DATASETS:
        data = load_fred_dataset(ds_id)
        out.append({**data["meta"], "n_obs": len(data["gdp"]),
                    "start": data["period_labels"][0], "end": data["period_labels"][-1]})
    return out


def _read_series(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path)
    if "observation_date" not in df.columns:
        raise ValueError(f"{path.name}: missing 'observation_date' column.")
    value_cols = [c for c in df.columns if c != "observation_date"]
    if len(value_cols) != 1:
        raise ValueError(f"{path.name}: expected exactly one value column, found {len(value_cols)}.")
    df = df.rename(columns={value_cols[0]: "value"})
    df["observation_date"] = pd.to_datetime(df["observation_date"])
    df["value"] = pd.to_numeric(df["value"], errors="coerce")
    return df


def _period_label(ts: pd.Timestamp) -> str:
    return f"{ts.year}Q{(ts.month - 1) // 3 + 1}"


@lru_cache(maxsize=8)
def _load_cached(dataset_id: str) -> dict:
    meta = DATASETS[dataset_id]
    gdp = _read_series(FRED_DIR / meta["gdp_file"]).rename(columns={"value": "gdp"})
    gfcf = _read_series(FRED_DIR / meta["gfcf_file"]).rename(columns={"value": "gfcf"})

    merged = gdp.merge(gfcf, on="observation_date", how="inner")
    merged = merged.dropna(subset=["gdp", "gfcf"]).sort_values("observation_date").reset_index(drop=True)

    if len(merged) < MIN_OBSERVATIONS:
        raise ValueError(f"Dataset '{dataset_id}' has only {len(merged)} usable quarters.")

    # Quarterly sanity: every date is a quarter start and spacing is ~3 months.
    # A silent gap would shift the rolling window across missing quarters.
    if not merged["observation_date"].dt.month.isin([1, 4, 7, 10]).all():
        raise ValueError(f"Dataset '{dataset_id}' has non-quarter-start dates.")
    gaps = merged["observation_date"].diff().dt.days.dropna()
    if gaps.min() < 89 or gaps.max() > 92:
        raise ValueError(f"Dataset '{dataset_id}' has missing or irregular quarters.")

    return {
        "meta": {k: v for k, v in meta.items() if k not in ("gdp_file", "gfcf_file")},
        "dates": merged["observation_date"].dt.strftime("%Y-%m-%d").tolist(),
        "period_labels": [_period_label(d) for d in merged["observation_date"]],
        "gdp": merged["gdp"].astype(float).tolist(),
        "gfcf": merged["gfcf"].astype(float).tolist(),
    }


def load_fred_dataset(dataset_id: str) -> dict:
    """Returns a private copy: {meta, dates, period_labels, gdp, gfcf}. Raises ValueError."""
    if dataset_id not in DATASETS:
        known = ", ".join(DATASETS) or "none"
        raise ValueError(f"Unknown FRED dataset '{dataset_id}'. Available: {known}.")
    return copy.deepcopy(_load_cached(dataset_id))
