import { computeRmse, formatGdp } from "../utils/metrics";

function Card({ label, value, description }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0F1729] p-5">
      <p className="text-2xl font-semibold text-slate-100">{value}</p>
      <p className="mt-1 text-xs font-medium text-slate-300">{label}</p>
      <p className="mt-1 text-[11px] leading-snug text-slate-500">{description}</p>
    </div>
  );
}

export default function PerformanceSummary({ result }) {
  const rmse = computeRmse(result.y_actual, result.y_pred);

  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold tracking-wide text-blue-400">PERFORMANCE SUMMARY</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card
          label="MAPE"
          value={`${result.mape_overall.toFixed(2)}%`}
          description="Mean Absolute Percentage Error of step-ahead forecasts."
        />
        <Card
          label="RMSE"
          value={rmse != null ? formatGdp(rmse) : "—"}
          description={
            <>
              Root Mean Squared Error of step-ahead forecasts.
              <br />
              constant 2015 US$
            </>
          }
        />
        <Card
          label="SSE"
          value={result.best_sse_final.toFixed(3)}
          description="Sum of squared errors of the final rolling-window step-ahead forecast."
        />
        <Card
          label="R²"
          value={result.r2_overall.toFixed(3)}
          description="Coefficient of determination."
        />
      </div>
    </section>
  );
}
