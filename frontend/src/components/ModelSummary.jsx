import { computeActualDataRange, computeForecastRange } from "../utils/metrics";
import SectionHead from "./SectionHead";

function Group({ title, rows }) {
  return (
    <div>
      <p className="mb-2 text-[13px] font-semibold uppercase tracking-wider text-slate-500">{title}</p>
      <dl className="divide-y divide-slate-800/80 border-y border-slate-800">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-4 py-2">
            <dt className="text-xs text-slate-400">{label}</dt>
            <dd className="text-right font-mono text-[14px] text-slate-100">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// Research overview. Every value comes from the loaded data, the settings and
// the simulation result - nothing is hardcoded except the units/frequency
// labels the app already stated (annual data, constant 2015 US$).
export default function ModelSummary({ settings, result, dataCountry }) {
  const nObs = result.years.length;
  const nForecast = result.y_pred.filter((v) => v != null).length;

  return (
    <section className="rounded-xl border border-slate-800 bg-ink-800 p-5 sm:p-6">
      <SectionHead
        n="01 - RESEARCH OVERVIEW"
        title={`${dataCountry?.name || dataCountry?.code || "Selected country"} - GDP and GFCF simulation`}
        lede="Summary of the data, evaluation scope and computational settings behind the results on this page."
      />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Group
          title="Data"
          rows={[
            ["Country", dataCountry?.name || dataCountry?.code || "-"],
            ["Source", dataCountry?.source === "csv" ? "Uploaded CSV" : dataCountry?.source === "api" ? "World Bank API" : "-"],
            ["Historical period", computeActualDataRange(result) ?? "-"],
            ["Observations", nObs],
            ["Frequency", "Annual"],
            ["Unit", "Constant 2015 US$"],
          ]}
        />
        <Group
          title="Evaluation"
          rows={[
            ["Evaluation period", computeForecastRange(result)],
            ["Forecast observations", nForecast],
            ["Horizon", "t + 1 (one step ahead)"],
            ["Rolling window", `w = ${settings.window} years`],
          ]}
        />
        <Group
          title="Computation"
          rows={[
            ["Integrator", "RK4"],
            ["Step size", `h = ${settings.stepSize}`],
            ["Optimizer", "Differential Evolution"],
            ["Population size", settings.populationSize],
            ["Max iterations", settings.maxIterations],
          ]}
        />
      </div>
      <p className="mt-4 text-[12px] text-slate-500">
        The first {settings.window} years are consumed by the initial rolling window and have no step-ahead forecast.
      </p>
    </section>
  );
}
