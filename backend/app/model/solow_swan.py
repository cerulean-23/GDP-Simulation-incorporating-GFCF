"""
Solow-Swan growth model as a nonlinear ODE, solved with RK4.

Model:
    dY/dt = a*Y - b*Y^2 + c*I

RK4 step interpolates investment at the midpoint of the step
(I_mid = (I_curr + I_next) / 2), matching the reference methodology —
more accurate than treating I as constant across the step.
"""

import numpy as np


def dydt(y: float, i: float, a: float, b: float, c: float) -> float:
    """Right-hand side of the ODE at a single point."""
    return a * y - b * y**2 + c * i


def rk4_step(y: float, i_curr: float, i_next: float, a: float, b: float, c: float, h: float = 1.0) -> float:
    """
    Single RK4 integration step, interpolating investment at the midpoint.
    For one-step-ahead forecasting where the next investment value is
    unknown, pass i_next = i_curr.
    """
    i_mid = (i_curr + i_next) / 2.0
    k1 = dydt(y, i_curr, a, b, c)
    k2 = dydt(y + 0.5 * h * k1, i_mid, a, b, c)
    k3 = dydt(y + 0.5 * h * k2, i_mid, a, b, c)
    k4 = dydt(y + h * k3, i_next, a, b, c)
    return y + (h / 6.0) * (k1 + 2 * k2 + 2 * k3 + k4)


def simulate_window(y0: float, investment_series: np.ndarray, a: float, b: float, c: float, h: float = 1.0) -> np.ndarray:
    """
    Integrate the model forward across a window of investment values.
    y0 is the starting GDP for the window; output has same length as
    investment_series, with y_sim[0] = y0.
    """
    n = len(investment_series)
    y_sim = np.zeros(n)
    y_sim[0] = y0
    for t in range(n - 1):
        y_sim[t + 1] = rk4_step(y_sim[t], investment_series[t], investment_series[t + 1], a, b, c, h)
    return y_sim


def mse(y_actual: np.ndarray, y_pred: np.ndarray) -> float:
    """Mean squared error — used as the DE objective, matches reference notebook."""
    return float(np.mean((y_actual - y_pred) ** 2))


def sse(y_actual: np.ndarray, y_pred: np.ndarray) -> float:
    """Sum of squared errors."""
    return float(np.sum((y_actual - y_pred) ** 2))


def mape(y_actual: np.ndarray, y_pred: np.ndarray) -> float:
    """Mean absolute percentage error, as a percent (e.g. 3.45 for 3.45%)."""
    mask = y_actual != 0
    return float(np.mean(np.abs((y_actual[mask] - y_pred[mask]) / y_actual[mask])) * 100)


def mae(y_actual: np.ndarray, y_pred: np.ndarray) -> float:
    """Mean absolute error."""
    return float(np.mean(np.abs(y_actual - y_pred)))


def r2_score(y_actual: np.ndarray, y_pred: np.ndarray) -> float:
    """R-squared."""
    ss_res = np.sum((y_actual - y_pred) ** 2)
    ss_tot = np.sum((y_actual - np.mean(y_actual)) ** 2)
    if ss_tot == 0:
        return 0.0
    return float(1 - ss_res / ss_tot)
