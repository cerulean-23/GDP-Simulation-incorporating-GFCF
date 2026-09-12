import { useCallback, useState } from "react";
import { useSimulation } from "../context/SimulationContext";
import { useSimulationSocket } from "./useSimulationSocket";
import { fetchCountryData } from "../api/client";

/**
 * Implements the requirement doc's "click a country on the map -> instantly
 * trigger algorithm calculation and render the projection curve" flow.
 * Fetches that country's data, then runs the simulation immediately with
 * the currently configured DE/RK4 settings — no extra clicks needed.
 */
export function useAutoRunOnMapClick() {
  const { settings, setSettings, setRawData, resetResult } = useSimulation();
  const { runSimulation } = useSimulationSocket();
  const [autoLoading, setAutoLoading] = useState(false);
  const [autoError, setAutoError] = useState(null);

  const runForCountry = useCallback(
    async (iso, name) => {
      setAutoLoading(true);
      setAutoError(null);
      resetResult();

      const nextSettings = { ...settings, countryCode: iso, countryName: name };
      setSettings(nextSettings);

      try {
        const data = await fetchCountryData(iso, settings.startYear, settings.endYear);
        setRawData(data);
        // Pass data + settings explicitly — context state from setSettings/setRawData
        // above won't be committed yet on this same tick, so runSimulation would
        // otherwise read stale values.
        runSimulation(data, nextSettings);
      } catch (e) {
        setAutoError(e.message);
      } finally {
        setAutoLoading(false);
      }
    },
    [settings, setSettings, setRawData, resetResult, runSimulation]
  );

  return { runForCountry, autoLoading, autoError };
}
