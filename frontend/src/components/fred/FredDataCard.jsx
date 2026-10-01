import { useFred } from "../../context/FredContext";

export default function FredDataCard() {
  const { dataset } = useFred();
  const m = dataset.meta;
  const labels = dataset.period_labels;
  const rows = [
    ["Country", m.name],
    ["Source", m.source],
    ["GDP series", m.gdp_series],
    ["GFCF series", m.gfcf_series],
    ["Frequency", "Quarterly"],
    ["Data period", `${labels[0]}–${labels[labels.length - 1]}`],
    ["Observations", String(labels.length)],
    ["Raw unit", m.raw_unit],
    ["Chart unit", m.unit_label],
  ];
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0F1729] p-5">
      <h3 className="mb-3 text-xs font-semibold tracking-wide text-blue-400">DATA</h3>
      <dl className="space-y-2 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3 border-b border-slate-800 pb-2">
            <dt className="text-slate-400">{k}</dt>
            <dd className="text-right font-medium text-slate-100">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs text-slate-500">
        Bundled with the application — no upload or external request is needed.
      </p>
    </div>
  );
}
