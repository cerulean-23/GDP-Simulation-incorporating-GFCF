"""
Rolling-window Differential Evolution calibration — one-step-ahead forecasting.

For each year t (starting at `window`), take the trailing window of
`window` years [t-window : t], fit (a, b, c) via DE minimizing MSE
between actual and RK4-simulated Y across that window, then use those
parameters to forecast year t itself (one step ahead), holding
investment constant at its last known value since I[t] is what we're
implicitly forecasting alongside.

This matches the reference methodology exactly — years before the
first full window have no prediction (NaN / null), which is expected
and shown as a gap in the chart.
"""

from collections.abc import Callable
from dataclasses import dataclass, field

import numpy as np
from scipy.optimize import differential_evolution

from app.model.solow_swan import mae, mape, mse, r2_score, rk4_step, simulate_window


@dataclass
class OptimizationBounds:
    # Defaults match the validated notebook methodology.
    # UI may expose these as configurable, but these are the sane defaults —
    # do not default to (0.01, 0.99) for all three, that was wrong.
    a: tuple[float, float] = (-0.5, 0.5)
    b: tuple[float, float] = (1e-9, 0.1)
    c: tuple[float, float] = (0.0, 1.0)


@dataclass
class OptimizationConfig:
    bounds: OptimizationBounds = field(default_factory=OptimizationBounds)
    population_size: int = 20  # DE popsize (per-parameter multiplier, scipy convention)
    max_iterations: int = 1000
    window: int = 3
    step_size: float = 1.0
    scale: float = 1_000_000_000.0  # rescale raw USD to billions for numerical stability


@dataclass
class SimulationResult:
    years: list[int]
    y_actual: list[float]
    y_pred: list[float | None]
    a_track: list[float | None]
    b_track: list[float | None]
    c_track: list[float | None]
    sse_per_year: list[float | None]
    mape_overall: float
    mae_overall: float
    r2_overall: float
    best_sse_final: float


def _objective(params: np.ndarray, y_win: np.ndarray, i_win: np.ndarray) -> float:
    a, b, c = params
    if b < 0:
        return np.inf
    with np.errstate(over="raise", invalid="raise"):
        try:
            y_sim = simulate_window(y_win[0], i_win, a, b, c)
        except FloatingPointError:
            # unstable parameter combo blew up the trajectory — reject it
            return np.inf
    if np.any(np.isnan(y_sim)) or np.any(np.isinf(y_sim)) or np.any(np.abs(y_sim) > 1e6):
        return np.inf
    return mse(y_win, y_sim)


def run_rolling_de(
    years: np.ndarray,
    y_actual_raw: np.ndarray,
    investment_raw: np.ndarray,
    config: OptimizationConfig,
    progress_callback: Callable[[dict], None] | None = None,
) -> SimulationResult:
    """
    Run rolling-window one-step-ahead DE calibration across the full series.

    progress_callback, if given, is called after each window with
    {"window": i, "total_windows": n, "year": 2003, "sse": 0.03, "percent": 12.5}
    so the caller can stream it over a WebSocket.
    """
    n = len(years)
    w = config.window
    bounds = [config.bounds.a, config.bounds.b, config.bounds.c]

    # scale for numerical stability, matching reference notebook (billions USD)
    y_data = y_actual_raw / config.scale
    i_data = investment_raw / config.scale

    y_pred = [None] * n
    a_track: list[float | None] = [None] * n
    b_track: list[float | None] = [None] * n
    c_track: list[float | None] = [None] * n
    sse_per_year: list[float | None] = [None] * n

    total_windows = max(n - w, 0)

    for idx, t in enumerate(range(w, n)):
        y_win = y_data[t - w : t]
        i_win = i_data[t - w : t]

        result = differential_evolution(
            _objective,
            bounds=bounds,
            args=(y_win, i_win),
            strategy="best1bin",
            popsize=config.population_size,
            maxiter=config.max_iterations,
            tol=1e-5,
            seed=42,
        )
        a, b, c = result.x
        a_track[t] = float(a)
        b_track[t] = float(b)
        c_track[t] = float(c)

        # one-step-ahead forecast for year t: hold investment constant
        # at its last known window value (i_win[-1]) since we don't
        # know I[t] in a true forecasting setting
        y_forecast = rk4_step(y_win[-1], i_win[-1], i_win[-1], a, b, c, config.step_size)
        y_pred[t] = float(y_forecast * config.scale)
        # keep SSE in the scaled (billions) unit space to match the chart's
        # 10^-3 .. 10^0 log-scale range — do NOT multiply back by scale^2 here
        sse_per_year[t] = float((y_win[-1] - y_forecast) ** 2)

        if progress_callback:
            progress_callback({
                "window": idx + 1,
                "total_windows": total_windows,
                "year": int(years[t]),
                "sse": sse_per_year[t],
                "percent": round((idx + 1) / total_windows * 100, 1) if total_windows else 100.0,
            })

    # evaluation set: only years with a real one-step-ahead prediction
    eval_actual = np.array([y_actual_raw[t] for t in range(n) if y_pred[t] is not None])
    eval_pred = np.array([y_pred[t] for t in range(n) if y_pred[t] is not None])

    if len(eval_actual) > 0:
        mape_overall = mape(eval_actual, eval_pred)
        mae_overall = mae(eval_actual, eval_pred)
        r2_overall = r2_score(eval_actual, eval_pred)
        best_sse_final = min(v for v in sse_per_year if v is not None)
    else:
        mape_overall = mae_overall = r2_overall = best_sse_final = 0.0

    return SimulationResult(
        years=years.tolist(),
        y_actual=y_actual_raw.tolist(),
        y_pred=y_pred,
        a_track=a_track,
        b_track=b_track,
        c_track=c_track,
        sse_per_year=sse_per_year,
        mape_overall=mape_overall,
        mae_overall=mae_overall,
        r2_overall=r2_overall,
        best_sse_final=best_sse_final,
    )
