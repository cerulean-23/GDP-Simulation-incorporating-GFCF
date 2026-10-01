import * as XLSX from "xlsx";

/**
 * One row per evaluated quarter (index >= first_prediction_index), in display
 * units (e.g. trillion rupiah). Everything is derived from `result` itself,
 * never from the pending form, so labels always match what was computed.
 */
export function buildEvaluationRows(result) {
  const f = result.fred;
  const div = f.dataset.display_divisor;
  const { split_index: split, first_prediction_index: first } = f.metrics;
  const rows = [];
  for (let i = first; i < result.y_actual.length; i++) {
    const actual = result.y_actual[i] / div;
    const predicted = result.y_pred[i] / div;
    const absError = Math.abs(actual - predicted);
    rows.push({
      period: f.period_labels[i],
      date: f.dates[i],
      actual,
      predicted,
      a: result.a_track[i],
      b: result.b_track[i],
      c: result.c_track[i],
      absError,
      apePct: (absError / actual) * 100,
      phase: i < split ? "Fitting" : "Forecast",
    });
  }
  return rows;
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function fileStem(result) {
  return `fred_${result.fred.dataset.id}_quarterly`;
}

/** Same layout as the notebook's Tabel_Error_Prediksi.csv: ';' separator, decimal comma. */
export function downloadFredCsv(result) {
  const dec = (n, d) => n.toFixed(d).replace(".", ",");
  const unit = result.fred.dataset.unit_label;
  const header = [
    "Period", "Date", `Actual (${unit})`, `Predicted (${unit})`, "Param_a", "Param_b", "Param_c",
    `Abs_Error (${unit})`, "APE_pct", "Phase",
  ];
  const lines = buildEvaluationRows(result).map((r) =>
    [
      r.period, r.date, dec(r.actual, 4), dec(r.predicted, 4), dec(r.a, 4),
      r.b.toExponential(2).replace(".", ","), dec(r.c, 4), dec(r.absError, 4), dec(r.apePct, 4), r.phase,
    ].join(";")
  );
  // BOM so Excel opens it as UTF-8
  downloadBlob("\uFEFF" + [header.join(";"), ...lines].join("\r\n"), `${fileStem(result)}.csv`, "text/csv;charset=utf-8");
}

export function downloadFredExcel(result) {
  const f = result.fred;
  const m = f.metrics;
  const ds = f.dataset;
  const div = ds.display_divisor;
  const cfg = f.config;
  const labels = f.period_labels;
  const n = labels.length;

  const summary = [
    ["Quarterly GDP Simulation (FRED) - Summary"],
    [],
    ["Dataset", ds.name],
    ["Source", ds.source],
    ["Series IDs", `${ds.gdp_series} (GDP), ${ds.gfcf_series} (GFCF)`],
    ["Raw unit", ds.raw_unit],
    ["Display unit", ds.unit_label],
    ["Data period", `${labels[0]}-${labels[n - 1]}`],
    ["Observations", n],
    [],
    ["Method", "Rolling-window one-step-ahead forecasting (RK4 + Differential Evolution)"],
    ["Rolling window (quarters)", cfg.window],
    ["First predicted quarter", labels[m.first_prediction_index]],
    ["Phase split ratio", cfg.split_ratio],
    ["Fitting phase", `${labels[m.first_prediction_index]}-${labels[m.split_index - 1]} (${m.fitting.n} quarters)`],
    ["Forecast phase", `${labels[m.split_index]}-${labels[n - 1]} (${m.forecast.n} quarters)`],
    ["Population size", cfg.population_size],
    ["Max iterations", cfg.max_iterations],
    ["Bounds a", cfg.bounds.a.join(" to ")],
    ["Bounds b", cfg.bounds.b.join(" to ")],
    ["Bounds c", cfg.bounds.c.join(" to ")],
    [],
    ["Metric", "Overall", "Fitting phase", "Forecast phase"],
    ["MAPE (%)", m.overall.mape, m.fitting.mape, m.forecast.mape],
    ["Naive baseline MAPE (%)", m.overall.naive_mape, m.fitting.naive_mape, m.forecast.naive_mape],
    [`RMSE (${ds.unit_label})`, m.overall.rmse / div, m.fitting.rmse / div, m.forecast.rmse / div],
    [`MAE (${ds.unit_label})`, m.overall.mae / div, m.fitting.mae / div, m.forecast.mae / div],
    [],
    ["Note", "Fitting and forecast phases partition the same rolling one-step-ahead predictions; they are not separately trained models. Naive baseline = previous quarter's value."],
  ];

  const unit = ds.unit_label;
  const evalRows = [
    ["Period", "Date", `Actual (${unit})`, `Predicted (${unit})`, "Param a", "Param b", "Param c", `Abs error (${unit})`, "APE (%)", "Phase"],
    ...buildEvaluationRows(result).map((r) => [
      r.period, r.date, r.actual, r.predicted, r.a, r.b, r.c, r.absError, r.apePct, r.phase,
    ]),
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), "Summary");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(evalRows), "Evaluation");
  XLSX.writeFile(wb, `${fileStem(result)}.xlsx`);
}
