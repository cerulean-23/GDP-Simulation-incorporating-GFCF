import { useSimulation } from "../context/SimulationContext";
import { PARAM_LIMITS, POPULATION_SIZE_LIMITS } from "../utils/paramLimits";
import { BoundInput, SliderField } from "./settingsControls";

export default function ModelParametersCard() {
  const { settings, setSettings } = useSimulation();

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0F1729] p-5">
      <h3 className="mb-1 text-xs font-semibold tracking-wide text-blue-400">MODEL PARAMETERS</h3>
      <p className="mb-3 text-xs text-slate-500">
        dY/dt = aY &minus; bY&sup2; + cI(t) — search space (Ω)
      </p>
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

        <div className="border-t border-slate-800 pt-4">
          <p className="mb-3 text-[11px] font-semibold tracking-wide text-slate-500">
            DIFFERENTIAL EVOLUTION
          </p>
          <div className="space-y-4">
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
      </div>
    </div>
  );
}
