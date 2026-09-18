const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

async function parseError(res) {
  try {
    const body = await res.json();
    return body.detail || `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

export async function fetchCountryData(countryCode, startYear, endYear) {
  const res = await fetch(
    `${API_BASE}/api/data/${countryCode}?start_year=${startYear}&end_year=${endYear}`
  );
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function uploadFallbackData(gdpFile, gfcfFile, countryCode, startYear, endYear) {
  const form = new FormData();
  form.append("gdp_file", gdpFile);
  form.append("gfcf_file", gfcfFile);
  form.append("country_code", countryCode);
  if (startYear != null) form.append("start_year", startYear);
  if (endYear != null) form.append("end_year", endYear);
  const res = await fetch(`${API_BASE}/api/data/upload-fallback`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function fetchCachedResult(sessionId) {
  const res = await fetch(`${API_BASE}/api/results/${sessionId}`);
  if (!res.ok) return { cached: false };
  return res.json();
}
