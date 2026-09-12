"""
Run once (or whenever you want to refresh the seed set) to precompute MAPE
for a curated list of major economies, so the choropleth map opens already
colored instead of blank until a user manually runs something.

Usage (from backend/):
    uv run python scripts/precompute_seed.py

Writes app/data/seed_mape.json, served by GET /api/seed-mape.
Takes a few minutes — each country runs a full rolling-window DE fit.
"""

import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.data.loader import load_country_data
from app.optimization.rolling_de import OptimizationConfig, run_rolling_de

# One representative country per region shown in the mockup legend
# (USA, Europe, Asia, Africa, LATAM, Indonesia, Australia) plus a few
# more major economies. Add/remove freely — more countries = longer run.
SEED_COUNTRIES = [
    ("USA", "United States"),
    ("CHN", "China"),
    ("JPN", "Japan"),
    ("DEU", "Germany"),
    ("GBR", "United Kingdom"),
    ("IND", "India"),
    ("IDN", "Indonesia"),
    ("BRA", "Brazil"),
    ("AUS", "Australia"),
    ("ZAF", "South Africa"),
    ("NGA", "Nigeria"),
    ("MEX", "Mexico"),
    ("FRA", "France"),
    ("CAN", "Canada"),
    ("KOR", "South Korea"),
]

OUTPUT_PATH = Path(__file__).resolve().parent.parent / "app" / "data" / "seed_mape.json"


async def compute_one(iso: str, name: str, start_year: int = 1990, end_year: int = 2020) -> tuple[str, dict] | None:
    try:
        df = await load_country_data(iso, start_year, end_year)
        if df.empty or len(df) < 6:
            print(f"  {iso}: skipped (insufficient clean data)")
            return None

        config = OptimizationConfig(window=3, population_size=20, max_iterations=300)
        result = run_rolling_de(
            df["year"].to_numpy(),
            df["gdp"].to_numpy(dtype=float),
            df["gfcf"].to_numpy(dtype=float),
            config,
        )
        print(f"  {iso}: MAPE {result.mape_overall:.2f}%")
        return iso, {"mape": result.mape_overall, "name": name}
    except Exception as e:
        print(f"  {iso}: failed ({e})")
        return None


async def main():
    print(f"Precomputing seed MAPE for {len(SEED_COUNTRIES)} countries...")
    seed = {}
    for iso, name in SEED_COUNTRIES:
        entry = await compute_one(iso, name)
        if entry:
            seed[entry[0]] = entry[1]

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(seed, indent=2))
    print(f"\nWrote {len(seed)} countries to {OUTPUT_PATH}")


if __name__ == "__main__":
    asyncio.run(main())
