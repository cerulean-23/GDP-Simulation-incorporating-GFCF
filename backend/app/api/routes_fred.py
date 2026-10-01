"""
FRED quarterly page — separate methodology from the annual World Bank flow.

Endpoints:
  GET /api/fred/datasets          bundled datasets + default config + limits
  GET /api/fred/data/{dataset_id} the quarterly series itself
  WS  /ws/fred/{session_id}       run the rolling one-step-ahead simulation

The WebSocket takes a dataset id, NOT the data: the series is bundled
server-side, so the client cannot send mismatched or tampered data.
Core math (solow_swan.py / rolling_de.py) is reused untouched.
"""

import math

import anyio
import numpy as np
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect

from app.api import session_cache
from app.data.fred_loader import list_datasets, load_fred_dataset
from app.model.phase_metrics import compute_phase_metrics, split_index_for
from app.optimization.rolling_de import OptimizationBounds, OptimizationConfig, run_rolling_de

fred_router = APIRouter()

# Raw FRED values are millions of local currency; /1e6 -> trillions, the same
# scale the thesis notebook optimizes in. Server-fixed (not user-editable).
FRED_SCALE = 1_000_000.0
# One quarter per RK4 step; fixed (see note in the verification report).
FRED_STEP_SIZE = 1.0

FRED_DEFAULTS = {
    "dataset_id": "IDN",
    "bounds": {"a": [-0.5, 0.5], "b": [1e-9, 0.1], "c": [0.0, 1.0]},
    "population_size": 20,
    "max_iterations": 1000,
    "window": 20,
    "split_ratio": 0.8,
}

FRED_LIMITS = {
    "param_bounds": {"a": [-2, 2], "b": [0, 1], "c": [0, 5]},
    "population_size": [5, 100],
    "max_iterations": [1, 5000],
    "window_min": 4,
    "min_phase_points": 5,
    "split_ratio": [0.5, 0.95],
}


@fred_router.get("/api/fred/datasets")
async def get_fred_datasets():
    try:
        datasets = list_datasets()
    except ValueError as e:
        raise HTTPException(500, f"Bundled FRED data is invalid: {e}")
    return {"datasets": datasets, "defaults": FRED_DEFAULTS, "limits": FRED_LIMITS, "scale": FRED_SCALE}


@fred_router.get("/api/fred/data/{dataset_id}")
async def get_fred_data(dataset_id: str):
    try:
        return load_fred_dataset(dataset_id)
    except ValueError as e:
        raise HTTPException(404, str(e))


def _is_num(x) -> bool:
    return isinstance(x, (int, float)) and not isinstance(x, bool) and math.isfinite(x)


def _is_int(x) -> bool:
    return isinstance(x, int) and not isinstance(x, bool)


def _parse_config(payload: dict, n_obs: int) -> tuple[dict, list[str]]:
    """Merge payload over defaults and validate. Authoritative server-side check
    (mirrors what the page's UI will enforce — the WS can be called directly)."""
    errors: list[str] = []
    cfg = {
        "bounds": {k: list(v) for k, v in FRED_DEFAULTS["bounds"].items()},
        "population_size": FRED_DEFAULTS["population_size"],
        "max_iterations": FRED_DEFAULTS["max_iterations"],
        "window": FRED_DEFAULTS["window"],
        "split_ratio": FRED_DEFAULTS["split_ratio"],
    }

    if "bounds" in payload:
        b = payload["bounds"]
        if not isinstance(b, dict):
            errors.append("bounds must be an object with keys a, b, c.")
        else:
            for name in ("a", "b", "c"):
                pair = b.get(name, cfg["bounds"][name])
                if not (isinstance(pair, (list, tuple)) and len(pair) == 2 and all(_is_num(v) for v in pair)):
                    errors.append(f"Parameter {name}: bounds must be [lower, upper] numbers.")
                    continue
                lo, hi = float(pair[0]), float(pair[1])
                lim_lo, lim_hi = FRED_LIMITS["param_bounds"][name]
                if lo >= hi:
                    errors.append(f"Parameter {name}: lower bound must be less than upper bound.")
                if lo < lim_lo or hi > lim_hi:
                    errors.append(f"Parameter {name}: must stay within [{lim_lo}, {lim_hi}].")
                cfg["bounds"][name] = [lo, hi]

    for key, label in (("population_size", "Population size"), ("max_iterations", "Max iterations"), ("window", "Rolling window")):
        if key in payload:
            if not _is_int(payload[key]):
                errors.append(f"{label} must be a whole number.")
            else:
                cfg[key] = payload[key]

    if "split_ratio" in payload:
        if not _is_num(payload["split_ratio"]):
            errors.append("Split ratio must be a number.")
        else:
            cfg["split_ratio"] = float(payload["split_ratio"])

    lo, hi = FRED_LIMITS["population_size"]
    if not (lo <= cfg["population_size"] <= hi):
        errors.append(f"Population size must be between {lo} and {hi}.")
    lo, hi = FRED_LIMITS["max_iterations"]
    if not (lo <= cfg["max_iterations"] <= hi):
        errors.append(f"Max iterations must be between {lo} and {hi}.")
    lo, hi = FRED_LIMITS["split_ratio"]
    if not (lo <= cfg["split_ratio"] <= hi):
        errors.append(f"Split ratio must be between {lo} and {hi}.")

    if not errors:
        split = split_index_for(n_obs, cfg["split_ratio"])
        k = FRED_LIMITS["min_phase_points"]
        w_max = split - k
        if cfg["window"] < FRED_LIMITS["window_min"] or cfg["window"] > w_max:
            errors.append(
                f"Rolling window must be between {FRED_LIMITS['window_min']} and {w_max} quarters "
                f"for {n_obs} observations at a {cfg['split_ratio']:.0%} split."
            )
        elif n_obs - split < k:
            errors.append("Forecast phase would have fewer than 5 quarters; lower the split ratio.")

    return cfg, errors


@fred_router.websocket("/ws/fred/{session_id}")
async def simulate_fred_ws(websocket: WebSocket, session_id: str):
    await websocket.accept()

    async def fail(message: str):
        await websocket.send_json({"type": "error", "message": message})
        await websocket.close()

    try:
        payload = await websocket.receive_json()
        if not isinstance(payload, dict):
            return await fail("Request must be a JSON object.")

        dataset_id = payload.get("dataset_id", FRED_DEFAULTS["dataset_id"])
        if not isinstance(dataset_id, str):
            return await fail("dataset_id must be a string.")
        try:
            data = load_fred_dataset(dataset_id)
        except ValueError as e:
            return await fail(str(e))

        n = len(data["gdp"])
        cfg, errors = _parse_config(payload, n)
        if errors:
            return await fail(" ".join(errors))

        config = OptimizationConfig(
            bounds=OptimizationBounds(
                a=tuple(cfg["bounds"]["a"]), b=tuple(cfg["bounds"]["b"]), c=tuple(cfg["bounds"]["c"])
            ),
            population_size=cfg["population_size"],
            max_iterations=cfg["max_iterations"],
            window=cfg["window"],
            step_size=FRED_STEP_SIZE,
            scale=FRED_SCALE,
        )

        # rolling_de reports an integer position as "year"; with years = 0..n-1
        # that is the observation index, which we translate to a quarter label.
        index_axis = np.arange(n)
        gdp = np.array(data["gdp"], dtype=float)
        gfcf = np.array(data["gfcf"], dtype=float)
        labels = data["period_labels"]

        def on_progress(msg: dict):
            idx = msg["year"]
            anyio.from_thread.run(
                websocket.send_json,
                {"type": "progress", **msg, "period": labels[idx]},
            )

        def blocking():
            return run_rolling_de(index_axis, gdp, gfcf, config, progress_callback=on_progress)

        result = await anyio.to_thread.run_sync(blocking)

        metrics = compute_phase_metrics(result.y_actual, result.y_pred, cfg["window"], cfg["split_ratio"])

        result_dict = {
            "years": result.years,  # observation index 0..n-1; labels live in `fred`
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
            "fred": {
                "dataset": data["meta"],
                "period_labels": labels,
                "dates": data["dates"],
                "config": cfg,
                "scale": FRED_SCALE,
                "step_size": FRED_STEP_SIZE,
                "metrics": metrics,
            },
        }

        session_cache.set(f"fred:{session_id}", result_dict)
        await websocket.send_json({"type": "done", "result": result_dict})

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({"type": "error", "message": f"Simulation failed: {e}"})
        except Exception:
            pass
