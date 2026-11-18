import { useNavigate } from "react-router-dom";
import { useSimulation } from "../context/SimulationContext";
import ModelSummary from "../components/ModelSummary";
import MathFormulation from "../components/MathFormulation";
import ModelConfiguration from "../components/ModelConfiguration";
import MethodologyPipeline from "../components/MethodologyPipeline";
import PerformanceSummary from "../components/PerformanceSummary";
import ForecastChart from "../components/ForecastChart";
import SectionHead from "../components/SectionHead";
import SseChart from "../components/SseChart";
import ParameterTracksChart from "../components/ParameterTracksChart";

export default function MetricsPage() {
  const { result, settings, dataCountry, status } = useSimulation();
  const navigate = useNavigate();

  if (!result) {
    return (
      <div className="rounded-xl border border-slate-800 bg-ink-800 p-10 text-center">
        {status === "running" ? (
          <p className="mb-4 text-sm text-slate-400">Simulation in progress - results will appear here once complete.</p>
        ) : (
          <>
            <p className="mb-1 text-sm font-semibold tracking-wide text-slate-300">NO SIMULATION RESULTS</p>
            <p className="mb-4 text-sm text-slate-500">
              Run a simulation from the Simulation page to view model metrics and parameter estimates.
            </p>
            <button
              onClick={() => navigate("/")}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
            >
              Go to Simulation
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ModelSummary settings={settings} result={result} dataCountry={dataCountry} />
      <MathFormulation />
      <ModelConfiguration settings={settings} result={result} />
      <MethodologyPipeline />
      <ForecastChart result={result} />

      <section className="space-y-4 rounded-xl border border-slate-800 bg-ink-800 p-5 sm:p-6">
        <SectionHead
          n="06 · ERROR ANALYSIS"
          title="How large are the forecast errors?"
          lede="Metrics cover the step-ahead forecasts over the evaluation period."
        />
        <PerformanceSummary result={result} />
        <SseChart result={result} />
      </section>

      <section className="space-y-4">
        <SectionHead
          n="07 · PARAMETER ESTIMATION"
          title="Estimated parameters across rolling windows"
        />
        <ParameterTracksChart result={result} window={settings.window} />
      </section>
    </div>
  );
}
