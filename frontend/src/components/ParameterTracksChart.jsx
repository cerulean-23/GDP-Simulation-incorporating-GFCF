import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const PARAMS = [
  { key: "a_track", label: "a — Intrinsic Growth", color: "#22C55E" },
  { key: "b_track", label: "b — Growth Constraint", color: "#3B82F6" },
  { key: "c_track", label: "c — GFCF Effect", color: "#A855F7" },
];

function WindowTooltip({ active, payload, valueLabel }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-md border border-slate-700 bg-[#0F1729] px-2.5 py-1.5 text-[11px] text-slate-200 shadow-lg">
      {p.windowLabel && <p className="text-slate-400">Window: {p.windowLabel}</p>}
      <p>
        {valueLabel}: {p.value.toFixed(5)}
      </p>
    </div>
  );
}

export default function ParameterTracksChart({ result, title = "PARAMETER ESTIMATES BY ROLLING WINDOW", window }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0F1729] p-5">
      <h3 className="mb-4 text-xs font-semibold tracking-wide text-blue-400">
        {title}
      </h3>
      <div className="space-y-6">
        {PARAMS.map(({ key, label, color }) => {
          const data = result.years
            .map((year, i) => {
              const value = result[key][i];
              if (value == null) return null;
              // The estimation window for the forecast at index i is the
              // trailing `window` years ending right before it — derived
              // from actual data/settings, never hardcoded.
              const windowLabel =
                window && i - window >= 0
                  ? `${result.years[i - window]}–${result.years[i - 1]}`
                  : null;
              return { year, value, windowLabel };
            })
            .filter(Boolean);

          return (
            <div key={key}>
              <p className="mb-1 text-xs text-slate-400">{label}</p>
              <ResponsiveContainer width="100%" height={110}>
                <LineChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="year" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} width={40} />
                  <Tooltip content={<WindowTooltip valueLabel={label.split(" — ")[0]} />} />
                  <Line type="monotone" dataKey="value" stroke={color} dot={{ r: 1.5 }} strokeWidth={1.5} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          );
        })}
      </div>
    </div>
  );
}
