import WorldMap from "../components/WorldMap";
import DataConfigPanel from "../components/DataConfigPanel";
import SettingsPanel from "../components/SettingsPanel";
import SystemStatus from "../components/SystemStatus";
import ResultsChart from "../components/ResultsChart";
import { useSimulation } from "../context/SimulationContext";

export default function SimulationPage() {
  const { settings, setSettings, countryMape } = useSimulation();

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-800 bg-[#0F1729] p-5">
        <h3 className="mb-1 text-xs font-semibold tracking-wide text-blue-400">
          GLOBAL MAP: PREDICTION ACCURACY (MAPE)
        </h3>
        <p className="mb-3 text-xs text-slate-500">
          Colors represent overall MAPE (lower is better) — click a country to select it, then fetch data and run
        </p>
        <WorldMap
          countryMape={countryMape}
          selectedIso={settings.countryCode}
          onSelectCountry={(iso, name) =>
            setSettings((s) => ({ ...s, countryCode: iso, countryName: name }))
          }
        />
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <DataConfigPanel />
        <div className="md:col-span-3">
          <SettingsPanel />
        </div>
      </section>

      <SystemStatus />

      <section className="rounded-xl border border-slate-800 bg-[#0F1729] p-5">
        <h3 className="mb-4 text-xs font-semibold tracking-wide text-blue-400">
          SIMULATION RESULTS: {settings.countryName?.toUpperCase() || settings.countryCode}
        </h3>
        <ResultsChart />
      </section>
    </div>
  );
}
