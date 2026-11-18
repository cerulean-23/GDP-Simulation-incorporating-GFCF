import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PARAM_COLOR, C, fmtParam, fmtTick } from "../utils/palette";

const PARAMS = [
  { key: "a_track", sym: "a", label: "a — Intrinsic Growth", desc: "Coefficient of aY", color: PARAM_COLOR.a },
  { key: "b_track", sym: "b", label: "b — Nonlinear Growth Constraint", desc: "Coefficient of −bY²", color: PARAM_COLOR.b },
  { key: "c_track", sym: "c", label: "c — GFCF Effect", desc: "Coefficient of cI(t)", color: PARAM_COLOR.c },
];

function WindowTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-md border border-slate-800 bg-white px-3 py-2 text-[12px] text-slate-100 shadow-lg">
      <p className="font-mono font-semibold">Forecast year {p.year}</p>
      <p className="text-slate-400">Estimation window: {p.windowLabel ?? "—"}</p>
      {PARAMS.map(({ sym, color }) => (
        <p key={sym} className="font-mono">
          <span style={{ color }}>{sym}</span> = {fmtParam(p[sym])}
        </p>
      ))}
    </div>
  );
}

export default function ParameterTracksChart({ result, title = "ESTIMATED PARAMETER VALUES BY ROLLING WINDOW", window }) {
  // One row per forecast period carrying all three estimates, so every
  // tooltip can show the window and a, b, c together. Values are unchanged.
  const rows = result.years
    .map((year, i) => {
      const a = result.a_track[i];
      const b = result.b_track[i];
      const c = result.c_track[i];
      if (a == null && b == null && c == null) return null;
      // Estimation window = trailing `window` periods ending right before this forecast.
      const windowLabel = window && i - window >= 0 ? `${result.years[i - window]}–${result.years[i - 1]}` : null;
      return { year, a, b, c, windowLabel };
    })
    .filter(Boolean);

  return (
    <div className="rounded-xl border border-slate-800 bg-ink-800 p-5">
      <h3 className="mb-2 text-[15px] font-semibold tracking-wide text-blue-400">{title}</h3>
      <p className="mb-5 max-w-3xl rounded-md border-l-2 border-blue-400 bg-ink-900 px-3 py-2 text-xs leading-relaxed text-slate-300">
        Parameter values are re-estimated for each rolling window. Their variation across windows represents
        differences in estimated parameters across estimation periods, not necessarily time-varying coefficients
        within the differential equation.
      </p>
      <div className="space-y-6">
        {PARAMS.map(({ sym, label, desc, color }) => (
          <div key={sym}>
            <p className="text-xs font-medium text-slate-200">
              <span className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle" style={{ background: color }} />
              {label}
              <span className="ml-2 font-normal text-slate-500">{desc}</span>
            </p>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="year" stroke={C.text2} fontSize={12} minTickGap={16} />
                <YAxis stroke={C.text2} fontSize={12} width={56} domain={["auto", "auto"]} tickFormatter={fmtTick} />
                <Tooltip content={<WindowTooltip />} />
                <Line type="monotone" dataKey={sym} stroke={color} dot={{ r: 2, fill: color }} strokeWidth={2} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>
    </div>
  );
}
