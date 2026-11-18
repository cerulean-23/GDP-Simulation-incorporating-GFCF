import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from "recharts";
import { useFred } from "../../context/FredContext";

/**
 * Actual series always; fitting/forecast segments only once a result exists.
 * Both segments are the SAME rolling one-step-ahead predictions, split at
 * metrics.split_index for reporting. Labels/ranges come from `result`, not
 * from the pending form.
 */
export default function FredForecastChart() {
  const { dataset, result } = useFred();
  const f = result?.fred;
  const labels = f ? f.period_labels : dataset.period_labels;
  const actual = f ? result.y_actual : dataset.gdp;
  const unit = f ? f.dataset.unit_label : dataset.meta.unit_label;
  const div = f ? f.dataset.display_divisor : dataset.meta.display_divisor;
  const first = f?.metrics.first_prediction_index;
  const split = f?.metrics.split_index;

  const rows = labels.map((label, i) => ({
    label,
    actual: actual[i] / div,
    fitting: f && i >= first && i < split ? result.y_pred[i] / div : null,
    forecast: f && i >= split && result.y_pred[i] != null ? result.y_pred[i] / div : null,
  }));

  // one tick per two years, on Q1, so 100+ category labels stay readable
  const ticks = labels.filter((l) => l.endsWith("Q1") && Number(l.slice(0, 4)) % 2 === 0);

  return (
    <div>
      <div className="rounded-lg border border-slate-800 bg-ink-900 p-2 sm:p-3"><ResponsiveContainer width="100%" height={340}>
        <LineChart data={rows} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#BDB6A5" />
          <XAxis dataKey="label" ticks={ticks} tickFormatter={(l) => l.slice(0, 4)} stroke="#48574D" fontSize={13} />
          <YAxis
            stroke="#48574D"
            fontSize={13}
            width={55}
            domain={["auto", "auto"]}
            tickFormatter={(v) => v.toFixed(0)}
            label={{ value: unit, angle: -90, position: "insideLeft", fill: "#4D5A51", fontSize: 12, dy: 40 }}
          />
          <Tooltip
            contentStyle={{ background: "#EEE9DD", border: "1px solid #CEC7B8", color: "#26372F", fontSize: 13 }}
            formatter={(v, name) => [v == null ? "-" : `${v.toFixed(2)} ${unit}`, name]}
          />
          <Legend wrapperStyle={{ fontSize: 13 }} />
          <Line type="monotone" dataKey="actual" name="GDP actual" stroke="#315B48" dot={{ r: 2 }} strokeWidth={1.5} />
          <Line
            type="monotone"
            dataKey="fitting"
            name="Fitting phase"
            stroke="#8A5A16"
            strokeDasharray="6 4"
            dot={false}
            strokeWidth={3}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="forecast"
            name="Forecast phase"
            stroke="#9A4F32"
            strokeDasharray="6 4"
            dot={false}
            strokeWidth={3}
            connectNulls={false}
          />
          {f && (
            <ReferenceLine
              x={labels[first]}
              stroke="#5F6C62"
              strokeDasharray="6 4"
              label={{ value: "Start moving forecast", position: "insideTopLeft", fill: "#5F6C62", fontSize: 12 }}
            />
          )}
          {f && (
            <ReferenceLine
              x={labels[split]}
              stroke="#26372F"
              strokeDasharray="2 3"
              label={{ value: "Fit / forecast boundary", position: "insideTopLeft", fill: "#26372F", fontSize: 12 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer></div>

      {f ? (
        <p className="mt-2 text-xs text-slate-500">
          Rolling window {f.config.window} quarters · fitting phase {labels[first]}–{labels[split - 1]} · forecast phase{" "}
          {labels[split]}–{labels[labels.length - 1]}. Both phases are one-step-ahead predictions from the same rolling
          procedure, split only for reporting.
        </p>
      ) : (
        <p className="mt-2 text-xs text-slate-500">
          Showing observed GDP. Run the simulation to overlay the fitting and forecast phases.
        </p>
      )}
    </div>
  );
}
