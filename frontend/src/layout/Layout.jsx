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
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="shrink-0">
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
    <div ref={rootRef} className="relative shrink-0">
      <button
        onClick={() => result && setOpen((o) => !o)}
        disabled={!result || busy}
        className="flex items-center gap-2 whitespace-nowrap rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 sm:px-4 transition-colors hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
          <path
            d="M8 2v8m0 0l-3-3m3 3l3-3M3 13h10"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {busy ? "Exporting..." : (
          <>
            Export<span className="hidden sm:inline"> Results</span>
          </>
        )}
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
        <div className="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-md border border-slate-700 bg-ink-800 shadow-lg">
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
  const { pathname } = useLocation();
  const onFredPage = pathname.startsWith("/fred");
  const navClass = ({ isActive }) =>
    `whitespace-nowrap border-b-2 pb-1 text-sm font-medium transition-colors ${
      isActive ? "border-blue-400 text-blue-400" : "border-transparent text-slate-400 hover:text-slate-200"
    }`;

  return (
    <div className="min-h-screen overflow-x-clip text-slate-100">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-slate-800 px-4 py-3 sm:px-6 sm:py-4 lg:flex-nowrap lg:justify-between">
        {/* Brand: shrinks and wraps its text instead of pushing the page wider */}
        <div className="order-1 flex min-w-0 flex-1 items-center gap-3 lg:flex-none">
          <ChartIcon />
          <div className="min-w-0">
            <h1 className="font-serif text-[15px] font-semibold leading-tight tracking-wide sm:text-lg">
              NONLINEAR GDP GROWTH SIMULATION
            </h1>
            <p className="mt-0.5 font-mono text-[10px] font-medium leading-tight tracking-wider text-blue-400 sm:text-[11px]">
              RK4 &middot; DIFFERENTIAL EVOLUTION &middot; GFCF
            </p>
          </div>
        </div>

        {/* Nav: own full-width row on mobile (scrolls sideways if too tight),
            sits between brand and export button on large screens */}
        <nav className="order-3 -mx-4 flex w-[calc(100%+2rem)] items-center gap-6 overflow-x-auto border-t border-slate-800/70 px-4 pt-3 sm:-mx-6 sm:w-[calc(100%+3rem)] sm:px-6 lg:order-2 lg:m-0 lg:w-auto lg:overflow-visible lg:border-0 lg:p-0">
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

        <div className="order-2 lg:order-3">
          {onFredPage ? <FredExportButton /> : <AnnualExportButton />}
        </div>
      </header>

      <main key={pathname} className="stagger mx-auto min-w-0 max-w-[1600px] px-4 py-4 sm:px-6 sm:py-6">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
