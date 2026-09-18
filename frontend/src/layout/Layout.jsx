import { NavLink, Outlet } from "react-router-dom";
import { useSimulation } from "../context/SimulationContext";

function ChartIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="7" fill="#1E3A8A" />
      <path
        d="M7 19L11 14L14.5 17L21 9"
        stroke="#60A5FA"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ExportButton() {
  const { result } = useSimulation();

  const handleExport = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "solow-swan-results.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      disabled={!result}
      className="flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 transition-colors hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M8 2v8m0 0l-3-3m3 3l3-3M3 13h10"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Export Results
    </button>
  );
}

export default function Layout() {
  const navClass = ({ isActive }) =>
    `text-sm font-medium transition-colors ${
      isActive ? "text-blue-400" : "text-slate-400 hover:text-slate-200"
    }`;

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <ChartIcon />
          <div>
            <h1 className="text-base font-semibold leading-tight tracking-tight">
              NONLINEAR ODE GDP GROWTH SIMULATION
            </h1>
            <p className="text-[11px] font-medium leading-tight text-blue-400">
              RK4 &middot; DIFFERENTIAL EVOLUTION &middot; GFCF
            </p>
          </div>
        </div>

        <nav className="flex items-center gap-6">
          <NavLink to="/" end className={navClass}>
            Simulation
          </NavLink>
          <NavLink to="/metrics" className={navClass}>
            Model &amp; Metrics
          </NavLink>
        </nav>

        <ExportButton />
      </header>

      <main className="px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
