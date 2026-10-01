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
import { computeRmse, formatGdp } from "../utils/metrics";

export default function ResultsChart() {
  const { result, settings } = useSimulation();

  if (!result) {
    return (
      <div className="flex h-[320px] flex-col items-center justify-center gap-1 text-center text-sm text-slate-500">
        <p>No simulation results yet.</p>
        <p className="text-xs">Configure the model and run a simulation to see the results.</p>
      </div>
    );
  }

  const chartData = result.years.map((year, i) => ({
    year,
    actual: result.y_actual[i],
    predicted: result.y_pred[i],
  }));

  const latestIdx = result.years.length - 1;
  const rmse = computeRmse(result.y_actual, result.y_pred);

  return (
    <div>
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
            formatter={(v) => (v != null ? formatGdp(v) : "-")}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="actual" name="Actual GDP" stroke="#3B82F6" dot={false} strokeWidth={2} />
          <Line
            type="monotone"
            dataKey="predicted"
            name="Simulated GDP"
            stroke="#F97316"
            strokeDasharray="5 4"
            dot={false}
            strokeWidth={2}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Key performance metrics - primary output of the simulation */}
      <div className="mt-4 grid grid-cols-3 gap-4 border-t border-slate-800 pt-4">
        <Stat label="MAPE" value={`${result.mape_overall.toFixed(2)}%`} accent />
        <Stat label="RMSE" value={rmse != null ? formatGdp(rmse) : "-"} />
        <Stat label="SSE (final window)" value={result.best_sse_final.toFixed(3)} />
      </div>

      {/* Additional detail - lower priority than the chart/metrics above */}
      <div className="mt-3 grid grid-cols-2 gap-4 text-xs text-slate-500">
        <span>
          Actual GDP ({result.years[latestIdx]}): {formatGdp(result.y_actual[latestIdx])}
        </span>
        <span>
          Simulated GDP ({result.years[latestIdx]}):{" "}
          {result.y_pred[latestIdx] != null ? formatGdp(result.y_pred[latestIdx]) : "-"}
        </span>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        Rolling window {settings.window}y - predictions start after the first full window; earlier years show no forecast.
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
