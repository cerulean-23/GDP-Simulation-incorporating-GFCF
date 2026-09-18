import { useRef, useState } from "react";
import { useSimulation } from "../context/SimulationContext";
import { fetchCountryData, uploadFallbackData } from "../api/client";
import { alpha3ToName } from "../data/countryCodes";
import NumberInput from "./NumberInput";
import CountrySelect from "./CountrySelect";

export default function DataConfigPanel() {
  const { settings, setSettings, loadData, rawData, dataCountry } = useSimulation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [gdpFile, setGdpFile] = useState(null);
  const [gfcfFile, setGfcfFile] = useState(null);

  const gdpInputRef = useRef(null);
  const gfcfInputRef = useRef(null);

  async function handleFetchApi() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCountryData(settings.countryCode, settings.startYear, settings.endYear);
      const resolvedName = alpha3ToName[settings.countryCode.toUpperCase()] || settings.countryCode;
      loadData(data, settings.countryCode, resolvedName, "api");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleFallbackUpload() {
    if (!gdpFile || !gfcfFile) {
      setError("Select both GDP and GFCF CSV files first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await uploadFallbackData(
        gdpFile,
        gfcfFile,
        settings.countryCode,
        settings.startYear,
        settings.endYear
      );
      loadData(data, settings.countryCode, data.matched_country_name, "csv");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0F1729] p-5">
      <h3 className="mb-4 text-xs font-semibold tracking-wide text-blue-400">
        DATA CONFIGURATION
      </h3>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs text-slate-400">Country</label>
          <CountrySelect
            value={settings.countryCode}
            onChange={(code, name) => setSettings((s) => ({ ...s, countryCode: code, countryName: name }))}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-slate-400">Time Range</label>
          <div className="flex items-center gap-2">
            <NumberInput
              value={settings.startYear}
              onChange={(n) => setSettings((s) => ({ ...s, startYear: n }))}
              className="w-full rounded-md border border-slate-700 bg-[#0A0F1E] px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
            />
            <span className="text-slate-500">–</span>
            <NumberInput
              value={settings.endYear}
              onChange={(n) => setSettings((s) => ({ ...s, endYear: n }))}
              className="w-full rounded-md border border-slate-700 bg-[#0A0F1E] px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <button
          onClick={handleFetchApi}
          disabled={loading}
          className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Fetch from World Bank API"}
        </button>

        <div className="border-t border-slate-800 pt-3">
          <p className="mb-2 text-xs text-slate-400">
            Offline fallback — upload World Bank CSV exports directly
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => gdpInputRef.current?.click()}
              className="flex-1 truncate rounded-md border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:border-slate-500"
            >
              {gdpFile ? gdpFile.name : "Upload GDP CSV"}
            </button>
            <input
              ref={gdpInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => setGdpFile(e.target.files?.[0] ?? null)}
            />

            <button
              onClick={() => gfcfInputRef.current?.click()}
              className="flex-1 truncate rounded-md border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:border-slate-500"
            >
              {gfcfFile ? gfcfFile.name : "Upload GFCF CSV"}
            </button>
            <input
              ref={gfcfInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => setGfcfFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <button
            onClick={handleFallbackUpload}
            disabled={loading}
            className="mt-2 w-full rounded-md border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:border-slate-500 disabled:opacity-50"
          >
            Use uploaded CSVs
          </button>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}
        {!error && rawData && dataCountry && (
          <p className="text-xs text-green-400">
            ✓ Loaded <span className="font-medium">{dataCountry.name}</span> — {rawData.years.length} years (
            {rawData.years[0]}–{rawData.years[rawData.years.length - 1]})
            {dataCountry.source === "csv" && " · from uploaded CSVs"}
          </p>
        )}
        {rawData && dataCountry && settings.countryCode !== dataCountry.code && (
          <p className="text-xs text-yellow-400">
            ⚠ Selected country changed to {settings.countryCode} — click Fetch to load its data.
          </p>
        )}
      </div>
    </div>
  );
}
