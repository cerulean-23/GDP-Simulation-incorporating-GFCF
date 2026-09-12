"""
Data acquisition: World Bank API primary, CSV upload fallback.
Drops any year row with NaN in GDP or GFCF (no imputation, per requirement).
"""

import io

import httpx
import pandas as pd

WORLD_BANK_BASE = "https://api.worldbank.org/v2/country"

# NOTE: confirm exact indicator codes before final submission.
# GDP (constant USD): NY.GDP.MKTP.KD
# GFCF (constant USD): NE.GDI.FTOT.KD
GDP_INDICATOR = "NY.GDP.MKTP.KD"
GFCF_INDICATOR = "NE.GDI.FTOT.KD"


async def fetch_worldbank_series(country_code: str, indicator: str, start_year: int, end_year: int) -> pd.DataFrame:
    """Fetch one indicator series for a country from the World Bank API."""
    url = f"{WORLD_BANK_BASE}/{country_code}/indicator/{indicator}"
    params = {
        "date": f"{start_year}:{end_year}",
        "format": "json",
        "per_page": 1000,
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
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


def load_csv_fallback(gdp_file: bytes, gfcf_file: bytes) -> pd.DataFrame:
    """
    Parse two separate World-Bank-format CSVs (GDP and GFCF) uploaded as fallback.
    Expects the standard World Bank CSV export shape (Country Name, Country Code,
    Indicator Name, Indicator Code, then one column per year).
    """
    gdp_raw = pd.read_csv(io.BytesIO(gdp_file), skiprows=4)
    gfcf_raw = pd.read_csv(io.BytesIO(gfcf_file), skiprows=4)

    def to_year_series(df: pd.DataFrame, value_name: str) -> pd.DataFrame:
        year_cols = [c for c in df.columns if c.strip().isdigit()]
        row = df.iloc[0]
        records = [{"year": int(y), value_name: row[y]} for y in year_cols]
        return pd.DataFrame(records)

    gdp_series = to_year_series(gdp_raw, "gdp")
    gfcf_series = to_year_series(gfcf_raw, "gfcf")

    merged = gdp_series.merge(gfcf_series, on="year", how="inner").sort_values("year").reset_index(drop=True)
    return clean_data(merged)


def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """Drop any row (year) with NaN in gdp or gfcf. No imputation, per requirement."""
    return df.dropna(subset=["gdp", "gfcf"]).reset_index(drop=True)
