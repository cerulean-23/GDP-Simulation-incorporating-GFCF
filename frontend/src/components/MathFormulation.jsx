import { computeForecastRange } from "../utils/metrics";

export default function MathFormulation({ settings, result }) {
  const forecastRange = computeForecastRange(result);

  return (
    <section className="rounded-xl border border-cyan-950/40 bg-[#0F1729] p-5">
      <h2 className="mb-4 text-xs font-semibold tracking-wide text-cyan-400">
        MATHEMATICAL FORMULATION
      </h2>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left: the equation, set as real math typography via CSS (no
            heavy KaTeX dependency needed for a single static equation) */}
        <div className="flex items-center justify-center rounded-lg border border-slate-800 bg-[#0A0F1E] px-6 py-8">
          <div className="flex items-center gap-3 font-serif italic text-slate-100">
            <span className="flex flex-col items-center text-xl leading-none">
              <span className="border-b border-slate-400 px-1 pb-0.5">dY</span>
              <span className="px-1 pt-0.5">dt</span>
            </span>
            <span className="text-xl not-italic text-slate-400">=</span>
            <span className="text-2xl">
              aY <span className="not-italic text-slate-400">&minus;</span> bY
              <sup className="not-italic">2</sup>
              <span className="not-italic text-slate-400"> + </span>cI(t)
            </span>
          </div>
        </div>

        {/* Right: compact variable legend */}
        <div className="rounded-lg border border-slate-800 bg-[#0A0F1E] p-4">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-cyan-500">
            Variable Legend
          </p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
            <LegendRow term="Y(t)" def="Real GDP" />
            <LegendRow term="I(t)" def="Gross Fixed Capital Formation (GFCF)" />
            <LegendRow term="a" def="Intrinsic Growth" />
            <LegendRow term="b" def="Growth Constraint" />
            <LegendRow term="c" def="GFCF Effect" />
          </dl>
        </div>
      </div>

      {/* Evaluation note — info callout with legible contrast */}
      <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-cyan-900/40 bg-cyan-950/20 px-4 py-3">
        <svg width="15" height="15" viewBox="0 0 15 15" className="mt-0.5 shrink-0 text-cyan-400">
          <circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" strokeWidth="1.3" fill="none" />
          <path d="M7.5 6.8v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <circle cx="7.5" cy="4.6" r="0.9" fill="currentColor" />
        </svg>
        <p className="text-xs leading-relaxed text-slate-300">
          Forecast evaluation period: <span className="font-medium text-slate-200">{forecastRange}</span>{" "}
          <span className="text-slate-400">
            (the first {settings.window} years of the data period are consumed by the initial
            rolling window and have no step-ahead forecast).
          </span>
        </p>
      </div>
    </section>
  );
}

function LegendRow({ term, def }) {
  return (
    <>
      <dt className="font-mono italic text-slate-400">{term}</dt>
      <dd className="text-slate-300">
        <span className="not-italic text-slate-500">= </span>
        {def}
      </dd>
    </>
  );
}
