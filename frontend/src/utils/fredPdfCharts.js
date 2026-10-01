/**
 * Minimal vector line-chart renderer for the FRED quarterly PDF report.
 * Separate from pdfCharts.js (annual) because it needs things that chart
 * doesn't: category quarter labels, vertical reference lines, and series
 * with gaps drawn as one continuous dashed path per run.
 */

const AXIS = [100, 116, 139];
const GRID = [226, 232, 240];
const TEXT = [30, 41, 59];

export const FRED_CHART_COLORS = {
  blue: [59, 130, 246],
  amber: [202, 138, 4],
  red: [220, 38, 38],
  green: [34, 197, 94],
  purple: [168, 85, 247],
  cyan: [14, 165, 233],
  gray: [100, 116, 139],
};

function niceStep(range, target = 5) {
  const raw = range / target;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const nice = norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10;
  return nice * mag;
}

function linearScale(min, max) {
  if (!(max > min)) {
    const pad = Math.abs(min) * 0.1 || 1;
    min -= pad;
    max += pad;
  }
  const step = niceStep(max - min);
  const lo = Math.floor(min / step + 1e-9) * step;
  const hi = Math.ceil(max / step - 1e-9) * step;
  const ticks = [];
  const count = Math.round((hi - lo) / step);
  for (let k = 0; k <= count; k++) {
    // derive each tick from an integer multiple of step so float drift never
    // leaves e.g. -2.8e-17 where 0 belongs
    const v = Math.round(lo / step + k) * step;
    ticks.push(Math.abs(v) < step * 1e-9 ? 0 : Number(v.toPrecision(12)));
  }
  return { lo, hi, ticks, step };
}

function logScale(min, max) {
  let e0 = Math.floor(Math.log10(min));
  let e1 = Math.ceil(Math.log10(max));
  if (e1 === e0) e1 += 1;
  const ticks = [];
  for (let e = e0; e <= e1; e++) ticks.push(10 ** e);
  return { lo: 10 ** e0, hi: 10 ** e1, ticks, step: null };
}

function defaultFormat(v, step) {
  if (v === 0) return "0";
  const a = Math.abs(v);
  if (a >= 1e6 || a < 1e-3) return v.toExponential(1).replace("e+", "e");
  const dec = step >= 1 ? 0 : Math.min(6, Math.max(0, Math.ceil(-Math.log10(step) - 1e-9)));
  return v.toFixed(dec);
}

function xTickIndices(labels) {
  const years = labels.map((l) => Number(String(l).slice(0, 4)));
  const span = years[years.length - 1] - years[0];
  const want = Math.max(1, Math.ceil(span / 7));
  const stepYears = [1, 2, 5, 10].find((s) => s >= want) ?? 10;
  const idx = [];
  labels.forEach((l, i) => {
    if (String(l).endsWith("Q1") && years[i] % stepYears === 0) idx.push(i);
  });
  return idx;
}

export function drawFredChart(doc, opts) {
  const { x, y, w, h, title, yLabel, labels, series, vlines = [], log = false, yFormat } = opts;
  const n = labels.length;
  const left = 56;
  const right = 10;
  const bottom = 22;
  const hasLegend = series.length > 1;
  const plotTop = y + (title ? 16 : 4) + (hasLegend ? 14 : 0);
  const px = x + left;
  const pw = w - left - right;
  const py = plotTop;
  const ph = y + h - bottom - py;

  // value range over finite (and, for log, positive) points
  const usable = (v) => v != null && Number.isFinite(v) && (!log || v > 0);
  const all = series.flatMap((s) => s.values.filter(usable));
  if (all.length === 0) return;
  const sc = log ? logScale(Math.min(...all), Math.max(...all)) : linearScale(Math.min(...all), Math.max(...all));
  const toY = (v) =>
    log
      ? py + ph - ((Math.log10(v) - Math.log10(sc.lo)) / (Math.log10(sc.hi) - Math.log10(sc.lo))) * ph
      : py + ph - ((v - sc.lo) / (sc.hi - sc.lo)) * ph;
  const toX = (i) => px + (n === 1 ? 0 : (i / (n - 1)) * pw);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT);
  if (title) doc.text(title, x, y + 10);

  // legend
  if (hasLegend) {
    let lx = px;
    const ly = y + (title ? 16 : 4) + 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    series.forEach((s) => {
      doc.setDrawColor(...s.color);
      doc.setLineWidth(1.6);
      doc.setLineDashPattern(s.dashed ? [4, 3] : [], 0);
      doc.line(lx, ly, lx + 16, ly);
      doc.setLineDashPattern([], 0);
      doc.setTextColor(...TEXT);
      doc.text(s.name, lx + 20, ly + 2.5);
      lx += 20 + doc.getTextWidth(s.name) + 14;
    });
  }

  // horizontal grid + y tick labels
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setLineWidth(0.4);
  sc.ticks.forEach((t) => {
    const ty = toY(t);
    doc.setDrawColor(...GRID);
    doc.line(px, ty, px + pw, ty);
    doc.setTextColor(...AXIS);
    const txt = yFormat ? yFormat(t, sc.step) : log ? `1e${Math.round(Math.log10(t))}` : defaultFormat(t, sc.step);
    doc.text(txt, px - 4, ty + 2.5, { align: "right" });
  });

  // x ticks
  xTickIndices(labels).forEach((i) => {
    const tx = toX(i);
    doc.setDrawColor(...GRID);
    doc.line(tx, py, tx, py + ph);
    doc.setTextColor(...AXIS);
    doc.text(String(labels[i]).slice(0, 4), tx, py + ph + 11, { align: "center" });
  });

  // axes
  doc.setDrawColor(...AXIS);
  doc.setLineWidth(0.6);
  doc.line(px, py, px, py + ph);
  doc.line(px, py + ph, px + pw, py + ph);

  if (yLabel) {
    doc.setFontSize(7);
    doc.setTextColor(...AXIS);
    const tw = doc.getTextWidth(yLabel);
    doc.text(yLabel, x + 8, py + ph / 2 + tw / 2, { angle: 90 });
  }

  // reference lines
  vlines.forEach((v) => {
    const vx = toX(v.index);
    doc.setDrawColor(...(v.color || AXIS));
    doc.setLineWidth(0.8);
    doc.setLineDashPattern(v.dotted ? [1, 2] : [4, 3], 0);
    doc.line(vx, py, vx, py + ph);
    doc.setLineDashPattern([], 0);
    doc.setFontSize(6.5);
    doc.setTextColor(...(v.color || AXIS));
    doc.text(v.label, vx + 3, py + 8);
  });

  // series: one continuous path per run of valid points
  series.forEach((s) => {
    doc.setDrawColor(...s.color);
    doc.setFillColor(...s.color);
    doc.setLineWidth(s.lineWidth ?? 1.3);
    doc.setLineDashPattern(s.dashed ? [4, 3] : [], 0);
    let run = [];
    const flush = () => {
      if (run.length >= 2) {
        const [x0, y0] = run[0];
        const segs = run.slice(1).map(([sx, sy], k) => [sx - run[k][0], sy - run[k][1]]);
        doc.lines(segs, x0, y0, [1, 1], "S", false);
      }
      if (s.dots) run.forEach(([dx, dy]) => doc.circle(dx, dy, 1.1, "F"));
      run = [];
    };
    s.values.forEach((v, i) => {
      if (usable(v)) run.push([toX(i), toY(v)]);
      else flush();
    });
    flush();
    doc.setLineDashPattern([], 0);
  });
  doc.setLineWidth(0.5);
}
