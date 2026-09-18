import { useSimulation } from "../context/SimulationContext";
import { validateSettings } from "../utils/paramLimits";

export default function WorkflowSteps() {
  const { rawData, settings, status, result } = useSimulation();

  const dataDone = !!rawData;
  const paramsDone = dataDone && validateSettings(settings).length === 0;
  const simulating = status === "running";
  const simDone = status === "done" && !!result;
  const resultsDone = simDone;

  // Each step's state: "done" | "current" | "pending" — derived entirely
  // from real context state, never a fabricated/simulated progress value.
  const steps = [
    { label: "Data", state: dataDone ? "done" : "current" },
    { label: "Parameters", state: paramsDone ? "done" : dataDone ? "current" : "pending" },
    {
      label: "Simulate",
      state: simDone ? "done" : simulating ? "current" : paramsDone ? "current" : "pending",
    },
    { label: "Results", state: resultsDone ? "done" : simulating ? "current" : "pending" },
  ];

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0F1729] px-5 py-3">
      <p className="mb-2 text-xs font-semibold tracking-wide text-blue-400">SIMULATION WORKFLOW</p>
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
        {steps.map((step, i) => (
          <span key={step.label} className="flex items-center gap-1.5">
            <span
              className={`flex items-center gap-1.5 text-xs ${
                step.state === "done"
                  ? "text-green-400"
                  : step.state === "current"
                  ? "text-blue-400"
                  : "text-slate-500"
              }`}
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-medium ${
                  step.state === "done"
                    ? "bg-green-500/15 text-green-400"
                    : step.state === "current"
                    ? "bg-blue-500/15 text-blue-400"
                    : "bg-slate-800 text-slate-500"
                }`}
              >
                {step.state === "done" ? "✓" : i + 1}
              </span>
              {step.label}
            </span>
            {i < steps.length - 1 && <span className="mx-1 text-slate-600">→</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
