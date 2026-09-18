import { useEffect, useRef, useState } from "react";
import { alpha3ToName } from "../data/countryCodes";

// Reuses the exact same country list already powering the map — no new
// data source, no invented countries. Keys are the alpha-3 codes the
// backend/World Bank API already expects.
const COUNTRY_OPTIONS = Object.entries(alpha3ToName)
  .map(([code, name]) => ({ code, name }))
  .sort((a, b) => a.name.localeCompare(b.name));

export default function CountrySelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);

  const currentName = alpha3ToName[value?.toUpperCase()] || value || "Select a country";

  const filtered =
    query.trim() === ""
      ? COUNTRY_OPTIONS
      : COUNTRY_OPTIONS.filter(
          (c) =>
            c.name.toLowerCase().includes(query.toLowerCase()) ||
            c.code.toLowerCase().includes(query.toLowerCase())
        );

  useEffect(() => {
    function handleClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function select(code, name) {
    onChange(code, name);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-md border border-slate-700 bg-[#0A0F1E] px-3 py-2 text-left text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
      >
        <span className="truncate">{currentName}</span>
        <svg width="14" height="14" viewBox="0 0 14 14" className="ml-2 shrink-0 text-slate-500">
          <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-slate-700 bg-[#0F1729] shadow-lg">
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search country..."
            className="w-full border-b border-slate-800 bg-transparent px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-xs text-slate-500">No matching country.</p>
            )}
            {filtered.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => select(c.code, c.name)}
                className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-sm hover:bg-slate-800 ${
                  c.code === value?.toUpperCase() ? "text-blue-400" : "text-slate-200"
                }`}
              >
                <span className="truncate">{c.name}</span>
                <span className="ml-2 shrink-0 text-[10px] text-slate-500">{c.code}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
