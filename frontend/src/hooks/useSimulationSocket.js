import { useCallback, useRef } from "react";
import { useSimulation } from "../context/SimulationContext";

// Change this when deploying — local FastAPI dev server by default.
const WS_BASE = import.meta.env.VITE_WS_BASE || "ws://127.0.0.1:8000";

export function useSimulationSocket() {
  const {
    sessionId,
    rawData,
    settings,
    setResult,
    setProgress,
    setStatus,
    setErrorMessage,
  } = useSimulation();

  const socketRef = useRef(null);

  const runSimulation = useCallback(
    (overrideData, overrideSettings) => {
      const data = overrideData || rawData;
      const cfg = overrideSettings || settings;

      if (!data) {
        setErrorMessage("No data loaded yet — fetch or upload GDP/GFCF data first.");
        setStatus("error");
        return;
      }

      setStatus("running");
      setProgress(null);
      setErrorMessage(null);

      const ws = new WebSocket(`${WS_BASE}/ws/simulate/${sessionId}`);
      socketRef.current = ws;

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            years: data.years,
            gdp: data.gdp,
            gfcf: data.gfcf,
            bounds: cfg.bounds,
            population_size: cfg.populationSize,
            max_iterations: cfg.maxIterations,
            window: cfg.window,
            step_size: cfg.stepSize,
          })
        );
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === "progress") {
          setProgress(msg);
        } else if (msg.type === "done") {
          setResult(msg.result);
          setStatus("done");
          ws.close();
        } else if (msg.type === "error") {
          setErrorMessage(msg.message);
          setStatus("error");
          ws.close();
        }
      };

      ws.onerror = () => {
        setErrorMessage("Simulation connection failed. Is the backend running?");
        setStatus("error");
      };

      ws.onclose = () => {
        socketRef.current = null;
      };
    },
    [rawData, settings, sessionId, setResult, setProgress, setStatus, setErrorMessage]
  );

  const cancelSimulation = useCallback(() => {
    socketRef.current?.close();
    setStatus("idle");
  }, [setStatus]);

  return { runSimulation, cancelSimulation };
}
