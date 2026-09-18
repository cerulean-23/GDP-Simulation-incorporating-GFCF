import { createContext, useContext, useState, useCallback, useEffect } from "react";

// One session id per browser tab load — used both for the backend's
// in-memory session cache and to key the WebSocket connection.
const SESSION_ID = crypto.randomUUID();

const SimulationContext = createContext(null);

const DEFAULT_BOUNDS = { a: [-0.5, 0.5], b: [1e-9, 0.1], c: [0.0, 1.0] };

const DEFAULT_SETTINGS = {
  dataSource: "World Bank Open Data",
  startYear: 1990,
  endYear: 2020,
  countryCode: "IDN",
  countryName: "Indonesia",
  bounds: DEFAULT_BOUNDS,
  populationSize: 50,
  maxIterations: 1000,
  window: 3,
  stepSize: 1.0,
};

const MAPE_STORAGE_KEY = "solow-swan-country-mape";
const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

function loadStoredMape() {
  try {
    const raw = localStorage.getItem(MAPE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function SimulationProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [rawData, setRawData] = useState(null); // { years, gdp, gfcf }
  // Which country rawData (and therefore any result) actually belongs to —
  // deliberately separate from settings.countryCode, which is just the
  // pending selection for the *next* fetch. Without this split, clicking a
  // new country on the map instantly relabels stale results as if they
  // were freshly computed for it.
  const [dataCountry, setDataCountry] = useState(null); // { code, name, source }
  const [result, setResultState] = useState(null); // full SimulationResult from backend
  const [progress, setProgress] = useState(null); // latest progress message
  const [status, setStatus] = useState("idle"); // idle | loading-data | running | done | error
  const [errorMessage, setErrorMessage] = useState(null);

  // Accumulates { [alpha3]: { mape, name } } across every simulation run
  // this session (and previous ones, via localStorage) so the choropleth
  // map fills in as more countries get simulated — it's not a preloaded
  // heatmap, it's built from what's actually been run.
  const [countryMape, setCountryMape] = useState(loadStoredMape);

  // On first mount, merge in the precomputed seed set (curated major
  // economies) so the map opens already colored. User-run results always
  // win over seed values — this only fills in countries not already run.
  useEffect(() => {
    fetch(`${API_BASE}/api/seed-mape`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((seed) => {
        if (!seed || Object.keys(seed).length === 0) return;
        setCountryMape((prev) => ({ ...seed, ...prev }));
      })
      .catch((err) => {
        // Backend not reachable yet or seed endpoint missing — fine,
        // map just stays as whatever was already in localStorage.
        console.warn("Seed MAPE fetch failed:", err);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem(MAPE_STORAGE_KEY, JSON.stringify(countryMape));
  }, [countryMape]);

  const resetResult = useCallback(() => {
    setResultState(null);
    setProgress(null);
    setStatus("idle");
    setErrorMessage(null);
  }, []);

  // Sets rawData together with which country it belongs to, and clears any
  // previous result — the single entry point DataConfigPanel uses after a
  // successful fetch/upload, so "loaded data" and "its label" can never
  // drift apart.
  const loadData = useCallback(
    (data, code, name, source) => {
      setRawData(data);
      setDataCountry({ code, name, source });
      resetResult();
    },
    [resetResult]
  );

  // Wraps setResult so completing a run also records that country's MAPE —
  // keyed off dataCountry (what was actually simulated), not settings
  // .countryCode, which may have moved on to a different pending selection
  // by the time a long-running DE fit finishes.
  const setResult = useCallback(
    (newResult) => {
      setResultState(newResult);
      if (newResult && dataCountry) {
        setCountryMape((prev) => ({
          ...prev,
          [dataCountry.code]: {
            mape: newResult.mape_overall,
            name: dataCountry.name || dataCountry.code,
          },
        }));
      }
    },
    [dataCountry]
  );

  const value = {
    sessionId: SESSION_ID,
    settings,
    setSettings,
    rawData,
    setRawData,
    dataCountry,
    loadData,
    result,
    setResult,
    countryMape,
    progress,
    setProgress,
    status,
    setStatus,
    errorMessage,
    setErrorMessage,
    resetResult,
  };

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error("useSimulation must be used inside SimulationProvider");
  return ctx;
}
