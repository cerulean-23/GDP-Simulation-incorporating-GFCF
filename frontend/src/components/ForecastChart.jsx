import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatGdp } from "../utils/metrics";

// Renders the same result.years/y_actual/y_pred arrays as Page 1's chart —
// no recalculation, just Page-2-appropriate labels ("Step-Ahead Forecast"
// rather than "Simulated GDP") and a note on the forecasting methodology.
// Kept as its own component rather than reusing ResultsChart directly so
// Page 1's chart/labels stay completely untouched.
export default function ForecastChart({ result }) {
  const chartData = result.years.map((year, i) => ({
    year,
    actual: result.y_actual[i],
    forecast: result.y_pred[i],
  }));

  return (
    <section className="rounded-xl border border-slate-800 bg-[#0F1729] p-5">
      <h2 className="mb-1 text-xs font-semibold tracking-wide text-blue-400">
        GDP STEP-AHEAD FORECAST PERFORMANCE
      </h2>
      <p className="mb-4 text-xs text-slate-500">Actual GDP vs Step-Ahead Forecast GDP</p>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
          <XAxis dataKey="year" stroke="#64748B" fontSize={12} />
          <YAxis stroke="#64748B" fontSize={12} tickFormatter={(v) => `${(v / 1e9).toFixed(0)}B`} />
          <Tooltip
            contentStyle={{ background: "#0F1729", border: "1px solid #1E293B", fontSize: 12 }}
            formatter={(v) => (v != null ? `${formatGdp(v)} constant 2015 US$` : "—")}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="actual" name="Actual GDP" stroke="#3B82F6" dot={false} strokeWidth={2} />
          <Line
            type="monotone"
            dataKey="forecast"
            name="Step-Ahead Forecast"
            stroke="#F97316"
            strokeDasharray="5 4"
            dot={false}
            strokeWidth={2}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>

      <p className="mt-3 text-xs text-slate-500">
        Forecasts are generated using parameters estimated from the preceding rolling window. GDP
        values are in constant 2015 US$.
      </p>
    </section>
  );
}
