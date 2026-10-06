import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import { computeRmse, computeForecastRange, computeTotalSse, formatSse } from "./metrics";
import { drawLineChart, CHART_COLORS } from "./pdfCharts";
import { computeActualDataRange } from "./metrics";
import { addPdfFooter } from "./pdfFooter";

const NAVY = [10, 15, 30];
const CYAN = [56, 189, 248];
const SLATE = [100, 116, 139];
const TEXT = [30, 41, 59];

/**
 * Builds a text/table-based PDF report mirroring the content of the
 * Model & Metrics page (Page 2) — same result/settings state, no new
 * calculations beyond what's already derived client-side elsewhere
 * (RMSE, forecast range). Charts are drawn as vector graphics straight
 * from the result arrays (see pdfCharts.js) — not DOM screenshots — so they
 * work from either page and stay sharp; tables keep the exact numbers.
 */
export function downloadPdf(result, settings, dataCountry) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = 50;

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

  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;

  // Start a new page if the next block wouldn't fit above the bottom margin.
  function ensureSpace(needed) {
    if (y + needed > pageHeight - 40) {
      doc.addPage();
      y = 50;
    }
  }

  function chart(opts, height) {
    ensureSpace(height + 10);
    drawLineChart(doc, { x: margin, y, w: contentWidth, h: height, ...opts });
    y += height + 12;
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

  function keyValueGrid(rows, colWidth = 250) {
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    rows.forEach(([k, v], i) => {
      const col = i % 2;
      const rowIdx = Math.floor(i / 2);
      const x = margin + col * colWidth;
      const rowY = y + rowIdx * 26;
      doc.setTextColor(...SLATE);
      doc.text(String(k), x, rowY);
      doc.setTextColor(...TEXT);
      doc.setFont("helvetica", "bold");
      doc.text(String(v), x, rowY + 12);
      doc.setFont("helvetica", "normal");
    });
    y += Math.ceil(rows.length / 2) * 26 + 10;
  }

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
  doc.text("RK4 · Differential Evolution · GFCF — Model & Metrics Report", margin, 46);
  y = 90;

  const rmse = computeRmse(result.y_actual, result.y_pred);
  const forecastRange = computeForecastRange(result);

  // --- Model & Simulation Summary ---
  heading("MODEL & SIMULATION SUMMARY");
  keyValueGrid([
    ["Selected Country", dataCountry?.name || dataCountry?.code || "-"],
    ["Currency", "Constant 2015 US$"],
    // ["Data Period", `${settings.startYear}-${settings.endYear}`],
    ["Data Period", computeActualDataRange(result, "-") ?? "-"],
    ["Frequency", "Annual"],
    ["Rolling Window", `w = ${settings.window} years`],
    ["Forecast Evaluation Period", forecastRange],
  ]);

  doc.setFontSize(9.5);
  doc.setTextColor(...TEXT);
  doc.setFont("helvetica", "italic");
  doc.text("dY/dt = aY - bY^2 + cI(t)", margin, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...SLATE);
  [
    "Y(t) = Real GDP",
    "I(t) = Gross Fixed Capital Formation (GFCF)",
    "a = Intrinsic Growth      b = Growth Constraint      c = GFCF Effect",
  ].forEach((line) => {
    doc.text(line, margin, y);
    y += 12;
  });
  y += 10;

  // --- Model Configuration ---
  heading("MODEL CONFIGURATION");
  keyValueGrid([
    ["Numerical Integration", "RK4"],
    ["Step Size", `h = ${settings.stepSize}`],
    ["Optimization", "Differential Evolution"],
    ["Population Size", settings.populationSize],
    ["Max Iterations", settings.maxIterations],
    ["Forecast Method", "Step-Ahead Forecast"],
  ]);

  // --- Performance Summary ---
  heading("PERFORMANCE SUMMARY");
  keyValueGrid([
    ["MAPE", `${result.mape_overall.toFixed(2)}%`],
    ["RMSE", rmse != null ? `${(rmse / 1e9).toFixed(2)}B constant 2015 US$` : "-"],
    ["SSE (total)", computeTotalSse(result) != null ? formatSse(computeTotalSse(result)) : "-"],
    ["R2 (coefficient of determination)", result.r2_overall.toFixed(3)],
  ]);

  // --- Step-Ahead Forecast table ---
  ensureSpace(260);
  heading("GDP STEP-AHEAD FORECAST PERFORMANCE");
  chart(
    {
      title: "Actual GDP vs Step-Ahead Forecast",
      yLabel: "Billions of constant 2015 US$",
      xs: result.years,
      yFormat: (v, step) => {
        const b = v / 1e9;
        const dec = step && step / 1e9 < 1 ? 1 : 0;
        return b.toFixed(dec) + "B";
      },
      series: [
        { name: "Actual GDP", values: result.y_actual, color: CHART_COLORS.blue },
        { name: "Step-Ahead Forecast", values: result.y_pred, color: CHART_COLORS.orange, dashed: true },
      ],
    },
    200
  );
  note(
    "Forecasts are generated using parameters estimated from the preceding rolling window. " +
      "The first " + settings.window + " years have no forecast."
  );
  const forecastBody = result.years.map((year, i) => [
    year,
    (result.y_actual[i] / 1e9).toFixed(2) + "B",
    result.y_pred[i] != null ? (result.y_pred[i] / 1e9).toFixed(2) + "B" : "-",
  ]);
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Year", "Actual GDP", "Step-Ahead Forecast"]],
    body: forecastBody,
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: NAVY, textColor: 255 },
    theme: "striped",
  });
  y = doc.lastAutoTable.finalY + 20;

  // --- Error Analysis ---
  const sseValues = result.sse_per_year.filter((v) => v != null && v > 0);
  if (sseValues.length > 0) {
    // heading + stats grid + chart, kept together on one page
    ensureSpace(275);
    heading("ERROR ANALYSIS — SSE BY YEAR");
    const sorted = [...sseValues].sort((a, b) => a - b);
    const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const minVal = Math.min(...sseValues);
    const maxVal = Math.max(...sseValues);
    const minYear = result.years[result.sse_per_year.indexOf(minVal)];
    const maxYear = result.years[result.sse_per_year.indexOf(maxVal)];
    keyValueGrid([
      ["Mean SSE", formatSse(avg)],
      ["Median SSE", formatSse(median)],
      ["Minimum SSE", `${formatSse(minVal)} (${minYear})`],
      ["Maximum SSE", `${formatSse(maxVal)} (${maxYear})`],
    ]);
    chart(
      {
        title: "SSE by Year",
        yLabel: "Sum of squared errors of each step-ahead forecast" + (maxVal / minVal >= 10 ? " (log scale)" : ""),
        xs: result.years,
        log: maxVal / minVal >= 10,
        series: [{ name: "SSE", values: result.sse_per_year, color: CHART_COLORS.cyan, dots: true }],
      },
      165
    );
  }

  // --- Parameter Estimates ---
  y += 8;
  ensureSpace(160);
  heading("PARAMETER ESTIMATES BY ROLLING WINDOW");
  [
    ["a — Intrinsic Growth", result.a_track, CHART_COLORS.green],
    ["b — Growth Constraint", result.b_track, CHART_COLORS.blue],
    ["c — GFCF Effect", result.c_track, CHART_COLORS.purple],
  ].forEach(([name, values, color]) => {
    chart(
      { title: name, xs: result.years, series: [{ name: "Estimate", values, color, dots: true }] },
      118
    );
  });
  const paramBody = result.years
    .map((year, i) => [year, result.a_track[i], result.b_track[i], result.c_track[i]])
    .filter((row) => row[1] != null)
    .map((row) => [row[0], row[1].toFixed(4), row[2].toFixed(6), row[3].toFixed(4)]);
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Year", "a — Intrinsic Growth", "b — Growth Constraint", "c — GFCF Effect"]],
    body: paramBody,
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: NAVY, textColor: 255 },
    theme: "striped",
  });

  addPdfFooter(doc);
  doc.save(`nonlinear-gdp-simulation-report-${dataCountry?.code || "result"}.pdf`);
}
