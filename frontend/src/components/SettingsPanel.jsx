import { useSimulation } from "../context/SimulationContext";
import { useSimulationSocket } from "../hooks/useSimulationSocket";

function BoundInput({ label, value, onChange }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-slate-400">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          step="0.01"
          value={value[0]}
          onChange={(e) => onChange([Number(e.target.value), value[1]])}
          className="w-full rounded-md border border-slate-700 bg-[#0A0F1E] px-2 py-1.5 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
        />
        <span className="text-xs text-slate-500">to</span>
        <input
          type="number"
          step="0.01"
          value={value[1]}
          onChange={(e) => onChange([value[0], Number(e.target.value)])}
          className="w-full rounded-md border border-slate-700 bg-[#0A0F1E] px-2 py-1.5 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
        />
      </div>
    </div>
  );
}

function SliderField({ label, value, onChange, min, max, step = 1 }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span className="text-slate-200">{value}</span>
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

export default function SettingsPanel() {
  const { settings, setSettings, status, progress, errorMessage, rawData } = useSimulation();
  const { runSimulation, cancelSimulation } = useSimulationSocket();

  const isRunning = status === "running";

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="rounded-xl border border-slate-800 bg-[#0F1729] p-5">
        <h3 className="mb-4 text-xs font-semibold tracking-wide text-blue-400">
          DIFFERENTIAL EVOLUTION
        </h3>
        <p className="mb-2 text-xs text-slate-500">Search Space (Ω) Bounds</p>
        <div className="space-y-3">
          <BoundInput
            label="Parameter a"
            value={settings.bounds.a}
            onChange={(v) => setSettings((s) => ({ ...s, bounds: { ...s.bounds, a: v } }))}
          />
          <BoundInput
            label="Parameter b"
            value={settings.bounds.b}
            onChange={(v) => setSettings((s) => ({ ...s, bounds: { ...s.bounds, b: v } }))}
          />
          <BoundInput
            label="Parameter c"
            value={settings.bounds.c}
            onChange={(v) => setSettings((s) => ({ ...s, bounds: { ...s.bounds, c: v } }))}
          />
          <SliderField
            label="Population Size"
            value={settings.populationSize}
            onChange={(v) => setSettings((s) => ({ ...s, populationSize: v }))}
            min={5}
            max={200}
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
        <h3 className="mb-4 text-xs font-semibold tracking-wide text-blue-400">
          RK4 &amp; ROLLING WINDOW
        </h3>
        <div className="space-y-3">
          <SliderField
            label="Window (w)"
            value={settings.window}
            onChange={(v) => setSettings((s) => ({ ...s, window: v }))}
            min={2}
            max={10}
          />
          <SliderField
            label="Step Size (h)"
            value={settings.stepSize}
            onChange={(v) => setSettings((s) => ({ ...s, stepSize: v }))}
            min={0.1}
            max={2}
            step={0.1}
          />
        </div>
      </div>

      <div className="flex flex-col rounded-xl border border-slate-800 bg-[#0F1729] p-5">
        <h3 className="mb-4 text-xs font-semibold tracking-wide text-blue-400">RUN</h3>

        <button
          onClick={isRunning ? cancelSimulation : () => runSimulation()}
          disabled={!rawData && !isRunning}
          className="mb-4 flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isRunning ? "Cancel" : "🚀 RUN SIMULATION"}
        </button>

        {!rawData && (
          <p className="mb-3 text-xs text-slate-500">Load data first, in the panel on the left.</p>
        )}

        {errorMessage && <p className="mb-3 text-xs text-red-400">{errorMessage}</p>}

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
