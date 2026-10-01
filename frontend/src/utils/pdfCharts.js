// Draws simple, crisp vector line charts directly into a jsPDF document
// from the same result arrays the on-screen charts use. Deliberately not a
// screenshot of the DOM: the Page 2 charts don't exist in the DOM while the
// user is on Page 1, and vector output stays sharp when zoomed/printed.

const GRID = [226, 232, 240];
const AXIS = [100, 116, 139];
const LABEL = [71, 85, 105];
const FRAME = [203, 213, 225];

export const CHART_COLORS = {
  blue: [59, 130, 246],
  orange: [249, 115, 22],
  green: [34, 197, 94],
  purple: [168, 85, 247],
  cyan: [14, 165, 233],
};

function niceLinearTicks(min, max, target = 5) {
  if (!isFinite(min) || !isFinite(max)) return { ticks: [0, 1], step: 1 };
  if (min === max) {
    const pad = Math.abs(min) * 0.1 || 1;
    min -= pad;
    max += pad;
  }
  const rawStep = (max - min) / target;
  const mag = 10 ** Math.floor(Math.log10(rawStep));
  const norm = rawStep / mag;
  const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
  const start = Math.floor(min / step) * step;
  const ticks = [];
  for (let v = start; v <= max + step * 1e-6; v += step) ticks.push(Number(v.toPrecision(12)));
  if (ticks[ticks.length - 1] < max) ticks.push(Number((ticks[ticks.length - 1] + step).toPrecision(12)));
  return { ticks, step };
}

function logTicks(min, max) {
  let lo = Math.floor(Math.log10(min));
  let hi = Math.ceil(Math.log10(max));
  if (hi === lo) hi = lo + 1;
  const ticks = [];
  for (let k = lo; k <= hi; k++) ticks.push(10 ** k);
  return { ticks, step: null };
}

function defaultFormat(v, step) {
  if (v === 0) return "0";
  if (step && step < 1e-4) return v.toExponential(1);
  const decimals = step ? Math.min(6, Math.max(0, -Math.floor(Math.log10(step)))) : 2;
  return v.toFixed(decimals);
}

function logFormat(v) {
  const k = Math.round(Math.log10(v));
  if (k >= 5 || k <= -4) return `1e${k}`;
  return k >= 0 ? String(10 ** k) : (10 ** k).toFixed(-k);
}

/**
 * @param {jsPDF} doc
 * @param {object} o
 * @param {number} o.x,y,w,h  outer box in pt
 * @param {string} o.title
 * @param {number[]} o.xs     x values (years)
 * @param {{name:string, values:(number|null)[], color:number[], dashed?:boolean, dots?:boolean}[]} o.series
 * @param {(v:number, step:number|null)=>string} [o.yFormat]
 * @param {boolean} [o.log]   log10 y-axis (values <= 0 are skipped)
 * @param {string} [o.yLabel] small unit note under the title
 */
export function drawLineChart(doc, o) {
  const { x, y, w, h, title, xs, series, yFormat, log = false, yLabel } = o;
  const leftPad = 48;
  const rightPad = 12;
  const topPad = 30;
  const bottomPad = 20;
  const px = x + leftPad;
  const py = y + topPad;
  const pw = w - leftPad - rightPad;
  const ph = h - topPad - bottomPad;

  // Collect finite (and, for log, positive) values to derive the y-domain
  const all = series.flatMap((s) => s.values).filter((v) => v != null && isFinite(v) && (!log || v > 0));
  const dMin = all.length ? Math.min(...all) : 0;
  const dMax = all.length ? Math.max(...all) : 1;
  const { ticks, step } = log ? logTicks(dMin, dMax) : niceLinearTicks(dMin, dMax);
  const yMin = ticks[0];
  const yMax = ticks[ticks.length - 1];
  const toY = (v) => {
    const t = log ? (Math.log10(v) - Math.log10(yMin)) / (Math.log10(yMax) - Math.log10(yMin))
                  : (v - yMin) / (yMax - yMin);
    return py + ph - t * ph;
  };
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const toX = (xv) => px + (xMax === xMin ? 0.5 : (xv - xMin) / (xMax - xMin)) * pw;

  // Frame + title
  doc.setDrawColor(...FRAME);
  doc.setLineWidth(0.5);
  doc.roundedRect(x, y, w, h, 3, 3, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(title, x + 10, y + 15);
  if (yLabel) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...AXIS);
    doc.text(yLabel, x + 10, y + 25);
  }

  // Legend (top-right)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  let lx = x + w - 10;
  [...series].reverse().forEach((s) => {
    const tw = doc.getTextWidth(s.name);
    lx -= tw;
    doc.setTextColor(...LABEL);
    doc.text(s.name, lx, y + 15);
    lx -= 22;
    doc.setDrawColor(...s.color);
    doc.setLineWidth(1.4);
    if (s.dashed) doc.setLineDashPattern([3, 2], 0);
    doc.line(lx, y + 12.5, lx + 16, y + 12.5);
    doc.setLineDashPattern([], 0);
    lx -= 12;
  });

  // Horizontal grid + y tick labels
  doc.setFontSize(7);
  ticks.forEach((t) => {
    const ty = toY(t);
    doc.setDrawColor(...GRID);
    doc.setLineWidth(0.4);
    doc.line(px, ty, px + pw, ty);
    doc.setTextColor(...AXIS);
    const label = yFormat ? yFormat(t, step) : log ? logFormat(t) : defaultFormat(t, step);
    doc.text(label, px - 4, ty + 2.4, { align: "right" });
  });

  // X ticks (about 8 labels max)
  const labelEvery = Math.max(1, Math.ceil(xs.length / 8));
  xs.forEach((xv, i) => {
    if (i % labelEvery !== 0 && i !== xs.length - 1) return;
    const tx = toX(xv);
    doc.setDrawColor(...GRID);
    doc.setLineWidth(0.4);
    doc.line(tx, py, tx, py + ph);
    doc.setTextColor(...AXIS);
    doc.text(String(xv), tx, py + ph + 10, { align: "center" });
  });

  // Axes
  doc.setDrawColor(...AXIS);
  doc.setLineWidth(0.6);
  doc.line(px, py, px, py + ph);
  doc.line(px, py + ph, px + pw, py + ph);

  // Series — lines break wherever a value is missing/invalid
  series.forEach((s) => {
    doc.setDrawColor(...s.color);
    doc.setFillColor(...s.color);
    doc.setLineWidth(1.3);
    if (s.dashed) doc.setLineDashPattern([4, 3], 0);
    let prev = null;
    s.values.forEach((v, i) => {
      const ok = v != null && isFinite(v) && (!log || v > 0);
      if (!ok) {
        prev = null;
        return;
      }
      const cx = toX(xs[i]);
      const cy = toY(v);
      if (prev) doc.line(prev[0], prev[1], cx, cy);
      prev = [cx, cy];
    });
    doc.setLineDashPattern([], 0);
    if (s.dots) {
      s.values.forEach((v, i) => {
        if (v != null && isFinite(v) && (!log || v > 0)) doc.circle(toX(xs[i]), toY(v), 1.3, "F");
      });
    }
  });
}
