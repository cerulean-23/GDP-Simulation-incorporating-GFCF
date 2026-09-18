import anyio
import json
import numpy as np
import httpx
from pathlib import Path
from fastapi import APIRouter, File, Form, HTTPException, Response, UploadFile, WebSocket, WebSocketDisconnect

from app.api import session_cache
from app.data.loader import load_country_data, load_csv_fallback
from app.optimization.rolling_de import OptimizationBounds, OptimizationConfig, run_rolling_de

router = APIRouter()

SEED_MAPE_PATH = Path(__file__).resolve().parent.parent / "data" / "seed_mape.json"


@router.get("/api/seed-mape")
async def get_seed_mape(response: Response):
    """
    Precomputed MAPE for a curated set of major economies, so the map opens
    already colored. Empty {} if scripts/precompute_seed.py hasn't been run
    yet — not an error, frontend just falls back to an uncolored map.
    """
    response.headers["Cache-Control"] = "no-store"
    if not SEED_MAPE_PATH.exists():
        return {}
    return json.loads(SEED_MAPE_PATH.read_text())


@router.get("/api/data/{country_code}")
async def get_country_data(country_code: str, start_year: int = 1990, end_year: int = 2020):
    """Primary path: fetch GDP + GFCF from World Bank API."""
    if start_year >= end_year:
        raise HTTPException(400, "start_year must be before end_year.")
    try:
        df = await load_country_data(country_code, start_year, end_year)
    except httpx.HTTPStatusError as e:
        raise HTTPException(502, f"World Bank API request failed: {e.response.status_code}")
    except httpx.RequestError:
        raise HTTPException(502, "Could not reach the World Bank API. Check your internet connection.")
    except ValueError as e:
        raise HTTPException(404, f"No data found for country code '{country_code}': {e}")

    if df.empty:
        raise HTTPException(
            404,
            f"No usable data for '{country_code}' in {start_year}-{end_year} "
            "after removing years with missing GDP/GFCF values.",
        )

    return {
        "years": df["year"].tolist(),
        "gdp": df["gdp"].tolist(),
        "gfcf": df["gfcf"].tolist(),
    }


@router.post("/api/data/upload-fallback")
async def upload_fallback(
    gdp_file: UploadFile = File(...),
    gfcf_file: UploadFile = File(...),
    country_code: str = Form("ID"),
    start_year: int | None = Form(None),
    end_year: int | None = Form(None),
):
    """Fallback: two CSV uploads (single-country or full World Bank export), filtered to country_code + year range."""
    if not gdp_file.filename.lower().endswith(".csv") or not gfcf_file.filename.lower().endswith(".csv"):
        raise HTTPException(400, "Both files must be .csv.")

    gdp_bytes = await gdp_file.read()
    gfcf_bytes = await gfcf_file.read()

    try:
        df, matched_name = load_csv_fallback(gdp_bytes, gfcf_bytes, country_code, start_year, end_year)
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(
            400,
            f"Could not parse the uploaded CSVs — expected the standard World Bank export "
            f"format (4 header rows, then Country Name/Code/Indicator columns, then one "
            f"column per year). Error: {e}",
        )

    if df.empty:
        raise HTTPException(400, "Parsed files but found no overlapping, non-missing GDP/GFCF years.")

    return {
        "years": df["year"].tolist(),
        "gdp": df["gdp"].tolist(),
        "gfcf": df["gfcf"].tolist(),
        "matched_country_name": matched_name,
    }


@router.get("/api/results/{session_id}")
async def get_cached_results(session_id: str):
    """Used when navigating back to Simulation/Metrics page — avoids recompute."""
    cached = session_cache.get(session_id)
    if cached is None:
        return {"cached": False}
    return {"cached": True, "result": cached}


@router.websocket("/ws/simulate/{session_id}")
async def simulate_ws(websocket: WebSocket, session_id: str):
    """
    Live simulation run. Client sends config as JSON on connect, server
    streams progress messages per DE window, then a final "done" message
    with the full result (also written to session cache).
    """
    await websocket.accept()
    try:
        payload = await websocket.receive_json()

        years = np.array(payload["years"])
        gdp = np.array(payload["gdp"], dtype=float)
        gfcf = np.array(payload["gfcf"], dtype=float)

        if len(years) < 4:
            await websocket.send_json({
                "type": "error",
                "message": "Need at least 4 years of data to run a rolling-window simulation.",
            })
            await websocket.close()
            return

        window = payload.get("window", 3)
        if window >= len(years):
            await websocket.send_json({
                "type": "error",
                "message": f"Rolling window ({window}) must be smaller than the number of years ({len(years)}).",
            })
            await websocket.close()
            return

        bounds = OptimizationBounds(
            a=tuple(payload["bounds"]["a"]),
            b=tuple(payload["bounds"]["b"]),
            c=tuple(payload["bounds"]["c"]),
        )
        population_size = payload.get("population_size", 50)

        # Mirrors the frontend's validateSettings() — this is the authoritative
        # check, since the WS payload could come from anywhere, not just our UI.
        PARAM_LIMITS = {"a": (-2, 2), "b": (0, 1), "c": (0, 5)}
        validation_errors = []
        for name, (lo, hi) in [("a", bounds.a), ("b", bounds.b), ("c", bounds.c)]:
            limit_lo, limit_hi = PARAM_LIMITS[name]
            if lo >= hi:
                validation_errors.append(f"Parameter {name}: lower bound must be less than upper bound.")
            if lo < limit_lo or hi > limit_hi:
                validation_errors.append(f"Parameter {name}: must stay within [{limit_lo}, {limit_hi}].")
        if not (5 <= population_size <= 100):
            validation_errors.append("Population size must be between 5 and 100.")

        if validation_errors:
            await websocket.send_json({"type": "error", "message": " ".join(validation_errors)})
            await websocket.close()
            return

        config = OptimizationConfig(
            bounds=bounds,
            population_size=population_size,
            max_iterations=payload.get("max_iterations", 1000),
            window=window,
            step_size=payload.get("step_size", 1.0),
        )

        # run_rolling_de is CPU-bound + sync (scipy DE), so it must run off
        # the event loop or it blocks all other requests / the WS itself.
        # progress_callback fires from that worker thread; anyio.from_thread.run
        # is the correct way to hop back onto the event loop to send_json.
        def on_progress(msg: dict):
            anyio.from_thread.run(websocket.send_json, {"type": "progress", **msg})

        def blocking():
            return run_rolling_de(years, gdp, gfcf, config, progress_callback=on_progress)

        result = await anyio.to_thread.run_sync(blocking)

        result_dict = {
            "years": result.years,
            "y_actual": result.y_actual,
            "y_pred": result.y_pred,
            "a_track": result.a_track,
            "b_track": result.b_track,
            "c_track": result.c_track,
            "sse_per_year": result.sse_per_year,
            "mape_overall": result.mape_overall,
            "mae_overall": result.mae_overall,
            "r2_overall": result.r2_overall,
            "best_sse_final": result.best_sse_final,
        }

        session_cache.set(session_id, result_dict)

        await websocket.send_json({"type": "done", "result": result_dict})

    except WebSocketDisconnect:
        pass
    except Exception as e:
        # Catch-all so a bad payload or numerical failure sends a readable
        # error to the frontend instead of just dropping the connection.
        try:
            await websocket.send_json({"type": "error", "message": f"Simulation failed: {e}"})
        except Exception:
            pass
