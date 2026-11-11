import { useSimulation } from "../context/SimulationContext";
import { useNavigate } from "react-router-dom";
import { useSimulationSocket } from "../hooks/useSimulationSocket";
import { validateSettings } from "../utils/paramLimits";
import { ReadinessLine } from "./settingsControls";
import { computeActualDataRange } from "../utils/metrics";

export default function SimulationActionCard() {
  const { settings, status, progress, errorMessage, rawData, dataCountry, result } = useSimulation();
  const { runSimulation, cancelSimulation } = useSimulationSocket();
  const navigate = useNavigate();
  const dataRange = computeActualDataRange(rawData) ?? "—";
  const isRunning = status === "running";
  const isDone = status === "done" && !!result;
  const validationProblems = validateSettings(settings);
  const isValid = validationProblems.length === 0;
  const isReady = !!rawData && isValid;

  let buttonLabel = "🚀 RUN SIMULATION";
  if (isRunning) buttonLabel = "RUNNING...";


  return (
    <section className="rounded-xl border border-slate-800 bg-ink-800 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xs font-semibold tracking-wide text-blue-400">SIMULATION</h3>
        {isRunning && <span className="text-[11px] font-medium text-blue-400">SIMULATION IN PROGRESS</span>}
        {isDone && <span className="text-[11px] font-medium text-green-400">✓ Simulation completed</span>}
      </div>

      {!rawData && (
        <p className="mb-4 flex items-start gap-1.5 text-xs text-yellow-400">
          <span>⚠</span> Please load GDP and GFCF data first.
        </p>
      )}

      <div className="mb-4 grid grid-cols-1 gap-x-6 gap-y-1 border-b border-slate-800 pb-3 sm:grid-cols-2">
        <p className="text-xs text-slate-500">
          Selected country: <span className="font-medium text-slate-200">{settings.countryName || settings.countryCode}</span>
        </p>
        {rawData && dataCountry && settings.countryCode !== dataCountry.code && (
          <p className="text-xs text-yellow-400">⚠ Loaded data is for {dataCountry.name}; fetch data for the new selection.</p>
        )}
      </div>


      {rawData && dataCountry && (
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-slate-500">Selected Country</p>
            <p className="text-sm font-medium text-slate-100">{dataCountry.name}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Data Period</p>
            <p className="text-sm font-medium text-slate-100">
              {dataRange}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Model</p>
            <p className="text-sm font-medium text-slate-100">GDP + GFCF</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Method</p>
            <p className="text-sm font-medium text-slate-100">RK4 + Differential Evolution</p>
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-x-6 gap-y-1">
        <ReadinessLine ok={!!rawData} label="Data loaded" />
        <ReadinessLine ok={isValid} label="Configuration valid" />
        <ReadinessLine ok={isReady} label="Ready to run" />
      </div>

      {rawData && !isValid && (
        <ul className="mb-3 space-y-1 text-xs text-red-400">
          {validationProblems.map((p) => (
            <li key={p}>• {p}</li>
          ))}
        </ul>
      )}

      {errorMessage && (
        <p role="alert" className="mb-3 rounded-md border border-red-900/60 bg-[#1a0f14] px-3 py-2 text-xs text-red-300">
          Simulation failed: {errorMessage}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          onClick={isRunning ? cancelSimulation : () => runSimulation()}
          disabled={!isReady && !isRunning}
          className="flex items-center justify-center gap-2 rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
        >
          {buttonLabel}
        </button>

        {(isRunning || progress) && (
          <div className="flex-1">
            <div className="mb-1 flex justify-between text-xs text-slate-400">
              <span>{progress ? `Window ${progress.window}/${progress.total_windows}` : "Starting..."}</span>
              <span>{progress ? `${progress.percent}%` : ""}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${progress?.percent ?? 2}%` }}
              />
            </div>
            {isRunning && !progress && (
              <p className="mt-1 text-[11px] text-slate-500">Connected, waiting for the first optimization window…</p>
            )}
            {progress && (
              <p className="mt-1 font-mono text-[11px] text-slate-500">
                year {progress.year} · sse {progress.sse.toFixed(4)}
              </p>
            )}
          </div>
        )}
      </div>

      {isDone && (
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-800 pt-3 text-xs">
          <span className="text-green-400">✓ Results are ready.</span>
          <button
            onClick={() => document.getElementById("simulation-results")?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="rounded-md border border-blue-500/60 px-3 py-1.5 text-blue-300 hover:border-blue-400"
          >
            View results below
          </button>
          <button onClick={() => navigate("/metrics")} className="rounded-md border border-slate-700 px-3 py-1.5 text-slate-300 hover:border-slate-500">
            Model &amp; Metrics →
          </button>
        </div>
      )}
    </section>
  );
}
