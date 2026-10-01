import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import { drawFredChart, FRED_CHART_COLORS as C } from "./fredPdfCharts";
import { buildEvaluationRows } from "./fredExport";
import { addPdfFooter } from "./pdfFooter";

const NAVY = [10, 15, 30];
const CYAN = [56, 189, 248];
const SLATE = [100, 116, 139];
const TEXT = [30, 41, 59];

const pct = (v) => (Number.isFinite(v) ? `${v.toFixed(4)}%` : "-");
const num = (v, d = 3) => (Number.isFinite(v) ? (Math.abs(v) >= 1e6 ? v.toExponential(2) : v.toFixed(d)) : "-");
const sci = (v) => (Number.isFinite(v) ? (v === 0 ? "0" : v.toExponential(2)) : "-");

/**
 * Builds the quarterly (FRED) PDF report. Everything is derived from `result`
 * (never from the pending form) and charts are drawn as vectors, as in the
 * annual report. Returned un-saved so it can be tested; downloadFredPdf saves it.
 */
export function buildFredPdf(result) {
  const f = result.fred;
  const m = f.metrics;
  const ds = f.dataset;
  const cfg = f.config;
  const L = f.period_labels;
  const n = L.length;
  const div = ds.display_divisor;
  const first = m.first_prediction_index;
  const split = m.split_index;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  const bottomLimit = pageHeight - 70; // keeps clear of the disclaimer footer
  let y = 50;

  function ensureSpace(needed) {
    if (y + needed > bottomLimit) {
      doc.addPage();
      y = 50;
    }
  }
  function heading(text) {
    doc.setFontSize(11);
    doc.setTextColor(...CYAN);
    doc.setFont("helvetica", "bold");
    doc.text(text, margin, y);
    y += 8;
    doc.setDrawColor(...SLATE);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 16;
  }
  function note(text) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...SLATE);
    const lines = doc.splitTextToSize(text, contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * 10 + 8;
    doc.setFont("helvetica", "normal");
  }
  function grid(rows, colWidth = 250) {
    doc.setFontSize(9.5);
    rows.forEach(([k, v], i) => {
      const x = margin + (i % 2) * colWidth;
      const rowY = y + Math.floor(i / 2) * 26;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...SLATE);
      doc.text(String(k), x, rowY);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...TEXT);
      doc.text(String(v), x, rowY + 12);
    });
    doc.setFont("helvetica", "normal");
    y += Math.ceil(rows.length / 2) * 26 + 10;
  }
  function chart(opts, height) {
    ensureSpace(height + 10);
    drawFredChart(doc, { x: margin, y, w: contentWidth, h: height, labels: L, ...opts });
    y += height + 12;
  }
  const table = (opts) =>
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin, bottom: 70 },
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: NAVY, textColor: 255 },
      theme: "striped",
      ...opts,
    });

  // --- Title ---
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, 60, "F");
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("NONLINEAR GDP GROWTH SIMULATION", margin, 30);
  doc.setFontSize(9);
  doc.setTextColor(...CYAN);
  doc.setFont("helvetica", "normal");
  doc.text(`RK4 · Differential Evolution · GFCF — Quarterly (FRED) Report`, margin, 46);
  y = 90;

  // --- Summary ---
  heading("MODEL & SIMULATION SUMMARY");
  grid([
    ["Selected Country", ds.name],
    ["Source", ds.source],
    ["Series (GDP / GFCF)", `${ds.gdp_series} / ${ds.gfcf_series}`],
    ["Display Unit", ds.unit_label],
    ["Data Period", `${L[0]}-${L[n - 1]}`],
    ["Frequency", `Quarterly (${n} observations)`],
    ["Rolling Window", `w = ${cfg.window} quarters`],
    ["First Predicted Quarter", L[first]],
    ["Fitting Phase", `${L[first]}-${L[split - 1]} (${m.fitting.n} quarters)`],
    ["Forecast Phase", `${L[split]}-${L[n - 1]} (${m.forecast.n} quarters)`],
  ]);
  doc.setFontSize(9.5);
  doc.setTextColor(...TEXT);
  doc.setFont("helvetica", "italic");
  doc.text("dY/dt = aY - bY^2 + cI(t)", margin, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...SLATE);
  ["Y(t) = Real GDP", "I(t) = Gross Fixed Capital Formation (GFCF)", "a = Intrinsic Growth      b = Growth Constraint      c = GFCF Effect"].forEach(
    (line) => {
      doc.text(line, margin, y);
      y += 12;
    }
  );
  y += 10;

  // --- Configuration ---
  ensureSpace(150);
  heading("MODEL CONFIGURATION");
  grid([
    ["Numerical Integration", "RK4"],
    ["Step Size", `h = ${f.step_size} quarter`],
    ["Optimization", "Differential Evolution"],
    ["Population Size", cfg.population_size],
    ["Max Iterations", cfg.max_iterations],
    ["Forecast Method", "Rolling one-step-ahead"],
    ["Search Range a", `${cfg.bounds.a[0]} to ${cfg.bounds.a[1]}`],
    ["Search Range b", `${cfg.bounds.b[0]} to ${cfg.bounds.b[1]}`],
    ["Search Range c", `${cfg.bounds.c[0]} to ${cfg.bounds.c[1]}`],
    ["Phase Split Ratio", cfg.split_ratio],
  ]);

  // --- Performance ---
  ensureSpace(190);
  heading("PERFORMANCE SUMMARY");
  grid([
    ["MAPE - overall", pct(m.overall.mape)],
    ["Naive baseline MAPE", pct(m.overall.naive_mape)],
    ["MAPE - fitting phase", pct(m.fitting.mape)],
    ["MAPE - forecast phase", pct(m.forecast.mape)],
    ["R2 (overall)", Number.isFinite(result.r2_overall) ? result.r2_overall.toFixed(4) : "-"],
    ["Predicted quarters", m.overall.n],
  ]);
  const span = (b, name, a, z) => [
    `${name} (${a}-${z})`, b.n, pct(b.mape), pct(b.naive_mape), num(b.rmse / div), num(b.mae / div),
  ];
  table({
    head: [["Span", "Quarters", "MAPE", "Naive MAPE", `RMSE (${ds.unit_label})`, `MAE (${ds.unit_label})`]],
    body: [
      span(m.overall, "Overall", L[first], L[n - 1]),
      span(m.fitting, "Fitting phase", L[first], L[split - 1]),
      span(m.forecast, "Forecast phase", L[split], L[n - 1]),
    ],
  });
  y = doc.lastAutoTable.finalY + 10;
  note(
    "MAPE = mean absolute percentage error. The naive baseline forecasts each quarter with the previous quarter's observed value. " +
      "The fitting and forecast phases split the same rolling one-step-ahead predictions at the stated quarter; they are not separately trained models."
  );

  // --- Forecast chart ---
  ensureSpace(290);
  heading("GDP - ACTUAL VS ROLLING FORECAST");
  chart(
    {
      title: "Actual GDP vs Rolling One-Step-Ahead Forecast",
      yLabel: ds.unit_label,
      series: [
        { name: "GDP actual", values: result.y_actual.map((v) => v / div), color: C.blue, dots: true, lineWidth: 1 },
        { name: "Fitting phase", values: result.y_pred.map((v, i) => (v != null && i < split ? v / div : null)), color: C.amber, dashed: true, lineWidth: 2 },
        { name: "Forecast phase", values: result.y_pred.map((v, i) => (v != null && i >= split ? v / div : null)), color: C.red, dashed: true, lineWidth: 2 },
      ],
      vlines: [
        { index: first, label: "Start moving forecast", color: C.gray },
        { index: split, label: "Fit / forecast boundary", color: C.gray, dotted: true },
      ],
    },
    230
  );
  note(
    `Rolling window of ${cfg.window} quarters: each quarter's forecast uses parameters re-estimated on the preceding ${cfg.window} quarters. ` +
      `The first ${first} quarters (${L[0]}-${L[first - 1]}) have no forecast.`
  );

  // --- SSE ---
  const sse = result.sse_per_year.map((v, i) => ({ v, i })).filter((p) => p.v != null && p.v > 0);
  if (sse.length > 0) {
    ensureSpace(290);
    heading("ERROR ANALYSIS - SSE BY QUARTER");
    const sorted = sse.map((p) => p.v).sort((a, b) => a - b);
    const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const mn = sse.reduce((a, b) => (b.v < a.v ? b : a));
    const mx = sse.reduce((a, b) => (b.v > a.v ? b : a));
    const fmt = (v) => (v < 0.001 || v >= 1e6 ? v.toExponential(2) : v.toFixed(3));
    grid([
      ["Mean SSE", fmt(avg)],
      ["Median SSE", fmt(median)],
      ["Minimum SSE", `${fmt(mn.v)} (${L[mn.i]})`],
      ["Maximum SSE", `${fmt(mx.v)} (${L[mx.i]})`],
    ]);
    const logAxis = mx.v / mn.v >= 10;
    chart(
      {
        title: "SSE by Quarter",
        yLabel: logAxis ? "SSE (log scale)" : "SSE",
        log: logAxis,
        series: [{ name: "SSE", values: result.sse_per_year, color: C.cyan, dots: true, lineWidth: 1 }],
      },
      165
    );
    note(
      "SSE of each step-ahead forecast = (actual - forecast)^2, computed on data scaled by " +
        `${f.scale}${f.scale === div ? ` (i.e. squared ${ds.unit_label})` : ""}.`
    );
  }

  // --- Parameters ---
  ensureSpace(160);
  heading("PARAMETER ESTIMATES BY ROLLING WINDOW");
  [
    ["a - Intrinsic Growth", result.a_track, C.green],
    ["b - Growth Constraint", result.b_track, C.blue],
    ["c - GFCF Effect", result.c_track, C.purple],
  ].forEach(([name, values, color]) => {
    chart({ title: name, series: [{ name: "Estimate", values, color, dots: true, lineWidth: 1 }] }, 118);
  });

  // --- Evaluation table ---
  const rows = buildEvaluationRows(result);
  ensureSpace(80);
  heading(`EVALUATION TABLE (${rows.length} QUARTERS, ${ds.unit_label})`);
  table({
    head: [["Period", "Actual", "Predicted", "a", "b", "c", "Abs. error", "APE (%)", "Phase"]],
    body: rows.map((r) => [
      r.period, num(r.actual, 2), num(r.predicted, 2), num(r.a, 4), sci(r.b), num(r.c, 4),
      num(r.absError, 2), num(r.apePct, 4), r.phase,
    ]),
    styles: { fontSize: 7.5, cellPadding: 3 },
  });

  addPdfFooter(doc);
  return doc;
}

export function downloadFredPdf(result) {
  buildFredPdf(result).save(`fred_${result.fred.dataset.id}_quarterly_report.pdf`);
}
