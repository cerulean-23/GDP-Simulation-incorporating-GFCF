import { computeForecastRange } from "../utils/metrics";

function SubCard({ title, rows }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-[#0A0F1E] p-4">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-cyan-500">{title}</p>
      <dl className="space-y-2">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-[11px] text-slate-500">{label}</dt>
            <dd className="text-sm font-medium text-slate-100">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function ModelSummary({ settings, result, dataCountry }) {
  const forecastRange = computeForecastRange(result);

  return (
    <section className="rounded-xl border border-slate-800 bg-[#0F1729] p-5">
      <h2 className="mb-4 text-xs font-semibold tracking-wide text-cyan-400">
        MODEL &amp; SIMULATION SUMMARY
      </h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SubCard
          title="Country & Data"
          rows={[
            ["Selected Country", dataCountry?.name || dataCountry?.code || "-"],
            ["Currency", "Constant 2015 US$"],
            ["Data Type", "Real GDP + GFCF"],
          ]}
        />
        <SubCard
          title="Timeline & Scope"
          rows={[
            ["Data Period", `${settings.startYear}–${settings.endYear}`],
            ["Frequency", "Annual"],
            ["Rolling Window", `w = ${settings.window} years`],
          ]}
        />
        <SubCard
          title="Evaluation Approach"
          rows={[
            ["Forecast Horizon", forecastRange],
            ["Approach", "Rolling-Window Step-Ahead"],
          ]}
        />
      </div>
    </section>
  );
}
