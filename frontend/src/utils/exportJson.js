export function downloadJson(result, dataCountry) {
  const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `nonlinear-gdp-simulation-${dataCountry?.code || "result"}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
