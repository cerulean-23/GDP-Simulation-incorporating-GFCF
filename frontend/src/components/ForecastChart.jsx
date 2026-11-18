import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceArea } from "recharts";
import { formatGdp } from "../utils/metrics";
import { C, TOOLTIP_STYLE } from "../utils/palette";
import SectionHead from "./SectionHead";

function ForecastTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  const hasF = p.forecast != null;
  return (
    <div style={TOOLTIP_STYLE} className="px-3 py-2 shadow-lg">
      <p className="mb-1 font-mono font-semibold">{label}</p>
      <p style={{ color: C.forest }}>Actual: {formatGdp(p.actual)}</p>
      {hasF ? (
        <>
          <p style={{ color: C.terracotta }}>Forecast: {formatGdp(p.forecast)}</p>
          <p className="text-slate-400">
            Error (forecast − actual): {formatGdp(p.forecast - p.actual)} · {(Math.abs(p.forecast - p.actual) / Math.abs(p.actual) * 100).toFixed(2)}%
          </p>
        </>
      ) : (
        <p className="text-slate-400">No forecast (initial estimation window)</p>
      )}
      <p className="text-slate-500">constant 2015 US$</p>
    </div>
  );
}

// Renders the same result.years / y_actual / y_pred arrays as Page 1.
// Only presentation changed; the error shown in the tooltip is derived from those arrays.
export default function ForecastChart({ result }) {
  const chartData = result.years.map((year, i) => ({
    year,
    actual: result.y_actual[i],
    forecast: result.y_pred[i],
  }));
  const firstF = chartData.findIndex((d) => d.forecast != null);

  return (
    <section className="rounded-xl border border-slate-800 bg-ink-800 p-5 sm:p-6">
      <SectionHead
        n="05 · FORECAST PERFORMANCE"
        title="Actual GDP versus step-ahead forecast"
        lede="Values in billions of constant 2015 US$. The shaded span is the initial rolling window, which has no forecast."
      />
      <ResponsiveContainer width="100%" height={340}>
        <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
          {firstF > 0 && (
            <ReferenceArea x1={chartData[0].year} x2={chartData[firstF].year} fill={C.ochre} fillOpacity={0.12} stroke="none" />
          )}
          <XAxis dataKey="year" stroke={C.text2} fontSize={13} minTickGap={16} />
          <YAxis stroke={C.text2} fontSize={13} width={52} tickFormatter={(v) => `${(v / 1e9).toFixed(0)}B`} />
          <Tooltip content={<ForecastTooltip />} />
          <Legend wrapperStyle={{ fontSize: 13 }} />
          <Line type="monotone" dataKey="actual" name="Actual GDP" stroke={C.forest} dot={false} strokeWidth={2.25} />
          <Line
            type="monotone"
            dataKey="forecast"
            name="Step-ahead forecast"
            stroke={C.terracotta}
            strokeDasharray="6 4"
            dot={false}
            strokeWidth={2.25}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="mt-3 text-xs text-slate-500">
        Each forecast uses parameters estimated from the preceding rolling window.
      </p>
    </section>
  );
}
