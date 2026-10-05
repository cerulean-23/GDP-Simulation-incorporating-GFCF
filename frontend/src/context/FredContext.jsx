import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { validateFredConfig } from "../utils/fredValidation";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";
const WS_BASE = import.meta.env.VITE_WS_BASE || "ws://127.0.0.1:8000";

// Separate from the annual flow's session id; backend keys it as "fred:{id}".
const SESSION_ID = crypto.randomUUID();

export const FredContext = createContext(null);

async function errorDetail(res) {
  try {
    const body = await res.json();
    return body.detail || `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

// Bundled default result + data, produced by backend/scripts/precompute_fred_default.py.
// Loaded lazily so it stays out of the main bundle until needed.
async function loadSnapshot() {
  const mod = await import("../data/fredDefault.json");
  return mod.default;
}

function configFromDefaults(d) {
  return {
    bounds: { a: [...d.bounds.a], b: [...d.bounds.b], c: [...d.bounds.c] },
    population_size: d.population_size,
    max_iterations: d.max_iterations,
    window: d.window,
    split_ratio: d.split_ratio,
  };
}

/**
 * State for the quarterly FRED page. Deliberately independent from
 * SimulationContext: it never writes to countryMape (that map compares annual
 * results across countries) and never touches the annual result.
 * `config` is the PENDING form; `result.fred.config` is what actually ran.
 */
export function FredProvider({ children }) {
  const [meta, setMeta] = useState(null); // { datasets, defaults, limits, scale }
  const [dataset, setDataset] = useState(null); // { meta, dates, period_labels, gdp, gfcf }
  const [config, setConfig] = useState(null);
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | idle | running | done | error
  const [errorMessage, setErrorMessage] = useState(null);
  // offline: backend unreachable at load time, page is running from the bundled snapshot data.
  const [offline, setOffline] = useState(false);
  // where the CURRENT result came from: "run" (live backend) or "snapshot" (bundled)
  const [resultSource, setResultSource] = useState(null);
  const [snapshotInfo, setSnapshotInfo] = useState(null);
  const socketRef = useRef(null);

  const loadInitial = useCallback(async () => {
    setStatus("loading");
    setErrorMessage(null);
    try {
      const metaRes = await fetch(`${API_BASE}/api/fred/datasets`);
      if (!metaRes.ok) throw new Error(await errorDetail(metaRes));
      const m = await metaRes.json();
      const dataRes = await fetch(`${API_BASE}/api/fred/data/${m.defaults.dataset_id}`);
      if (!dataRes.ok) throw new Error(await errorDetail(dataRes));
      const d = await dataRes.json();
      setMeta(m);
      setDataset(d);
      setConfig(configFromDefaults(m.defaults));
      setOffline(false);
      setStatus("idle");
    } catch (e) {
      // Backend unreachable: fall back to the bundled data so the page (and the
      // precomputed thesis result) still work. Custom runs need the server.
      try {
        const snap = await loadSnapshot();
        setMeta(snap.meta);
        setDataset(snap.dataset);
        setConfig(configFromDefaults(snap.meta.defaults));
        setOffline(true);
        setStatus("idle");
      } catch {
        setErrorMessage(`Could not load FRED data: ${e.message}`);
        setStatus("error");
      }
    }
  }, []);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const resetConfig = useCallback(() => {
    if (meta) setConfig(configFromDefaults(meta.defaults));
  }, [meta]);

  const run = useCallback(() => {
    if (!meta || !dataset || !config) return;
    const errors = validateFredConfig(config, meta.limits, dataset.gdp.length);
    if (errors.length) {
      setErrorMessage(errors.join(" "));
      setStatus("error");
      return;
    }

    if (socketRef.current) {
      socketRef.current.cancelled = true;
      socketRef.current.close();
    }
    setResult(null);
    setResultSource(null);
    setProgress(null);
    setErrorMessage(null);
    setStatus("running");

    let finished = false;
    const fail = (message) => {
      if (finished) return;
      finished = true;
      setErrorMessage(message);
      setStatus("error");
    };

    const ws = new WebSocket(`${WS_BASE}/ws/fred/${SESSION_ID}`);
    socketRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          dataset_id: dataset.meta.id,
          bounds: config.bounds,
          population_size: config.population_size,
          max_iterations: config.max_iterations,
          window: config.window,
          split_ratio: config.split_ratio,
        })
      );
    };
    ws.onmessage = (event) => {
      if (ws.cancelled) return;
      const msg = JSON.parse(event.data);
      if (msg.type === "progress") {
        setProgress(msg);
      } else if (msg.type === "done") {
        finished = true;
        setResult(msg.result);
        setResultSource("run");
        setStatus("done");
        ws.close();
      } else if (msg.type === "error") {
        fail(msg.message);
        ws.close();
      }
    };
    ws.onerror = () => {
      if (!ws.cancelled) fail("Simulation connection failed. Is the backend running?");
    };
    ws.onclose = () => {
      if (socketRef.current === ws) socketRef.current = null;
      if (!ws.cancelled) fail("Connection closed before the simulation finished.");
    };
  }, [meta, dataset, config]);

  // Instant, no server computation: shows the precomputed default result.
  const loadThesisResult = useCallback(async () => {
    try {
      const snap = await loadSnapshot();
      if (socketRef.current) {
        socketRef.current.cancelled = true;
        socketRef.current.close();
        socketRef.current = null;
      }
      // keep the page usable even if the initial backend load never succeeded
      setMeta((m) => m ?? snap.meta);
      setDataset((d) => d ?? snap.dataset);
      setConfig((c) => c ?? configFromDefaults(snap.meta.defaults));
      setResult(snap.result);
      setResultSource("snapshot");
      setSnapshotInfo(snap.snapshot);
      setProgress(null);
      setErrorMessage(null);
      setStatus("done");
    } catch (e) {
      setErrorMessage(`Could not load the bundled result: ${e.message}`);
      setStatus("error");
    }
  }, []);

  const cancel = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.cancelled = true;
      socketRef.current.close();
      socketRef.current = null;
    }
    setProgress(null);
    setErrorMessage(null);
    setStatus("idle");
  }, []);

  const value = {
    meta,
    dataset,
    config,
    setConfig,
    resetConfig,
    result,
    progress,
    status,
    errorMessage,
    run,
    cancel,
    loadThesisResult,
    offline,
    resultSource,
    snapshotInfo,
    retryLoad: loadInitial,
  };

  return <FredContext.Provider value={value}>{children}</FredContext.Provider>;
}

export function useFred() {
  const ctx = useContext(FredContext);
  if (!ctx) throw new Error("useFred must be used inside FredProvider");
  return ctx;
}
