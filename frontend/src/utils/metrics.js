// Derived purely for display from the same y_actual/y_pred arrays already
// returned by the backend — not a new calculation, just a client-side
// summary reusing existing numbers, masked the same way as the backend's
// own MAPE/R² evaluation (only years with a real step-ahead forecast count).
/**
 * Actual span of years present in the LOADED data, not the requested input.
 * Accepts a SimulationResult, a rawData object, or a plain years array.
 * Returns null when nothing is loaded so callers can render a placeholder
 * instead of falling back to the raw typed range.
 */
export function computeActualDataRange(source, separator = "–") {
  const years = Array.isArray(source) ? source : source?.years;
  if (!Array.isArray(years) || years.length === 0) return null;
  return `${years[0]}${separator}${years[years.length - 1]}`;
}

export function computeRmse(yActual, yPred) {
  const diffs = [];
  for (let i = 0; i < yActual.length; i++) {
    if (yPred[i] != null) diffs.push((yActual[i] - yPred[i]) ** 2);
  }
  if (diffs.length === 0) return null;
  const meanSq = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  return Math.sqrt(meanSq);
}

export function computeForecastRange(result) {
  const forecastYears = result.years.filter((_, i) => result.y_pred[i] != null);
  if (forecastYears.length === 0) return "—";
  return `${forecastYears[0]}–${forecastYears[forecastYears.length - 1]}`;
}

export function formatGdp(v) {
  return `${(v / 1e9).toFixed(2)}B`;
}

/**
 * Formats an SSE value for display. Per-year SSE now spans many orders of
 * magnitude (tiny for well-forecast quarters, large for shocks), so plain
 * toFixed(3) would show "0.000" for small values.
 */
export function formatSse(v) {
  if (v == null || !Number.isFinite(v)) return "—";
  if (v === 0) return "0";
  const a = Math.abs(v);
  if (a < 0.001 || a >= 1e6) return v.toExponential(2);
  return v.toFixed(3);
}

/**
 * Total SSE: the sum of the per-period squared one-step-ahead forecast errors
 * (sse_per_year, in the backend's scaled units). Returns null when there are
 * no predictions yet.
 */
export function computeTotalSse(result) {
  const vals = (result?.sse_per_year ?? []).filter((v) => v != null && Number.isFinite(v));
  return vals.length ? vals.reduce((a, b) => a + b, 0) : null;
}
