"""
Data acquisition: World Bank API primary, CSV upload fallback.
Drops any year row with NaN in GDP or GFCF (no imputation, per requirement).
"""

import asyncio
import io
import json
from pathlib import Path

import httpx
import pandas as pd

WORLD_BANK_BASE = "https://api.worldbank.org/v2/country"

ALPHA2_TO_ALPHA3: dict[str, str] = json.loads(
    (Path(__file__).parent / "alpha2_to_alpha3.json").read_text()
)

# NOTE: confirm exact indicator codes before final submission.
# GDP (constant USD): NY.GDP.MKTP.KD
# GFCF (constant USD): NE.GDI.FTOT.KD
GDP_INDICATOR = "NY.GDP.MKTP.KD"
GFCF_INDICATOR = "NE.GDI.FTOT.KD"

# Shared, connection-pooled client instead of opening a fresh TCP+TLS
# connection per request — under any real concurrency, spinning up a new
# httpx.AsyncClient for every single call was hammering the World Bank API
# with dozens of simultaneous fresh handshakes and triggering timeouts.
_client: httpx.AsyncClient | None = None


def _get_client() -> httpx.AsyncClient:
    global _client
    if _client is None:
        _client = httpx.AsyncClient(
            timeout=httpx.Timeout(30.0, connect=10.0),
            limits=httpx.Limits(max_connections=10, max_keepalive_connections=5),
        )
    return _client


async def fetch_worldbank_series(
    country_code: str, indicator: str, start_year: int, end_year: int, retries: int = 3
) -> pd.DataFrame:
    """Fetch one indicator series for a country from the World Bank API. Retries on timeout/5xx."""
    url = f"{WORLD_BANK_BASE}/{country_code}/indicator/{indicator}"
    params = {
        "date": f"{start_year}:{end_year}",
        "format": "json",
        "per_page": 1000,
    }
    client = _get_client()

    last_error: Exception | None = None
    for attempt in range(retries):
        try:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            break
        except (httpx.TimeoutException, httpx.HTTPStatusError) as e:
            last_error = e
            if attempt < retries - 1:
                await asyncio.sleep(1.5 * (attempt + 1))  # backoff: 1.5s, 3s
    else:
        raise last_error

    payload = resp.json()

    if len(payload) < 2 or not payload[1]:
        raise ValueError(f"No data returned for {country_code}/{indicator}")

    records = [{"year": int(row["date"]), "value": row["value"]} for row in payload[1]]
    df = pd.DataFrame(records).sort_values("year").reset_index(drop=True)
    return df


async def load_country_data(country_code: str, start_year: int, end_year: int) -> pd.DataFrame:
    """Fetch GDP + GFCF for a country and merge into one clean dataframe."""
    gdp_df = await fetch_worldbank_series(country_code, GDP_INDICATOR, start_year, end_year)
    gfcf_df = await fetch_worldbank_series(country_code, GFCF_INDICATOR, start_year, end_year)

    merged = gdp_df.rename(columns={"value": "gdp"}).merge(
        gfcf_df.rename(columns={"value": "gfcf"}), on="year", how="inner"
    )
    return clean_data(merged)


def load_csv_fallback(
    gdp_file: bytes,
    gfcf_file: bytes,
    country_code: str,
    start_year: int | None = None,
    end_year: int | None = None,
) -> tuple[pd.DataFrame, str]:
    """
    Parse two World-Bank-format CSVs (GDP and GFCF) uploaded as fallback.
    Handles both a single-country export AND the full multi-country export
    (all ~260 rows) — either way, filters down to the requested country by
    matching its Country Code column (accepts alpha-2 or alpha-3), and to
    the given year range if provided.

    Returns (dataframe, matched_country_name) — the name is whatever the
    CSV itself calls that country, so the caller can confirm/display which
    country actually got matched rather than just echoing back the typed code.
    """
    gdp_raw = pd.read_csv(io.BytesIO(gdp_file), skiprows=4)
    gfcf_raw = pd.read_csv(io.BytesIO(gfcf_file), skiprows=4)

    def find_country_row(df: pd.DataFrame) -> pd.Series:
        code = country_code.strip().upper()
        match = df[df["Country Code"].astype(str).str.upper() == code]
        if match.empty and len(code) == 2:
            # World Bank CSV exports only use alpha-3 codes; if the person
            # typed an alpha-2 code (e.g. "ID"), try translating it.
            alpha3 = ALPHA2_TO_ALPHA3.get(code)
            if alpha3:
                match = df[df["Country Code"].astype(str).str.upper() == alpha3]
        if match.empty:
            # also try matching by name, in case the person typed a name
            match = df[df["Country Name"].astype(str).str.upper() == code]
        if match.empty:
            available = ", ".join(df["Country Code"].dropna().unique()[:10])
            raise ValueError(
                f"Country code '{country_code}' not found in the uploaded file. "
                f"Examples of codes present: {available}, ..."
            )
        return match.iloc[0]

    def to_year_series(df: pd.DataFrame, value_name: str) -> tuple[pd.DataFrame, str]:
        year_cols = [c for c in df.columns if c.strip().isdigit()]
        row = find_country_row(df)
        records = [{"year": int(y), value_name: row[y]} for y in year_cols]
        return pd.DataFrame(records), str(row["Country Name"])

    gdp_series, gdp_name = to_year_series(gdp_raw, "gdp")
    gfcf_series, gfcf_name = to_year_series(gfcf_raw, "gfcf")

    if gdp_name != gfcf_name:
        raise ValueError(
            f"The two files matched different countries for code '{country_code}' — "
            f"GDP file matched '{gdp_name}', GFCF file matched '{gfcf_name}'. "
            f"Make sure both CSVs are for the same country."
        )

    merged = gdp_series.merge(gfcf_series, on="year", how="inner").sort_values("year").reset_index(drop=True)

    if start_year is not None:
        merged = merged[merged["year"] >= start_year]
    if end_year is not None:
        merged = merged[merged["year"] <= end_year]

    return clean_data(merged).reset_index(drop=True), gdp_name


def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """Drop any row (year) with NaN in gdp or gfcf. No imputation, per requirement."""
    return df.dropna(subset=["gdp", "gfcf"]).reset_index(drop=True)
