import { useSimulation } from "../context/SimulationContext";
import { SliderField } from "./settingsControls";

export default function NumericalMethodCard() {
  const { settings, setSettings } = useSimulation();

  return (
    <div className="rounded-xl border border-slate-800 bg-ink-800 p-5">
      <h3 className="mb-4 text-xs font-semibold tracking-wide text-blue-400">NUMERICAL METHOD</h3>

      {/* Numerical integration — RK4 */}
      <section className="rounded-lg border border-slate-800 bg-ink-900/60 p-3">
        <p className="mb-1 font-mono text-[11px] font-semibold tracking-wide text-slate-400">1 · NUMERICAL INTEGRATION</p>
        <p className="mb-1 text-xs text-slate-300">
          Method: <span className="font-mono">RK4</span> (fourth-order Runge–Kutta)
        </p>
        <p className="mb-3 text-[11px] leading-snug text-slate-500">
          Solves dY/dt forward in time for given a, b, c. The step size h sets how finely each interval is integrated.
        </p>
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
      </section>

      {/* Parameter estimation — rolling window */}
      <section className="mt-4 rounded-lg border border-slate-800 bg-ink-900/60 p-3">
        <p className="mb-1 font-mono text-[11px] font-semibold tracking-wide text-slate-400">2 · PARAMETER ESTIMATION</p>
        <p className="mb-1 text-xs text-slate-300">Rolling-window fitting</p>
        <p className="mb-3 text-[11px] leading-snug text-slate-500">
          Before each forecast step, a, b, c are re-estimated on the preceding w years of data (annual observations).
        </p>
        <SliderField
          label="Rolling Window"
          tooltip="Number of years of trailing data used to re-estimate a, b, c before each forecast step."
          valueLabel={`w = ${settings.window} years`}
          value={settings.window}
          onChange={(v) => setSettings((s) => ({ ...s, window: v }))}
          min={2}
          max={10}
        />
      </section>
    </div>
  );
}
