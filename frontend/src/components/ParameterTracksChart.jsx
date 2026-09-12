import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const PARAMS = [
  { key: "a_track", label: "Parameter a (Intrinsic Growth)", color: "#22C55E" },
  { key: "b_track", label: "Parameter b (Growth Limiting)", color: "#3B82F6" },
  { key: "c_track", label: "Parameter c (Effect of GFCF)", color: "#A855F7" },
];

export default function ParameterTracksChart({ result }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0F1729] p-5">
      <h3 className="mb-4 text-xs font-semibold tracking-wide text-blue-400">
        OPTIMIZATION: PARAMETER CHANGES OVER TIME
      </h3>
      <div className="space-y-6">
        {PARAMS.map(({ key, label, color }) => {
          const data = result.years
            .map((year, i) => ({ year, value: result[key][i] }))
            .filter((p) => p.value != null);

          return (
            <div key={key}>
              <p className="mb-1 text-xs text-slate-400">{label}</p>
              <ResponsiveContainer width="100%" height={110}>
                <LineChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="year" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} width={40} />
                  <Tooltip
                    contentStyle={{ background: "#0F1729", border: "1px solid #1E293B", fontSize: 12 }}
                    formatter={(v) => v.toFixed(5)}
                  />
                  <Line type="monotone" dataKey="value" stroke={color} dot={{ r: 1.5 }} strokeWidth={1.5} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          );
        })}
      </div>
    </div>
  );
}
