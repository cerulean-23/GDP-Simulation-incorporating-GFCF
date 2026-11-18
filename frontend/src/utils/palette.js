// Chart colors (SVG attributes cannot read CSS variables reliably, so the
// same palette as index.css lives here). Keep the two in sync.
export const C = {
  text: "#26372F",
  text2: "#48574D",
  border: "#CEC7B8",
  grid: "#BDB6A5", // gridlines on the #E8E2D5 chart surface
  surfaceHi: "#EEE9DD",
  forest: "#315B48",
  terracotta: "#9A4F32",
  teal: "#547A70",
  ochre: "#C5A45D",
  ochreDeep: "#8A5A16"
};

// Consistent parameter colors on every page.
export const PARAM_COLOR = { a: C.forest, b: C.teal, c: C.terracotta };

export const TOOLTIP_STYLE = {
  background: C.surfaceHi,
  border: `1px solid ${C.border}`,
  color: C.text,
  fontSize: 13,
  borderRadius: 6,
};

/** Compact, honest number formatting for parameter values of very different scale. */
export function fmtParam(v) {
  if (v == null || !Number.isFinite(v)) return "—";
  const a = Math.abs(v);
  if (a !== 0 && (a < 1e-3 || a >= 1e4)) return v.toExponential(3);
  return v.toFixed(5);
}
export function fmtTick(v) {
  if (v == null || !Number.isFinite(v)) return "";
  const a = Math.abs(v);
  if (a !== 0 && (a < 1e-2 || a >= 1e4)) return v.toExponential(0);
  return String(Number(v.toPrecision(3)));
}
