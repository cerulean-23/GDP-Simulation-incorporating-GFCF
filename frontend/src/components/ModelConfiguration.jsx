import SectionHead from "./SectionHead";

function Group({ n, title, description, rows }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-ink-900/60 p-4">
      <p className="font-mono text-[12px] tracking-wider text-blue-400">{n}</p>
      <h3 className="mb-1 font-serif text-base font-medium tracking-normal text-slate-100">{title}</h3>
      <p className="mb-3 text-xs leading-snug text-slate-400">{description}</p>
      <dl className="space-y-1.5">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-3 text-xs">
            <dt className="text-slate-500">{label}</dt>
            <dd className="text-right font-mono text-slate-100">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

const fmtB = ([lo, hi]) => `[${lo}, ${hi}]`;

export default function ModelConfiguration({ settings, result }) {
  const nForecast = result ? result.y_pred.filter((v) => v != null).length : null;
  return (
    <section className="rounded-xl border border-slate-800 bg-ink-800 p-5 sm:p-6">
      <SectionHead
        n="03 · MODEL CONFIGURATION"
        title="Integration, estimation and forecasting are separate steps"
        lede="RK4 integrates the differential equation for given parameters. Differential Evolution is what estimates those parameters."
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Group
          n="A"
          title="Numerical integration"
          description="Fourth-order Runge–Kutta numerically integrates dY/dt."
          rows={[
            ["Method", "RK4"],
            ["Step size", `h = ${settings.stepSize}`],
          ]}
        />
        <Group
          n="B"
          title="Parameter estimation"
          description="Differential Evolution searches the bounds below to estimate a, b and c."
          rows={[
            ["Algorithm", "Differential Evolution"],
            ["Population size", settings.populationSize],
            ["Max iterations", settings.maxIterations],
            ["Bounds a", fmtB(settings.bounds.a)],
            ["Bounds b", fmtB(settings.bounds.b)],
            ["Bounds c", fmtB(settings.bounds.c)],
          ]}
        />
        <Group
          n="C"
          title="Forecast methodology"
          description="Parameters are re-estimated on each rolling window, then used for a one-step-ahead forecast."
          rows={[
            ["Estimation", "Rolling window"],
            ["Window", `w = ${settings.window} years`],
            ["Horizon", "t + 1"],
            ...(nForecast != null ? [["Forecasts produced", nForecast]] : []),
          ]}
        />
      </div>
    </section>
  );
}
