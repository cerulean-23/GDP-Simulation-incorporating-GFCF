import { useFred } from "../../context/FredContext";
import { buildEvaluationRows, downloadFredCsv, downloadFredExcel } from "../../utils/fredExport";

const fx = (v, d) => (Number.isFinite(v) ? (Math.abs(v) >= 1e9 ? v.toExponential(2) : v.toFixed(d)) : "—");

const BTN =
  "rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:border-slate-500 disabled:opacity-40";

export default function FredEvaluationTable() {
  const { result } = useFred();
  const rows = buildEvaluationRows(result);
  const unit = result.fred.dataset.unit_label;

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0F1729] p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-semibold tracking-wide text-blue-400">EVALUATION TABLE</h3>
          <p className="text-xs text-slate-500">
            One row per predicted quarter ({rows.length}); values in {unit}.
          </p>
        </div>
        <div className="flex gap-2">
          <button className={BTN} onClick={() => downloadFredExcel(result)}>
            Export Excel
          </button>
          <button className={BTN} onClick={() => downloadFredCsv(result)}>
            Export CSV
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-auto rounded-md border border-slate-800">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead className="sticky top-0 bg-[#0F1729] text-slate-400">
            <tr className="border-b border-slate-800">
              {["Period", "Actual", "Predicted", "a", "b", "c", "Abs. error", "APE (%)", "Phase"].map((h) => (
                <th key={h} className="px-3 py-2 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.period} className="border-b border-slate-800/50 text-slate-300">
                <td className="px-3 py-1.5 text-slate-100">{r.period}</td>
                <td className="px-3 py-1.5">{fx(r.actual, 2)}</td>
                <td className="px-3 py-1.5">{fx(r.predicted, 2)}</td>
                <td className="px-3 py-1.5">{fx(r.a, 4)}</td>
                <td className="px-3 py-1.5">{r.b.toExponential(2)}</td>
                <td className="px-3 py-1.5">{fx(r.c, 4)}</td>
                <td className="px-3 py-1.5">{fx(r.absError, 2)}</td>
                <td className="px-3 py-1.5">{fx(r.apePct, 4)}</td>
                <td className={`px-3 py-1.5 ${r.phase === "Fitting" ? "text-yellow-400" : "text-red-400"}`}>{r.phase}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
