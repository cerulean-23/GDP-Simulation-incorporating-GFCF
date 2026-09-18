import { useSimulation } from "../context/SimulationContext";
import { SliderField } from "./settingsControls";

export default function NumericalMethodCard() {
  const { settings, setSettings } = useSimulation();

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0F1729] p-5">
      <h3 className="mb-4 text-xs font-semibold tracking-wide text-blue-400">NUMERICAL METHOD</h3>

      {/* Numerical integration — RK4 */}
      <p className="mb-1 text-[11px] font-semibold tracking-wide text-slate-500">NUMERICAL INTEGRATION</p>
      <p className="mb-3 text-xs text-slate-400">Method: RK4</p>
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

      {/* Parameter estimation — rolling window */}
      <p className="mb-1 mt-6 text-[11px] font-semibold tracking-wide text-slate-500">
        PARAMETER ESTIMATION
      </p>
      <p className="mb-3 text-xs text-slate-400">Rolling-window temporal fitting</p>
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
  );
}
