import WorldMap from "../components/WorldMap";
import DataConfigPanel from "../components/DataConfigPanel";
import ModelParametersCard from "../components/ModelParametersCard";
import NumericalMethodCard from "../components/NumericalMethodCard";
import SimulationActionCard from "../components/SimulationActionCard";
import ResultsChart from "../components/ResultsChart";
import ParameterTracksChart from "../components/ParameterTracksChart";
import WorkflowSteps from "../components/WorkflowSteps";
import { useSimulation } from "../context/SimulationContext";

export default function SimulationPage() {
  const { settings, setSettings, countryMape, dataCountry, result } = useSimulation();

  return (
    <div className="space-y-4">
      {/* 1. Simulation Workflow */}
      <WorkflowSteps />

      {/* 2. Global Model Error Map */}
      <section className="rounded-xl border border-slate-800 bg-ink-800 p-5">
        <h3 className="mb-1 text-xs font-semibold tracking-wide text-blue-400">
          GLOBAL MODEL ERROR — MAPE
        </h3>
        <p className="mb-3 text-xs text-slate-500">
          Lower MAPE means smaller percentage prediction error. Click a country to select it, then fetch data and run
        </p>
        <WorldMap
          countryMape={countryMape}
          selectedIso={settings.countryCode}
          onSelectCountry={(iso, name) =>
            setSettings((s) => ({ ...s, countryCode: iso, countryName: name }))
          }
        />
      </section>

      {/* 3. Simulation Configuration - Data | Model Parameters | Numerical Method */}
      <div>
        <h2 className="mb-3 text-xs font-semibold tracking-wide text-slate-400">
          SIMULATION CONFIGURATION
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <DataConfigPanel />
          <ModelParametersCard />
          <NumericalMethodCard />
        </div>
      </div>

      {/* 4. Simulation Action */}
      <SimulationActionCard />

      {/* 5. Simulation Results */}
      <section id="simulation-results" className="scroll-mt-4 rounded-xl border border-slate-800 bg-ink-800 p-5">
        <h3 className="mb-4 text-xs font-semibold tracking-wide text-blue-400">
          SIMULATION RESULTS{dataCountry ? ` - ${dataCountry.name?.toUpperCase() || dataCountry.code}` : ""}
        </h3>
        <ResultsChart />
      </section>

      {/* 6. Parameter Estimates Over Time */}
      {result && <ParameterTracksChart result={result} title="ESTIMATED PARAMETER VALUES BY ROLLING WINDOW" />}
    </div>
  );
}
