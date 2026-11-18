import { computeRmse, computeTotalSse, formatGdp, formatSse } from "../utils/metrics";
import InfoTooltip from "./InfoTooltip";

function Metric({ label, value, unit, formula, description }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-ink-900/60 p-4">
      <p className="flex items-center text-[13px] font-semibold tracking-wider text-slate-400">
        {label}
        <InfoTooltip text={formula} />
      </p>
      <p className="mt-1 font-mono text-[28px] font-medium text-slate-100">{value}</p>
      <p className="text-[13px] font-medium text-blue-400">{unit}</p>
      <p className="mt-2 text-xs leading-snug text-slate-400">{description}</p>
    </div>
  );
}

// Same four metrics and same calculations as before; this only changes the
// presentation (units and plain-language definitions).
export default function PerformanceSummary({ result }) {
  const rmse = computeRmse(result.y_actual, result.y_pred);
  const totalSse = computeTotalSse(result);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric
        label="MAPE"
        value={`${result.mape_overall.toFixed(2)}%`}
        unit="percent of actual GDP"
        formula="Mean Absolute Percentage Error: average of |actual − forecast| / |actual|, in percent."
        description="Average percentage prediction error of the step-ahead forecasts. Lower means smaller error."
      />
      <Metric
        label="RMSE"
        value={rmse != null ? formatGdp(rmse) : "-"}
        unit="constant 2015 US$"
        formula="Root Mean Squared Error: square root of the mean squared forecast error."
        description="Typical forecast error size, in the same unit as GDP. Not a percentage."
      />
      <Metric
        label="SSE"
        value={formatSse(totalSse)}
        unit="squared billions of constant 2015 US$"
        formula="Sum of Squared Errors: sum of the squared one-step-ahead forecast errors."
        description="Total squared error over all forecasts, in squared GDP units. Not a percentage."
      />
      <Metric
        label="R²"
        value={result.r2_overall.toFixed(3)}
        unit="dimensionless"
        formula="Coefficient of determination. Closer to 1 generally means a better fit."
        description="Values closer to 1 generally indicate better fit. Negative values can occur when the fit is worse than a constant-mean baseline."
      />
    </div>
  );
}
