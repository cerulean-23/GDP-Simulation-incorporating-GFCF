const ICONS = {
  target: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  trend: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 15l4-5 3 3 6-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  gauge: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M4 14a6 6 0 1112 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 14l3-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  award: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 10l-1.5 6L10 14l4.5 2L13 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

function Card({ icon, iconColor, label, value, sublabel }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0F1729] p-5">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-full ${iconColor}`}>
        {ICONS[icon]}
      </div>
      <p className="text-2xl font-semibold text-slate-100">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{label}</p>
      {sublabel && <p className="mt-0.5 text-[11px] text-slate-600">{sublabel}</p>}
    </div>
  );
}

export default function MetricCards({ result }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Card
        icon="target"
        iconColor="bg-green-500/10 text-green-400"
        label="MAPE (Overall)"
        value={`${result.mape_overall.toFixed(2)}%`}
        sublabel="Lower is better"
      />
      <Card
        icon="trend"
        iconColor="bg-blue-500/10 text-blue-400"
        label="Best SSE (Final)"
        value={result.best_sse_final.toFixed(3)}
        sublabel="Lower is better"
      />
      <Card
        icon="gauge"
        iconColor="bg-purple-500/10 text-purple-400"
        label="MAE"
        value={formatMae(result.mae_overall)}
        sublabel="Lower is better"
      />
      <Card
        icon="award"
        iconColor="bg-yellow-500/10 text-yellow-400"
        label="R² Score"
        value={result.r2_overall.toFixed(3)}
        sublabel="Closer to 1 is better"
      />
    </div>
  );
}

function formatMae(v) {
  if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  return v.toFixed(3);
}
