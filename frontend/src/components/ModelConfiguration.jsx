function Pillar({ title, description, rows }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-[#0A0F1E] p-4">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-500">{title}</p>
      <p className="mb-3 text-xs leading-snug text-slate-500">{description}</p>
      <dl className="space-y-1.5">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 text-xs">
            <dt className="text-slate-500">{label}</dt>
            <dd className="rounded border border-slate-700 bg-slate-800/60 px-2 py-0.5 font-medium text-slate-200">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function ModelConfiguration({ settings }) {
  return (
    <section className="rounded-xl border border-slate-800 bg-[#0F1729] p-5">
      <h2 className="mb-4 text-xs font-semibold tracking-wide text-cyan-400">MODEL CONFIGURATION</h2>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Pillar
          title="Numerical Integration"
          description="Runge-Kutta 4th-order numerical integration step."
          rows={[
            ["Method", "RK4"],
            ["Step Size", `h = ${settings.stepSize}`],
          ]}
        />
        <Pillar
          title="Parameter Estimation"
          description="Parameters re-estimated for each rolling window using Differential Evolution."
          rows={[
            ["Optimization", "Differential Evolution"],
            ["Population Size", settings.populationSize],
            ["Max Iterations", settings.maxIterations],
          ]}
        />
        <Pillar
          title="Forecast Method"
          description="Step-ahead out-of-sample forecast."
          rows={[
            ["Approach", "Step-Ahead Forecast"],
            ["Horizon", "t + 1"],
          ]}
        />
      </div>
    </section>
  );
}
