const STAGES = [
  "REAL GDP + GFCF",
  "ROLLING WINDOW",
  "DIFFERENTIAL EVOLUTION",
  "ESTIMATE a, b, c",
  "RK4 INTEGRATION",
  "STEP-AHEAD FORECAST",
  "FORECAST ERROR",
];

export default function MethodologyPipeline() {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0F1729] p-4">
      <p className="mb-2 text-[11px] font-semibold tracking-wide text-slate-500">
        COMPUTATIONAL WORKFLOW
      </p>
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1.5">
        {STAGES.map((stage, i) => (
          <span key={stage} className="flex items-center gap-1.5">
            <span className="rounded-md border border-slate-800 bg-[#0A0F1E] px-2 py-1 text-[10px] font-medium tracking-wide text-slate-300">
              {stage}
            </span>
            {i < STAGES.length - 1 && <span className="text-slate-600">→</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
