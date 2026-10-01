"""
Per-phase evaluation of rolling one-step-ahead predictions.

The "fitting" and "forecast" phases are NOT separately trained models. Every
prediction comes from the same rolling loop (parameters re-estimated on the
trailing window, then one step ahead); the series is only partitioned at
split_index = int(n * split_ratio) for reporting. This mirrors the thesis
notebook exactly, including the naive baseline (previous quarter as forecast).
"""

import numpy as np

from app.model.solow_swan import mae, mape


def split_index_for(n: int, split_ratio: float) -> int:
    # epsilon guards float error (e.g. 0.8 * 35) so int() matches the notebook.
    return int(n * split_ratio + 1e-9)


def _rmse(a: np.ndarray, p: np.ndarray) -> float:
    return float(np.sqrt(np.mean((a - p) ** 2)))


def compute_phase_metrics(y_actual, y_pred, window: int, split_ratio: float) -> dict:
    """
    y_actual: raw-unit actuals, length n. y_pred: raw-unit predictions with
    None before index `window`. Returns plain-float metrics for the whole
    evaluated span, the fitting phase [window, split) and forecast phase
    [split, n), plus the naive baseline on the same spans.
    """
    n = len(y_actual)
    ya = np.asarray(y_actual, dtype=float)
    yp = np.array([np.nan if v is None else v for v in y_pred], dtype=float)
    split = split_index_for(n, split_ratio)

    if not (window < split < n):
        raise ValueError("Split point must fall after the first window and before the last observation.")

    naive = np.full(n, np.nan)
    naive[window:] = ya[window - 1 : n - 1]  # previous quarter

    def block(lo: int, hi: int) -> dict:
        a, p, nv = ya[lo:hi], yp[lo:hi], naive[lo:hi]
        return {
            "n": int(hi - lo),
            "mape": mape(a, p),
            "mae": mae(a, p),
            "rmse": _rmse(a, p),
            "naive_mape": mape(a, nv),
        }

    return {
        "split_index": int(split),
        "split_ratio": float(split_ratio),
        "first_prediction_index": int(window),
        "overall": block(window, n),
        "fitting": block(window, split),
        "forecast": block(split, n),
    }
