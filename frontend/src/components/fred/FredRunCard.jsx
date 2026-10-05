import { useFred } from "../../context/FredContext";
import { validateFredConfig } from "../../utils/fredValidation";

export default function FredRunCard() {
  const { meta, dataset, config, status, progress, errorMessage, run, cancel, loadThesisResult } = useFred();
  const running = status === "running";
  const invalid = validateFredConfig(config, meta.limits, dataset.gdp.length).length > 0;
  const pct = progress?.percent ?? 0;

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0F1729] p-5">
      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={run}
          disabled={running || invalid}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {running ? "RUNNING..." : "RUN SIMULATION"}
        </button>
        {!running && (
          <button
            onClick={loadThesisResult}
            title="Instantly shows the precomputed default result (window 20, 80/20 split) — no server computation"
            className="rounded-lg border border-blue-500/60 px-4 py-2 text-sm text-blue-300 transition-colors hover:border-blue-400 hover:text-blue-200"
          >
            Load thesis result
          </button>
        )}
        {running && (
          <button
            onClick={cancel}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-500"
          >
            Cancel
          </button>
        )}
        {status === "done" && <span className="text-sm text-green-400">✓ Simulation completed</span>}
        {invalid && !running && <span className="text-xs text-slate-500">Fix the configuration errors above to run.</span>}
      </div>

      {running && (
        <div className="mt-4" aria-label="Simulation progress">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div className="h-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {progress
              ? `Window ${progress.window}/${progress.total_windows} · predicting ${progress.period} · ${pct}%`
              : "Connecting to the server..."}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Each quarter re-estimates a, b, c with Differential Evolution; the full run can take from about half a minute
            to a few minutes depending on server speed.
          </p>
        </div>
      )}

      {status === "error" && errorMessage && (
        <p role="alert" className="mt-4 rounded-md border border-red-900/60 bg-[#1a0f14] px-3 py-2 text-xs text-red-300">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
