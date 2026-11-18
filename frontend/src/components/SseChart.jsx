import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from "recharts";
import { formatSse } from "../utils/metrics";
import { C, TOOLTIP_STYLE } from "../utils/palette";

export default function SseChart({ result, title = "SSE BY YEAR" }) {
  const points = result.years
    .map((year, i) => ({ year, sse: result.sse_per_year[i] }))
    .filter((p) => p.sse != null && p.sse > 0);

  if (points.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-ink-800 p-5 text-sm text-slate-400">No SSE values available.</div>
    );
  }

  const sseValues = points.map((p) => p.sse).sort((a, b) => a - b);
  const avg = sseValues.reduce((a, b) => a + b, 0) / sseValues.length;
  const median = sseValues[Math.floor(sseValues.length / 2)]; // unchanged from the original calculation
  const minEntry = points.reduce((a, b) => (b.sse < a.sse ? b : a), points[0]);
  const maxEntry = points.reduce((a, b) => (b.sse > a.sse ? b : a), points[0]);

  return (
    <div className="rounded-xl border border-slate-800 bg-ink-800 p-5">
      <h3 className="mb-1 text-[15px] font-semibold tracking-wide text-blue-400">{title}</h3>
      <p className="mb-4 text-xs text-slate-500">
        Sum of squared errors of each step-ahead forecast (squared GDP units; log scale). Markers show the minimum and maximum.
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="md:col-span-3">
          <div className="rounded-lg border border-slate-800 bg-ink-900 p-2 sm:p-3"><ResponsiveContainer width="100%" height={260}>
            <LineChart data={points} margin={{ top: 8, right: 14, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
              <XAxis dataKey="year" stroke={C.text2} fontSize={13} minTickGap={16} />
              <YAxis
                scale="log"
                domain={["auto", "auto"]}
                stroke={C.text2}
                fontSize={13}
                width={52}
                tickFormatter={(v) => (v >= 1000 || v < 0.01 ? v.toExponential(0) : String(v))}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ fontFamily: "IBM Plex Mono, monospace", fontWeight: 600 }}
                formatter={(v) => [formatSse(v), "SSE"]}
              />
              <Line type="monotone" dataKey="sse" stroke={C.ochreDeep} dot={{ r: 2.5, fill: C.ochreDeep }} strokeWidth={2} />
              <ReferenceDot x={minEntry.year} y={minEntry.sse} r={6} fill={C.teal} stroke="#E8E2D5" strokeWidth={1.5} />
              <ReferenceDot x={maxEntry.year} y={maxEntry.sse} r={6} fill={C.terracotta} stroke="#E8E2D5" strokeWidth={1.5} />
            </LineChart>
          </ResponsiveContainer></div>
        </div>
        <div className="flex flex-col justify-center gap-3 text-sm">
          <Stat label="Average SSE" value={formatSse(avg)} />
          <Stat label="Median SSE" value={formatSse(median)} />
          <Stat label="Min SSE" value={`${formatSse(minEntry.sse)} (${minEntry.year})`} dot={C.teal} />
          <Stat label="Max SSE" value={`${formatSse(maxEntry.sse)} (${maxEntry.year})`} dot={C.terracotta} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, dot }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
      <span className="flex items-center gap-1.5 text-slate-400">
        {dot && <span className="h-2 w-2 rounded-full" style={{ background: dot }} />}
        {label}
      </span>
      <span className="font-mono text-[13px] font-medium text-slate-100">{value}</span>
    </div>
  );
}
