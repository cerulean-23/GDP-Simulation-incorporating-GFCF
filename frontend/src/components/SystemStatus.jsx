import { useSimulation } from "../context/SimulationContext";

function StatusDot({ ok, label }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
          ok ? "bg-green-500/20 text-green-400" : "bg-slate-700 text-slate-500"
        }`}
      >
        {ok ? "✓" : "○"}
      </span>
      <span className={ok ? "text-slate-200" : "text-slate-500"}>{label}</span>
    </div>
  );
}

export default function SystemStatus() {
  const { rawData, settings, status } = useSimulation();

  const dataLoaded = !!rawData;
  const paramsInitialized =
    settings.bounds.a[0] < settings.bounds.a[1] &&
    settings.bounds.b[0] < settings.bounds.b[1] &&
    settings.bounds.c[0] < settings.bounds.c[1];
  const modelReady = dataLoaded && paramsInitialized && status !== "error";

  return (
    <div className="flex flex-wrap items-center gap-5 rounded-xl border border-slate-800 bg-[#0F1729] px-5 py-3">
      <span className="text-xs font-semibold tracking-wide text-blue-400">SYSTEM STATUS</span>
      <StatusDot ok={dataLoaded} label="Data Loaded" />
      <StatusDot ok={modelReady} label="Model Ready" />
      <StatusDot ok={paramsInitialized} label="Parameter Initialized" />
    </div>
  );
}
