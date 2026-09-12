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
import { useSimulation } from "../context/SimulationContext";

export default function ResultsChart() {
  const { result, settings } = useSimulation();

  if (!result) {
    return (
      <div className="flex h-[320px] items-center justify-center text-sm text-slate-500">
        Run a simulation to see GDP actual vs predicted.
      </div>
    );
  }

  const chartData = result.years.map((year, i) => ({
    year,
    actual: result.y_actual[i],
    predicted: result.y_pred[i],
  }));

  const latestIdx = result.years.length - 1;

  return (
    <div>
      <div className="mb-4 grid grid-cols-3 gap-4">
        <Stat label={`Actual GDP (${result.years[latestIdx]})`} value={formatGdp(result.y_actual[latestIdx])} />
        <Stat
          label={`Predicted GDP (${result.years[latestIdx]})`}
          value={result.y_pred[latestIdx] != null ? formatGdp(result.y_pred[latestIdx]) : "—"}
        />
        <Stat label="MAPE (Overall)" value={`${result.mape_overall.toFixed(2)}%`} accent />
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
          <XAxis dataKey="year" stroke="#64748B" fontSize={12} />
          <YAxis
            stroke="#64748B"
            fontSize={12}
            tickFormatter={(v) => `${(v / 1e9).toFixed(0)}B`}
          />
          <Tooltip
            contentStyle={{ background: "#0F1729", border: "1px solid #1E293B", fontSize: 12 }}
            formatter={(v) => (v != null ? formatGdp(v) : "—")}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="actual" name="Actual (Y)" stroke="#3B82F6" dot={false} strokeWidth={2} />
          <Line
            type="monotone"
            dataKey="predicted"
            name="Predicted (Ŷ)"
            stroke="#F97316"
            strokeDasharray="5 4"
            dot={false}
            strokeWidth={2}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>

      <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
        Rolling window {settings.window}y — predictions start after the first full window; earlier years show no forecast.
      </p>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-xl font-semibold ${accent ? "text-green-400" : "text-slate-100"}`}>{value}</p>
    </div>
  );
}

function formatGdp(v) {
  return `${(v / 1e9).toFixed(2)}B`;
}
