export default function ConfigSummary({ settings, result }) {
  const rows = [
    ["Selected Region", settings.countryName || settings.countryCode],
    ["Optimization Algorithm", "Differential Evolution"],
    ["Simulation Period", `${settings.startYear} - ${settings.endYear}`],
    ["Population Size", settings.populationSize],
    ["Total Data Points", `${result.years.length} Years`],
    ["Max Iterations", settings.maxIterations],
    ["Data Frequency", "Annual"],
    ["Rolling Window (w)", `${settings.window} Years`],
    ["Currency", "Constant USD"],
    ["Step Size (h)", settings.stepSize],
  ];

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0F1729] p-5">
      <div className="grid grid-cols-1 gap-x-12 gap-y-3 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between text-sm">
            <span className="text-slate-400">{label}</span>
            <span className="font-medium text-slate-100">{value}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 flex items-start gap-2 text-xs text-slate-500">
        <span>ⓘ</span>
        All GDP values are in Real GDP (Constant USD) to ensure cross-country comparability.
      </p>
    </div>
  );
}
