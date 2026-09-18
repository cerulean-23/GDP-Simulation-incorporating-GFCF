// Derived purely for display from the same y_actual/y_pred arrays already
// returned by the backend — not a new calculation, just a client-side
// summary reusing existing numbers, masked the same way as the backend's
// own MAPE/R² evaluation (only years with a real step-ahead forecast count).
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
