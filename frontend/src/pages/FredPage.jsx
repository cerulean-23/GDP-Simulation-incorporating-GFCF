import { useFred } from "../context/FredContext";
import FredDataCard from "../components/fred/FredDataCard";
import FredConfigCard from "../components/fred/FredConfigCard";
import FredRunCard from "../components/fred/FredRunCard";
import FredForecastChart from "../components/fred/FredForecastChart";
import FredMetrics from "../components/fred/FredMetrics";
import FredEvaluationTable from "../components/fred/FredEvaluationTable";
import ParameterTracksChart from "../components/ParameterTracksChart";
import SseChart from "../components/SseChart";

export default function FredPage() {
  const { meta, dataset, result, status, errorMessage, retryLoad, offline, resultSource, snapshotInfo } = useFred();

  if (!meta || !dataset) {
    return (
      <div className="rounded-xl border border-slate-800 bg-[#0F1729] p-6 text-sm">
        {status === "error" ? (
          <>
            <p role="alert" className="text-red-300">
              {errorMessage}
            </p>
            <button
              onClick={retryLoad}
              className="mt-3 rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:border-slate-500"
            >
              Retry
            </button>
          </>
        ) : (
          <p className="text-slate-400">Loading FRED dataset...</p>
        )}
      </div>
    );
  }

  // Result-derived axis: quarter labels instead of the numeric index the backend
  // returns in `years`, so shared charts show "2005Q1" rather than 20.
  const labelled = result ? { ...result, years: result.fred.period_labels } : null;

  return (
    <div className="space-y-4">
      {offline && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-700/50 bg-[#1a1608] p-4 text-sm text-amber-200"
        >
          <span>
            The server is unreachable, so the page is using bundled data. “Load thesis result” still works; running a custom
            simulation needs the server.
          </span>
          <button
            onClick={retryLoad}
            className="rounded-md border border-amber-600/60 px-3 py-1 text-xs text-amber-100 hover:border-amber-400"
          >
            Retry connection
          </button>
        </div>
      )}

      <section className="rounded-xl border border-slate-800 bg-[#0F1729] p-5">
        <h2 className="mb-1 text-xs font-semibold tracking-wide text-blue-400">
          QUARTERLY ANALYSIS — {dataset.meta.name.toUpperCase()} (FRED)
        </h2>
        <p className="text-sm text-slate-400">
          Rolling-window one-step-ahead forecasting of real GDP from real gross fixed capital formation. For every quarter,
          a, b and c are re-estimated by Differential Evolution on the preceding window, then used to forecast that quarter
          with RK4. The fitting and forecast phases are an evaluation split of these same predictions, not separately
          trained models.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <FredDataCard />
        <FredConfigCard />
      </div>

      <FredRunCard />

      <section className="rounded-xl border border-slate-800 bg-[#0F1729] p-5">
        <h3 className="mb-4 text-xs font-semibold tracking-wide text-blue-400">
          GDP — ACTUAL VS ROLLING FORECAST ({(result ? result.fred.dataset.name : dataset.meta.name).toUpperCase()})
        </h3>
        <FredForecastChart />
      </section>

      {result && (
        <>
          {resultSource === "snapshot" && (
            <p className="rounded-xl border border-blue-900/60 bg-[#0B1530] p-3 text-xs text-blue-200">
              Precomputed result: default settings (window {result.fred.config.window} quarters, population{" "}
              {result.fred.config.population_size}, {result.fred.config.max_iterations} iterations, seed{" "}
              {snapshotInfo?.seed ?? 42}), generated {snapshotInfo?.generated_at ?? "earlier"} by this application's backend.
              Running the simulation with the same settings reproduces it.
            </p>
          )}
          <section className="rounded-xl border border-slate-800 bg-[#0F1729] p-5">
            <h3 className="mb-4 text-xs font-semibold tracking-wide text-blue-400">PERFORMANCE SUMMARY</h3>
            <FredMetrics />
          </section>

          <ParameterTracksChart
            result={labelled}
            window={result.fred.config.window}
            title="PARAMETER ESTIMATES BY ROLLING WINDOW"
          />
          <SseChart result={labelled} title="SSE BY QUARTER" />
          <FredEvaluationTable />
        </>
      )}
    </div>
  );
}
