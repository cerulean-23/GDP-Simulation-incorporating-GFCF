import SectionHead from "./SectionHead";

const STAGES = [
  ["GDP + GFCF data", "Annual real GDP and gross fixed capital formation series."],
  ["Rolling window", "The w observations preceding each forecast period."],
  ["Differential Evolution", "Searches the bounded (a, b, c) space for the best fit to the window."],
  ["Parameter estimation", "The estimated a, b, c are kept for that window."],
  ["RK4 integration", "Integrates dY/dt with the estimated parameters."],
  ["Step-ahead forecast", "Produces the GDP forecast one period ahead (t + 1)."],
  ["Forecast evaluation", "Forecasts are compared with actual GDP (MAPE, RMSE, SSE, R²)."],
];

export default function MethodologyPipeline() {
  return (
    <section className="rounded-xl border border-slate-800 bg-ink-800 p-5 sm:p-6">
      <SectionHead
        n="04 - COMPUTATIONAL METHODOLOGY"
        title="From data to evaluated forecast"
        lede="The sequence repeats for every rolling window."
      />
      <ol className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2 lg:grid-cols-7">
        {STAGES.map(([title, text], i) => (
          <li key={title} className="relative border-t-2 border-slate-700 pt-3">
            <span className="absolute -top-[5px] left-0 h-2 w-2 rounded-full bg-blue-400" aria-hidden />
            <p className="font-mono text-[12px] text-blue-400">{String(i + 1).padStart(2, "0")}</p>
            <p className="mt-0.5 text-[13px] font-semibold uppercase leading-snug tracking-wide text-slate-100">
              {title}
            </p>
            <p className="mt-1 text-xs leading-snug text-slate-400">{text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
