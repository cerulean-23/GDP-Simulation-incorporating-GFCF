import { useSimulation } from "../context/SimulationContext";
import { validateSettings } from "../utils/paramLimits";

// Every state below is derived from existing context state (rawData, settings
// validation, status, progress, result, errorMessage). Nothing is simulated.
const TONE = {
  done: { text: "text-green-400", dot: "bg-green-500/15 text-green-400 border-green-500/40" },
  current: { text: "text-blue-400", dot: "bg-blue-500/15 text-blue-400 border-blue-400/60" },
  failed: { text: "text-red-400", dot: "bg-red-500/15 text-red-400 border-red-500/50" },
  pending: { text: "text-slate-500", dot: "bg-slate-800 text-slate-500 border-slate-700" },
};

export default function WorkflowSteps() {
  const { rawData, dataCountry, settings, status, result, progress } = useSimulation();

  const dataDone = !!rawData;
  const configOk = dataDone && validateSettings(settings).length === 0;
  const running = status === "running";
  const failed = status === "error";
  const simDone = status === "done" && !!result;

  const steps = [
    {
      label: "Data",
      state: dataDone ? "done" : "current",
      note: dataDone ? `${dataCountry?.code ?? ""} · ${rawData.years.length} yrs` : "Not loaded",
    },
    {
      label: "Configuration",
      state: configOk ? "done" : dataDone ? "current" : "pending",
      note: configOk ? "Valid" : dataDone ? "Check parameters" : "Waiting for data",
    },
    {
      label: "Simulation",
      state: failed ? "failed" : simDone ? "done" : running ? "current" : configOk ? "current" : "pending",
      note: failed
        ? "Failed"
        : simDone
        ? "Completed"
        : running
        ? progress
          ? `Window ${progress.window}/${progress.total_windows}`
          : "Starting…"
        : configOk
        ? "Ready to run"
        : "Not ready",
    },
    {
      label: "Results",
      state: simDone ? "done" : "pending",
      note: simDone ? "Available" : "None yet",
    },
  ];

  return (
    <nav aria-label="Simulation workflow" className="rounded-xl border border-slate-800 bg-ink-800 px-4 py-3 sm:px-5">
      <ol className="grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-4">
        {steps.map((step, i) => {
          const t = TONE[step.state];
          return (
            <li key={step.label} className="flex items-center gap-2.5" aria-current={step.state === "current" ? "step" : undefined}>
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] transition-colors ${t.dot}`}
              >
                {step.state === "done" ? "✓" : step.state === "failed" ? "!" : i + 1}
              </span>
              <span className="min-w-0">
                <span className={`block font-mono text-[11px] font-medium uppercase tracking-wider ${t.text}`}>
                  {step.label}
                </span>
                <span className="block truncate text-[11px] text-slate-500">{step.note}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
