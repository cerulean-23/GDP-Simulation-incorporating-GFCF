import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useSimulation } from "../context/SimulationContext";
import { useFred } from "../context/FredContext";
import { downloadJson } from "../utils/exportJson";
import { downloadExcel } from "../utils/exportExcel";
import { downloadPdf } from "../utils/exportPdf";
import { downloadFredJson, downloadFredExcel } from "../utils/fredExport";
import { downloadFredPdf } from "../utils/exportFredPdf";
import Footer from "../components/Footer";

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

const ANNUAL_OPTIONS = [
  { key: "json", label: "JSON", hint: "Raw result data" },
  { key: "excel", label: "Excel (.xlsx)", hint: "Summary, forecast, parameters" },
  { key: "pdf", label: "PDF Report", hint: "Full Model & Metrics report" },
];

const FRED_OPTIONS = [
  { key: "json", label: "JSON", hint: "Raw quarterly result data" },
  { key: "excel", label: "Excel (.xlsx)", hint: "Summary and evaluation table" },
  { key: "pdf", label: "PDF Report", hint: "Quarterly (FRED) report" },
];

/**
 * Header export dropdown. Generic over WHICH result it exports: the annual
 * page and the FRED page each pass their own result, option hints and
 * exporters, so the two flows never export each other's data.
 */
function ExportMenu({ result, options, onExport }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const rootRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSelect(format) {
    if (!result) return;
    setBusy(true);
    setOpen(false);
    setError(null);
    try {
      onExport(format);
    } catch (e) {
      console.error("Export failed:", e);
      setError(`Export failed: ${e?.message || "unknown error"}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => result && setOpen((o) => !o)}
        disabled={!result || busy}
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
        {busy ? "Exporting..." : "Export Results"}
      </button>

      {error && (
        <div
          role="alert"
          onClick={() => setError(null)}
          className="absolute right-0 z-20 mt-1 w-72 cursor-pointer rounded-md border border-red-900/60 bg-[#1a0f14] px-3 py-2 text-xs text-red-300 shadow-lg"
        >
          {error}
        </div>
      )}

      {open && (
        <div className="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-md border border-slate-700 bg-[#0F1729] shadow-lg">
          {options.map((opt) => (
            <button
              key={opt.key}
              onClick={() => handleSelect(opt.key)}
              className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-slate-800"
            >
              <span className="text-sm text-slate-100">{opt.label}</span>
              <span className="text-[11px] text-slate-500">{opt.hint}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AnnualExportButton() {
  const { result, settings, dataCountry } = useSimulation();
  return (
    <ExportMenu
      result={result}
      options={ANNUAL_OPTIONS}
      onExport={(format) => {
        if (format === "json") downloadJson(result, dataCountry);
        else if (format === "excel") downloadExcel(result, settings, dataCountry);
        else if (format === "pdf") downloadPdf(result, settings, dataCountry);
      }}
    />
  );
}

function FredExportButton() {
  const { result } = useFred();
  return (
    <ExportMenu
      result={result}
      options={FRED_OPTIONS}
      onExport={(format) => {
        if (format === "json") downloadFredJson(result);
        else if (format === "excel") downloadFredExcel(result);
        else if (format === "pdf") downloadFredPdf(result);
      }}
    />
  );
}

export default function Layout() {
  // The header export follows the page: annual result on / and /metrics,
  // quarterly FRED result on /fred.
  const onFredPage = useLocation().pathname.startsWith("/fred");
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
              NONLINEAR GDP GROWTH SIMULATION
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
          <NavLink to="/fred" className={navClass}>
            Quarterly (FRED)
          </NavLink>
        </nav>

        {onFredPage ? <FredExportButton /> : <AnnualExportButton />}
      </header>

      <main className="px-6 py-6">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
