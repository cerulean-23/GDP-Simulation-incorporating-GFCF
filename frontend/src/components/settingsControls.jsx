import NumberInput from "./NumberInput";
import InfoTooltip from "./InfoTooltip";
import { clamp } from "../utils/paramLimits";

export const PARAM_INFO = {
  a: { title: "a — Intrinsic Growth", tooltip: "Intrinsic GDP growth parameter." },
  b: { title: "b — Growth Constraint", tooltip: "Nonlinear growth constraint representing diminishing growth at higher GDP levels." },
  c: { title: "c — GFCF Effect", tooltip: "Sensitivity of GDP dynamics to GFCF." },
};

export function BoundInput({ paramKey, value, onChange, limit }) {
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

export function SliderField({ label, tooltip, valueLabel, value, onChange, min, max, step = 1 }) {
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

export function ReadinessLine({ ok, label }) {
  return (
    <p className={`flex items-center gap-1.5 text-xs ${ok ? "text-green-400" : "text-slate-500"}`}>
      <span>{ok ? "✓" : "○"}</span>
      {label}
    </p>
  );
}
