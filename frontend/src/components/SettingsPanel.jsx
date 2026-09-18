import { useSimulation } from "../context/SimulationContext";
import { useSimulationSocket } from "../hooks/useSimulationSocket";
import { PARAM_LIMITS, POPULATION_SIZE_LIMITS, clamp, validateSettings } from "../utils/paramLimits";
import NumberInput from "./NumberInput";
import InfoTooltip from "./InfoTooltip";

const PARAM_INFO = {
  a: { title: "a  (Intrinsic Growth)", tooltip: "Intrinsic GDP growth parameter." },
  b: { title: "b  (Growth Constraint)", tooltip: "Nonlinear growth constraint representing diminishing growth at higher GDP levels." },
  c: { title: "c  (GFCF Effect)", tooltip: "Sensitivity of GDP dynamics to GFCF." },
};

function BoundInput({ paramKey, value, onChange, limit }) {
  const [lo, hi] = value;
  const invalid = lo >= hi || lo < limit.min || hi > limit.max;
  const info = PARAM_INFO[paramKey];
  return (
    <div>
      <div className="mb-1 flex items-baseline gap-1">
        <label className="text-xs text-slate-300">{info.title}</label>
        <InfoTooltip text={info.tooltip} />
      </div>
      <p className="mb-1.5 text-[11px] text-slate-500">
        Search range: {lo} to {hi}
      </p>
      <div className="flex items-center gap-2">
        <NumberInput
          value={lo}
          onChange={(n) => onChange([clamp(n, limit.min, limit.max), hi])}
          className={`w-full rounded-md border bg-[#0A0F1E] px-2 py-1.5 text-sm text-slate-100 focus:outline-none ${
            invalid ? "border-red-500" : "border-slate-700 focus:border-blue-500"
          }`}
        />
        <span className="text-xs text-slate-500">to</span>
        <NumberInput
          value={hi}
          onChange={(n) => onChange([lo, clamp(n, limit.min, limit.max)])}
          className={`w-full rounded-md border bg-[#0A0F1E] px-2 py-1.5 text-sm text-slate-100 focus:outline-none ${
            invalid ? "border-red-500" : "border-slate-700 focus:border-blue-500"
          }`}
        />
      </div>
      {invalid && <p className="mt-1 text-[11px] text-red-400">Lower bound must be less than upper bound.</p>}
    </div>
  );
}

function SliderField({ label, tooltip, valueLabel, value, onChange, min, max, step = 1 }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="flex items-center text-xs text-slate-300">
          {label}
          {tooltip && <InfoTooltip text={tooltip} />}
        </span>
        <span className="text-xs font-medium text-slate-200">{valueLabel ?? value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blue-500"
      />
    </div>
  );
}

function ReadinessLine({ ok, label }) {
  return (
    <p className={`flex items-center gap-1.5 text-xs ${ok ? "text-green-400" : "text-slate-500"}`}>
      <span>{ok ? "✓" : "○"}</span>
      {label}
    </p>
  );
}

export default function SettingsPanel() {
  const { settings, setSettings, status, progress, errorMessage, rawData, dataCountry } = useSimulation();
  const { runSimulation, cancelSimulation } = useSimulationSocket();

  const isRunning = status === "running";
  const validationProblems = validateSettings(settings);
  const isValid = validationProblems.length === 0;
  const isReady = !!rawData && isValid;

  let buttonLabel = "🚀 RUN SIMULATION";
  if (isRunning) buttonLabel = "OPTIMIZING...";

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="rounded-xl border border-slate-800 bg-[#0F1729] p-5">
        <h3 className="mb-1 text-xs font-semibold tracking-wide text-blue-400">
          DIFFERENTIAL EVOLUTION
        </h3>
        <p className="mb-3 text-xs text-slate-500">Parameter search space (Ω)</p>
        <div className="space-y-4">
          <BoundInput
            paramKey="a"
            value={settings.bounds.a}
            limit={PARAM_LIMITS.a}
            onChange={(v) => setSettings((s) => ({ ...s, bounds: { ...s.bounds, a: v } }))}
          />
          <BoundInput
            paramKey="b"
            value={settings.bounds.b}
            limit={PARAM_LIMITS.b}
            onChange={(v) => setSettings((s) => ({ ...s, bounds: { ...s.bounds, b: v } }))}
          />
          <BoundInput
            paramKey="c"
            value={settings.bounds.c}
            limit={PARAM_LIMITS.c}
            onChange={(v) => setSettings((s) => ({ ...s, bounds: { ...s.bounds, c: v } }))}
          />
          <SliderField
            label="Population Size"
            value={settings.populationSize}
            onChange={(v) => setSettings((s) => ({ ...s, populationSize: v }))}
            min={POPULATION_SIZE_LIMITS.min}
            max={POPULATION_SIZE_LIMITS.max}
          />
          <SliderField
            label="Max Iterations"
            value={settings.maxIterations}
            onChange={(v) => setSettings((s) => ({ ...s, maxIterations: v }))}
            min={50}
            max={2000}
            step={50}
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-[#0F1729] p-5">
        {/* Section A — numerical integration (RK4) */}
        <h3 className="mb-1 text-xs font-semibold tracking-wide text-blue-400">
          NUMERICAL INTEGRATION
        </h3>
        <p className="mb-3 text-xs text-slate-500">Method: RK4</p>
        <SliderField
          label="Step Size"
          tooltip="Numerical integration step used by RK4. 1 time step per observation."
          valueLabel={`h = ${settings.stepSize}`}
          value={settings.stepSize}
          onChange={(v) => setSettings((s) => ({ ...s, stepSize: v }))}
          min={0.1}
          max={2}
          step={0.1}
        />

        {/* Section B — parameter estimation (rolling window) */}
        <h3 className="mb-1 mt-6 text-xs font-semibold tracking-wide text-blue-400">
          PARAMETER ESTIMATION
        </h3>
        <p className="mb-3 text-xs text-slate-500">Rolling-window temporal fitting</p>
        <SliderField
          label="Rolling Window"
          tooltip="Number of years of trailing data used to re-estimate a, b, c before each forecast step."
          valueLabel={`w = ${settings.window} years`}
          value={settings.window}
          onChange={(v) => setSettings((s) => ({ ...s, window: v }))}
          min={2}
          max={10}
        />
      </div>

      <div className="flex flex-col rounded-xl border border-slate-800 bg-[#0F1729] p-5">
        <h3 className="mb-3 text-xs font-semibold tracking-wide text-blue-400">RUN SIMULATION</h3>

        {!rawData && (
          <p className="mb-4 flex items-start gap-1.5 text-xs text-yellow-400">
            <span>⚠</span> Please load GDP and GFCF data first.
          </p>
        )}

        {rawData && dataCountry && (
          <div className="mb-4 space-y-2 text-xs">
            <div>
              <p className="text-slate-500">Ready to simulate:</p>
              <p className="font-medium text-slate-100">
                {dataCountry.name} · {settings.startYear}–{settings.endYear}
              </p>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Model</span>
              <span className="text-slate-200">GDP + GFCF</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Method</span>
              <span className="text-slate-200">RK4 + Differential Evolution</span>
            </div>
            <div className="space-y-0.5 border-t border-slate-800 pt-2">
              <ReadinessLine ok={!!rawData} label="Data loaded" />
              <ReadinessLine ok={isValid} label="Model configured" />
              <ReadinessLine ok={isReady} label="Ready to simulate" />
            </div>
          </div>
        )}

        {rawData && !isValid && (
          <ul className="mb-3 space-y-1 text-xs text-red-400">
            {validationProblems.map((p) => (
              <li key={p}>• {p}</li>
            ))}
          </ul>
        )}

        <button
          onClick={isRunning ? cancelSimulation : () => runSimulation()}
          disabled={!isReady && !isRunning}
          className="mb-2 flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isRunning ? "Cancel" : buttonLabel}
        </button>

        {errorMessage && <p className="mb-2 text-xs text-red-400">{errorMessage}</p>}

        {(isRunning || progress) && (
          <div className="mt-auto">
            <div className="mb-1 flex justify-between text-xs text-slate-400">
              <span>
                {progress ? `Window ${progress.window}/${progress.total_windows}` : "Starting..."}
              </span>
              <span>{progress ? `${progress.percent}%` : ""}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${progress?.percent ?? 2}%` }}
              />
            </div>
            {progress && (
              <p className="mt-2 font-mono text-[11px] text-slate-500">
                year {progress.year} · sse {progress.sse.toFixed(4)}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
