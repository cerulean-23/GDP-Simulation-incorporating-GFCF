import { useRef, useState } from "react";
import { useSimulation } from "../context/SimulationContext";
import { fetchCountryData, uploadFallbackData } from "../api/client";
import { alpha3ToName } from "../data/countryCodes";
import NumberInput from "./NumberInput";
import CountrySelect from "./CountrySelect";

export default function DataConfigPanel() {
  const { settings, setSettings, loadData, rawData, dataCountry } = useSimulation();
  const [loading, setLoading] = useState(false);
  const [busyKind, setBusyKind] = useState(null); // "api" | "csv" — UI label only
  const [error, setError] = useState(null);
  const [gdpFile, setGdpFile] = useState(null);
  const [gfcfFile, setGfcfFile] = useState(null);

  const gdpInputRef = useRef(null);
  const gfcfInputRef = useRef(null);

  async function handleFetchApi() {
    setBusyKind("api");
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
      setBusyKind(null);
    }
  }

  async function handleFallbackUpload() {
    if (!gdpFile || !gfcfFile) {
      setError("Select both GDP and GFCF CSV files first.");
      return;
    }
    setBusyKind("csv");
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
      setBusyKind(null);
    }
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-ink-800 p-5">
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
          <label className="mb-1 block text-xs text-slate-400">Historical period (annual data)</label>
          <div className="flex items-center gap-2">
            <NumberInput
              value={settings.startYear}
              onChange={(n) => setSettings((s) => ({ ...s, startYear: n }))}
              className="w-full rounded-md border border-slate-700 bg-ink-900 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
            />
            <span className="text-slate-500">–</span>
            <NumberInput
              value={settings.endYear}
              onChange={(n) => setSettings((s) => ({ ...s, endYear: n }))}
              className="w-full rounded-md border border-slate-700 bg-ink-900 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {settings.startYear >= settings.endYear && (
          <p className="text-[11px] text-yellow-400">⚠ Start year should be earlier than end year.</p>
        )}
        <p className="text-[11px] text-slate-500">
          Full period requested from the source. The estimation/forecast split is set by the rolling window.
        </p>

        <button
          onClick={handleFetchApi}
          disabled={loading}
          className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
        >
          {busyKind === "api" ? "Fetching from World Bank…" : "Fetch from World Bank API"}
        </button>

        <div className="border-t border-slate-800 pt-3">
          <p className="mb-2 text-xs text-slate-400">
            Offline fallback - upload World Bank CSV exports directly
          </p>
          <div className="space-y-2">
            <CsvSlot label="GDP" file={gdpFile} inputRef={gdpInputRef} onPick={setGdpFile} />
            <CsvSlot label="GFCF" file={gfcfFile} inputRef={gfcfInputRef} onPick={setGfcfFile} />
          </div>
          <button
            onClick={handleFallbackUpload}
            disabled={loading || !gdpFile || !gfcfFile}
            className="mt-2 w-full rounded-md border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busyKind === "csv" ? "Processing CSVs…" : "Use uploaded CSVs"}
          </button>
          {(!gdpFile || !gfcfFile) && (
            <p className="mt-1 text-[11px] text-slate-500">Both GDP and GFCF files are required.</p>
          )}
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}
        {!error && rawData && dataCountry && (
          <p className="text-xs text-green-400">
            ✓ Loaded <span className="font-medium">{dataCountry.name}</span> - {rawData.years.length} years (
            {rawData.years[0]}–{rawData.years[rawData.years.length - 1]})
            {dataCountry.source === "csv" && " · from uploaded CSVs"}
          </p>
        )}
        {rawData && dataCountry && settings.countryCode !== dataCountry.code && (
          <p className="text-xs text-yellow-400">
            ⚠ Selected country changed to {settings.countryCode} - click Fetch to load its data.
          </p>
        )}
      </div>
    </div>
  );
}

function CsvSlot({ label, file, inputRef, onPick }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-10 shrink-0 font-mono text-[11px] text-slate-400">{label}</span>
      <button
        onClick={() => inputRef.current?.click()}
        className={`flex-1 truncate rounded-md border px-3 py-2 text-left text-xs transition-colors ${
          file ? "border-green-700/60 text-green-300" : "border-dashed border-slate-700 text-slate-400 hover:border-slate-500"
        }`}
        title={file?.name}
      >
        {file ? `✓ ${file.name}` : `Choose ${label} CSV`}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
