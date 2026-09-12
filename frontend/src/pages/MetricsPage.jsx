import { useNavigate } from "react-router-dom";
import { useSimulation } from "../context/SimulationContext";
import MetricCards from "../components/MetricCards";
import ConfigSummary from "../components/ConfigSummary";
import SseChart from "../components/SseChart";
import ParameterTracksChart from "../components/ParameterTracksChart";
import ModelDescription from "../components/ModelDescription";

export default function MetricsPage() {
  const { result, settings } = useSimulation();
  const navigate = useNavigate();

  if (!result) {
    return (
      <div className="rounded-xl border border-slate-800 bg-[#0F1729] p-10 text-center">
        <p className="mb-4 text-sm text-slate-400">
          No simulation results yet. Run a simulation first on the Simulation page.
        </p>
        <button
          onClick={() => navigate("/")}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          Go to Simulation
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xs font-semibold tracking-wide text-blue-400">
        ALGORITHM PERFORMANCE METRICS
      </h2>
      <MetricCards result={result} />
      <ConfigSummary settings={settings} result={result} />
      <SseChart result={result} />
      <ParameterTracksChart result={result} />
      <ModelDescription />
    </div>
  );
}
