import SectionHead from "./SectionHead";
import { PARAM_COLOR } from "../utils/palette";

const TERMS = [
  { sym: "aY", color: PARAM_COLOR.a, name: "Intrinsic growth", text: "Growth contribution proportional to the current GDP level." },
  { sym: "−bY²", color: PARAM_COLOR.b, name: "Nonlinear growth constraint", text: "A quadratic term that dampens growth as GDP rises." },
  { sym: "cI(t)", color: PARAM_COLOR.c, name: "GFCF contribution", text: "Contribution of Gross Fixed Capital Formation to GDP dynamics." },
];

const VARS = [
  ["Y(t)", "Real Gross Domestic Product"],
  ["I(t)", "Gross Fixed Capital Formation (GFCF)"],
  ["a", "Intrinsic growth parameter"],
  ["b", "Nonlinear growth constraint"],
  ["c", "GFCF effect parameter"],
];

export default function MathFormulation() {
  return (
    <section className="rounded-xl border border-slate-800 bg-ink-800 p-5 sm:p-6">
      <SectionHead
        n="02 · MATHEMATICAL FORMULATION"
        title="A nonlinear growth equation with capital formation"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="flex items-center justify-center rounded-lg border border-slate-800 bg-ink-900 px-4 py-10 sm:px-8 lg:col-span-3">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 font-serif italic text-slate-100">
            <span className="flex flex-col items-center text-2xl leading-none sm:text-3xl">
              <span className="border-b border-slate-500 px-1.5 pb-1">dY</span>
              <span className="px-1.5 pt-1">dt</span>
            </span>
            <span className="text-2xl not-italic text-slate-400 sm:text-3xl">=</span>
            <span className="text-2xl sm:text-4xl">
              <span style={{ color: PARAM_COLOR.a }}>aY</span>
              <span className="not-italic text-slate-400"> − </span>
              <span style={{ color: PARAM_COLOR.b }}>
                bY<sup className="not-italic">2</sup>
              </span>
              <span className="not-italic text-slate-400"> + </span>
              <span style={{ color: PARAM_COLOR.c }}>cI(t)</span>
            </span>
          </div>
        </div>

        <dl className="grid grid-cols-[auto_1fr] content-center gap-x-4 gap-y-2 text-sm lg:col-span-2">
          {VARS.map(([t, d]) => (
            <div key={t} className="contents">
              <dt className="font-serif italic text-slate-100">{t}</dt>
              <dd className="text-slate-400">{d}</dd>
            </div>
          ))}
        </dl>
      </div>

      <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {TERMS.map((t) => (
          <li key={t.sym} className="border-t-2 pt-3" style={{ borderColor: t.color }}>
            <p className="font-serif text-lg italic" style={{ color: t.color }}>{t.sym}</p>
            <p className="text-xs font-medium text-slate-200">{t.name}</p>
            <p className="mt-0.5 text-xs leading-snug text-slate-400">{t.text}</p>
          </li>
        ))}
      </ul>

      <p className="mt-5 max-w-3xl text-xs leading-relaxed text-slate-500">
        a, b and c are estimated coefficients of this equation. The model is a descriptive fit; c is not interpreted
        here as a causal effect or an elasticity.
      </p>
    </section>
  );
}
