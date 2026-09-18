import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function SseChart({ result }) {
  const points = result.years
    .map((year, i) => ({ year, sse: result.sse_per_year[i] }))
    .filter((p) => p.sse != null && p.sse > 0);

  const sseValues = points.map((p) => p.sse).sort((a, b) => a - b);
  const avg = sseValues.reduce((a, b) => a + b, 0) / sseValues.length;
  const median = sseValues[Math.floor(sseValues.length / 2)];
  const minEntry = points.reduce((a, b) => (b.sse < a.sse ? b : a), points[0]);
  const maxEntry = points.reduce((a, b) => (b.sse > a.sse ? b : a), points[0]);

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0F1729] p-5">
      <h3 className="mb-1 text-xs font-semibold tracking-wide text-blue-400">SSE BY YEAR</h3>
      <p className="mb-4 text-xs text-slate-500">
        Sum of squared errors for each step-ahead forecast.
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="md:col-span-3">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={points} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="year" stroke="#64748B" fontSize={12} />
              <YAxis scale="log" domain={["auto", "auto"]} stroke="#64748B" fontSize={12} />
              <Tooltip
                contentStyle={{ background: "#0F1729", border: "1px solid #1E293B", fontSize: 12 }}
                formatter={(v) => v.toFixed(4)}
              />
              <Line type="monotone" dataKey="sse" stroke="#3B82F6" dot={{ r: 2 }} strokeWidth={1.5} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col justify-center gap-3 text-sm">
          <Stat label="Average SSE" value={avg.toFixed(3)} />
          <Stat label="Median SSE" value={median.toFixed(3)} />
          <Stat label="Min SSE" value={`${minEntry.sse.toFixed(3)} (${minEntry.year})`} />
          <Stat label="Max SSE" value={`${maxEntry.sse.toFixed(3)} (${maxEntry.year})`} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium text-slate-100">{value}</span>
    </div>
  );
}
