export default function ModelDescription() {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0F1729] p-5">
      <h3 className="mb-4 text-xs font-semibold tracking-wide text-blue-400">MODEL DESCRIPTION</h3>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-medium text-slate-200">Differential Equation Model</p>
          <p className="mb-3 text-xs text-slate-400">The model used in the simulation:</p>
          <div className="rounded-lg border border-slate-800 bg-[#0A0F1E] px-4 py-4 text-center font-mono text-lg text-slate-100">
            dY/dt = aY &minus; bY<sup>2</sup> + cI
          </div>

          <dl className="mt-4 space-y-1.5 text-xs">
            <Row term="Y" def="Output (Real GDP)" />
            <Row term="t" def="Time" />
            <Row term="I" def="Gross Fixed Capital Formation (GFCF)" />
            <Row term="a" def="Intrinsic growth parameter" />
            <Row term="b" def="Growth limiting parameter (to keep growth realistic)" />
            <Row term="c" def="Sensitivity to GFCF (effect of investment on output)" />
          </dl>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-200">Model Explanation</p>
          <p className="mb-3 text-xs text-slate-400">
            This nonlinear differential equation captures the dynamics of economic growth by combining:
          </p>
          <ul className="mb-4 space-y-1.5 text-xs text-slate-300">
            <li>
              <span className="font-mono text-blue-400">aY</span> → intrinsic growth of the economy
            </li>
            <li>
              <span className="font-mono text-blue-400">&minus;bY²</span> → diminishing returns that limit
              uncontrolled growth
            </li>
            <li>
              <span className="font-mono text-blue-400">cI</span> → positive impact of investment (GFCF) on output
            </li>
          </ul>

          <p className="mb-2 text-sm font-medium text-slate-200">Solution Method</p>
          <ul className="space-y-1.5 text-xs text-slate-300">
            <li>
              <span className="text-slate-500">Numerical Solver:</span> Runge-Kutta 4 (RK4)
            </li>
            <li>
              <span className="text-slate-500">Optimization:</span> Differential Evolution
            </li>
            <li>
              <span className="text-slate-500">Calibration:</span> Rolling window optimization
            </li>
          </ul>
        </div>
      </div>

      <p className="mt-5 border-t border-slate-800 pt-3 text-xs text-slate-500">
        Data Source: <span className="text-blue-400">World Bank Open Data</span>
      </p>
    </div>
  );
}

function Row({ term, def }) {
  return (
    <div className="flex gap-3">
      <span className="w-4 font-mono text-slate-500">{term}</span>
      <span className="text-slate-400">= {def}</span>
    </div>
  );
}
