import { useFred } from "../../context/FredContext";

// Unstable runs (e.g. very small population/iterations) can produce astronomically large errors.
const big = (v) => !Number.isFinite(v) || Math.abs(v) >= 1e6;
const pct = (v) => (Number.isFinite(v) ? (big(v) ? `${v.toExponential(2)}%` : `${v.toFixed(4)}%`) : "—");
const num3 = (v) => (Number.isFinite(v) ? (big(v) ? v.toExponential(2) : v.toFixed(3)) : "—");

function Card({ label, value, sub, accent }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-[#0A0F1E] p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-xl font-semibold ${accent ? "text-green-400" : "text-slate-100"}`}>{value}</p>
      {sub && <p className="mt-1 text-[11px] text-slate-500">{sub}</p>}
    </div>
  );
}

export default function FredMetrics() {
  const { result } = useFred();
  const f = result.fred;
  const m = f.metrics;
  const div = f.dataset.display_divisor;
  const unit = f.dataset.unit_label;
  const L = f.period_labels;

  const rows = [
    ["Overall", m.overall, `${L[m.first_prediction_index]}–${L[L.length - 1]}`],
    ["Fitting phase", m.fitting, `${L[m.first_prediction_index]}–${L[m.split_index - 1]}`],
    ["Forecast phase", m.forecast, `${L[m.split_index]}–${L[L.length - 1]}`],
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card label="MAPE — overall" value={pct(m.overall.mape)} accent />
        <Card label="MAPE — fitting phase" value={pct(m.fitting.mape)} sub={`${m.fitting.n} quarters`} />
        <Card label="MAPE — forecast phase" value={pct(m.forecast.mape)} sub={`${m.forecast.n} quarters`} />
        <Card label="Naive baseline MAPE" value={pct(m.overall.naive_mape)} sub="Previous quarter as forecast" />
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-slate-500">
            <tr className="border-b border-slate-800">
              <th className="py-2 pr-4 font-medium">Span</th>
              <th className="py-2 pr-4 font-medium">Quarters</th>
              <th className="py-2 pr-4 font-medium">MAPE</th>
              <th className="py-2 pr-4 font-medium">Naive MAPE</th>
              <th className="py-2 pr-4 font-medium">RMSE ({unit})</th>
              <th className="py-2 font-medium">MAE ({unit})</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([name, b, range]) => (
              <tr key={name} className="border-b border-slate-800/60">
                <td className="py-2 pr-4 text-slate-100">
                  {name} <span className="text-xs text-slate-500">({range})</span>
                </td>
                <td className="py-2 pr-4 text-slate-300">{b.n}</td>
                <td className="py-2 pr-4 text-slate-300">{pct(b.mape)}</td>
                <td className="py-2 pr-4 text-slate-300">{pct(b.naive_mape)}</td>
                <td className="py-2 pr-4 text-slate-300">{num3(b.rmse / div)}</td>
                <td className="py-2 text-slate-300">{num3(b.mae / div)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        MAPE = mean absolute percentage error. Naive baseline predicts each quarter with the previous quarter's observed
        value over the same span.
      </p>
    </div>
  );
}
