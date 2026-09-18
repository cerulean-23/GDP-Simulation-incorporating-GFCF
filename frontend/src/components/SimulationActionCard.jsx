import { useSimulation } from "../context/SimulationContext";
import { useSimulationSocket } from "../hooks/useSimulationSocket";
import { validateSettings } from "../utils/paramLimits";
import { ReadinessLine } from "./settingsControls";

export default function SimulationActionCard() {
  const { settings, status, progress, errorMessage, rawData, dataCountry, result } = useSimulation();
  const { runSimulation, cancelSimulation } = useSimulationSocket();

  const isRunning = status === "running";
  const isDone = status === "done" && !!result;
  const validationProblems = validateSettings(settings);
  const isValid = validationProblems.length === 0;
  const isReady = !!rawData && isValid;

  let buttonLabel = "🚀 RUN SIMULATION";
  if (isRunning) buttonLabel = "RUNNING...";

  return (
    <section className="rounded-xl border border-slate-800 bg-[#0F1729] p-5">
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

      {rawData && dataCountry && (
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-slate-500">Selected Country</p>
            <p className="text-sm font-medium text-slate-100">{dataCountry.name}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Data Period</p>
            <p className="text-sm font-medium text-slate-100">
              {settings.startYear}–{settings.endYear}
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

      {rawData && (
        <div className="mb-4 flex flex-wrap gap-x-6 gap-y-1 border-t border-slate-800 pt-3">
          <ReadinessLine ok={!!rawData} label="Data loaded" />
          <ReadinessLine ok={isValid} label="Model configured" />
          <ReadinessLine ok={isValid} label="Parameters initialized" />
        </div>
      )}

      {rawData && !isValid && (
        <ul className="mb-3 space-y-1 text-xs text-red-400">
          {validationProblems.map((p) => (
            <li key={p}>• {p}</li>
          ))}
        </ul>
      )}

      {errorMessage && <p className="mb-3 text-xs text-red-400">{errorMessage}</p>}

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
            {progress && (
              <p className="mt-1 font-mono text-[11px] text-slate-500">
                year {progress.year} · sse {progress.sse.toFixed(4)}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
