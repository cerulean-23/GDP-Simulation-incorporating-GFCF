"""
Run once (or whenever you want to refresh the seed set) to precompute MAPE
for every country with World Bank data, so the choropleth map opens already
colored instead of blank until a user manually runs something.

Usage (from backend/):
    uv run python scripts/precompute_seed.py

Writes app/data/seed_mape.json, served by GET /api/seed-mape.

This runs ~230 countries. Many won't have usable data (too small, missing
GFCF series, etc.) and get skipped automatically. Data fetching is
concurrent (bounded) since it's mostly waiting on the World Bank API; the
DE fit itself is CPU-bound and runs in a thread pool so multiple countries'
optimizations can overlap on multi-core machines. Still expect this to take
a while — tens of minutes is normal for the full list. Safe to Ctrl+C and
rerun; it just overwrites the output file with whatever completed.
"""

import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.data.loader import load_country_data
from app.optimization.rolling_de import OptimizationConfig, run_rolling_de

COUNTRIES_PATH = Path(__file__).resolve().parent.parent / "app" / "data" / "all_countries.json"
OUTPUT_PATH = Path(__file__).resolve().parent.parent / "app" / "data" / "seed_mape.json"

# Bound concurrency so we don't hammer the World Bank API or pin every CPU
# core at once — tune down if your connection or machine struggles.
FETCH_CONCURRENCY = 4
COMPUTE_CONCURRENCY = 4

fetch_semaphore = asyncio.Semaphore(FETCH_CONCURRENCY)
compute_semaphore = asyncio.Semaphore(COMPUTE_CONCURRENCY)


async def compute_one(iso: str, name: str, start_year: int = 1990, end_year: int = 2020) -> tuple[str, dict] | None:
    try:
        async with fetch_semaphore:
            df = await load_country_data(iso, start_year, end_year)

        if df.empty or len(df) < 6:
            print(f"  {iso}: skipped (insufficient clean data)")
            return None

        config = OptimizationConfig(window=3, population_size=20, max_iterations=300)

        def blocking():
            return run_rolling_de(
                df["year"].to_numpy(),
                df["gdp"].to_numpy(dtype=float),
                df["gfcf"].to_numpy(dtype=float),
                config,
            )

        async with compute_semaphore:
            result = await asyncio.to_thread(blocking)

        print(f"  {iso}: MAPE {result.mape_overall:.2f}%")
        return iso, {"mape": result.mape_overall, "name": name}
    except Exception as e:
        print(f"  {iso}: failed ({type(e).__name__}: {e})")
        return None


async def main():
    countries = json.loads(COUNTRIES_PATH.read_text())

    # Resume mode: skip countries already in the output file, only retry
    # what's missing. Merges into the existing file instead of overwriting,
    # so a partial/interrupted run (or one that hit rate limits) can just
    # be rerun to fill in the gaps.
    existing = {}
    if OUTPUT_PATH.exists():
        existing = json.loads(OUTPUT_PATH.read_text())
        print(f"Found existing seed file with {len(existing)} countries — will only retry the rest.\n")

    remaining = {iso: name for iso, name in countries.items() if iso not in existing}

    if not remaining:
        print("All countries already computed — nothing to do.")
        return

    print(f"Computing {len(remaining)} remaining countries (of {len(countries)} total)...")
    print(f"(fetch concurrency={FETCH_CONCURRENCY}, compute concurrency={COMPUTE_CONCURRENCY})\n")

    tasks = [compute_one(iso, name) for iso, name in remaining.items()]
    results = await asyncio.gather(*tasks)

    seed = dict(existing)
    for r in results:
        if r:
            iso, entry = r
            seed[iso] = entry

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(seed, indent=2))
    still_missing = [iso for iso in countries if iso not in seed]
    print(f"\nWrote {len(seed)}/{len(countries)} countries to {OUTPUT_PATH}")
    if still_missing:
        print(f"Still missing ({len(still_missing)}): {', '.join(still_missing)}")
        print("Rerun this script again to retry just these.")


if __name__ == "__main__":
    asyncio.run(main())
