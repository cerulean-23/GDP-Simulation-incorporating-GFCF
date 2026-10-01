import { useFred } from "../../context/FredContext";
import NumberInput from "../NumberInput";
import { maxWindowFor, splitIndexFor, validateFredConfig } from "../../utils/fredValidation";

const INPUT =
  "w-24 rounded-md border border-slate-700 bg-[#0A0F1E] px-2 py-1 text-sm text-slate-100 focus:border-blue-500 focus:outline-none";

function Field({ label, hint, children }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-slate-300">{label}</span>
        {children}
      </div>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

const PARAM_ROWS = [
  { key: "a", label: "a — intrinsic growth" },
  { key: "b", label: "b — growth constraint" },
  { key: "c", label: "c — GFCF effect" },
];

export default function FredConfigCard() {
  const { meta, dataset, config, setConfig, resetConfig, status } = useFred();
  const n = dataset.gdp.length;
  const labels = dataset.period_labels;
  const disabled = status === "running";
  const errors = validateFredConfig(config, meta.limits, n);

  // Preview of what the pending settings would produce (pending, not results).
  let preview = null;
  if (errors.length === 0) {
    const split = splitIndexFor(n, config.split_ratio);
    preview = {
      first: labels[config.window],
      lastFit: labels[split - 1],
      boundary: labels[split],
      nFit: split - config.window,
      nFc: n - split,
    };
  }
  const wMax = maxWindowFor(n, config.split_ratio, meta.limits);

  const setBound = (key, idx, value) =>
    setConfig((c) => {
      const pair = [...c.bounds[key]];
      pair[idx] = value;
      return { ...c, bounds: { ...c.bounds, [key]: pair } };
    });

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0F1729] p-5 lg:col-span-2">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold tracking-wide text-blue-400">CONFIGURATION</h3>
        <button
          onClick={resetConfig}
          disabled={disabled}
          className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-slate-500 disabled:opacity-40"
        >
          Reset to defaults
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <p className="text-xs font-semibold tracking-wide text-slate-400">ROLLING FORECAST</p>
          <Field label="Rolling window (quarters)" hint={`Allowed: ${meta.limits.window_min}–${wMax} quarters`}>
            <NumberInput
              aria-label="Rolling window"
              className={INPUT}
              value={config.window}
              disabled={disabled}
              onChange={(v) => setConfig((c) => ({ ...c, window: v }))}
            />
          </Field>
          <Field label="Phase split ratio" hint="Share of the evaluated quarters reported as the fitting phase">
            <NumberInput
              aria-label="Split ratio"
              className={INPUT}
              value={config.split_ratio}
              disabled={disabled}
              onChange={(v) => setConfig((c) => ({ ...c, split_ratio: v }))}
            />
          </Field>
          {preview && (
            <p className="rounded-md border border-slate-800 bg-[#0A0F1E] p-2 text-xs text-slate-400">
              Pending settings: moving forecast starts {preview.first}; fitting phase {preview.first}–{preview.lastFit} (
              {preview.nFit} quarters); forecast phase {preview.boundary}–{labels[n - 1]} ({preview.nFc} quarters).
            </p>
          )}
        </div>

        <div className="space-y-4">
          <p className="text-xs font-semibold tracking-wide text-slate-400">DIFFERENTIAL EVOLUTION</p>
          <div className="space-y-2">
            {PARAM_ROWS.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between gap-2">
                <span className="text-sm text-slate-300">{label}</span>
                <div className="flex items-center gap-1">
                  <NumberInput
                    aria-label={`${key} lower bound`}
                    className={INPUT}
                    value={config.bounds[key][0]}
                    disabled={disabled}
                    onChange={(v) => setBound(key, 0, v)}
                  />
                  <span className="text-slate-500">–</span>
                  <NumberInput
                    aria-label={`${key} upper bound`}
                    className={INPUT}
                    value={config.bounds[key][1]}
                    disabled={disabled}
                    onChange={(v) => setBound(key, 1, v)}
                  />
                </div>
              </div>
            ))}
          </div>
          <Field label="Population size" hint={`${meta.limits.population_size[0]}–${meta.limits.population_size[1]}`}>
            <NumberInput
              aria-label="Population size"
              className={INPUT}
              value={config.population_size}
              disabled={disabled}
              onChange={(v) => setConfig((c) => ({ ...c, population_size: v }))}
            />
          </Field>
          <Field label="Max iterations" hint={`${meta.limits.max_iterations[0]}–${meta.limits.max_iterations[1]}`}>
            <NumberInput
              aria-label="Max iterations"
              className={INPUT}
              value={config.max_iterations}
              disabled={disabled}
              onChange={(v) => setConfig((c) => ({ ...c, max_iterations: v }))}
            />
          </Field>
        </div>
      </div>

      {errors.length > 0 && (
        <ul role="alert" className="mt-4 space-y-1 text-xs text-red-300">
          {errors.map((e) => (
            <li key={e}>• {e}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
