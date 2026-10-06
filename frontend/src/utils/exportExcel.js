import * as XLSX from "xlsx";
import { computeRmse, computeForecastRange, computeTotalSse } from "./metrics";
import { computeActualDataRange } from "./metrics";

/**
 * Builds a 3-sheet workbook from the exact same data already shown on
 * Page 1 / Page 2 — no new calculations beyond the existing client-side
 * RMSE derivation already used elsewhere.
 */
export function downloadExcel(result, settings, dataCountry) {
  const rmse = computeRmse(result.y_actual, result.y_pred);
  const forecastRange = computeForecastRange(result);

  // --- Sheet 1: Summary ---
  const summaryRows = [
    ["NONLINEAR GDP GROWTH SIMULATION"],
    ["RK4 · Differential Evolution · GFCF"],
    [],
    ["Selected Country", dataCountry?.name || dataCountry?.code || ""],
    ["Currency", "Constant 2015 US$"],
    ["Data Type", "Real GDP + GFCF"],
    // ["Data Period", `${settings.startYear}-${settings.endYear}`],
    ["Data Period", computeActualDataRange(result, "-") ?? "-"],
    ["Frequency", "Annual"],
    ["Rolling Window (w)", `${settings.window} years`],
    ["Forecast Evaluation Period", forecastRange],
    [],
    ["Model", "dY/dt = aY - bY^2 + cI(t)"],
    ["a = Intrinsic Growth", `search range ${settings.bounds.a[0]} to ${settings.bounds.a[1]}`],
    ["b = Growth Constraint", `search range ${settings.bounds.b[0]} to ${settings.bounds.b[1]}`],
    ["c = GFCF Effect", `search range ${settings.bounds.c[0]} to ${settings.bounds.c[1]}`],
    [],
    ["Numerical Integration", "RK4"],
    ["Step Size (h)", settings.stepSize],
    ["Optimization", "Differential Evolution"],
    ["Population Size", settings.populationSize],
    ["Max Iterations", settings.maxIterations],
    [],
    ["MAPE (%)", result.mape_overall],
    ["RMSE (constant 2015 US$)", rmse],
    ["SSE (total)", computeTotalSse(result)],
    ["R2", result.r2_overall],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
  summarySheet["!cols"] = [{ wch: 28 }, { wch: 34 }];

  // --- Sheet 2: Forecast (year-by-year actual vs step-ahead forecast) ---
  const forecastRows = [["Year", "Actual GDP (constant 2015 US$)", "Step-Ahead Forecast GDP (constant 2015 US$)"]];
  result.years.forEach((year, i) => {
    forecastRows.push([year, result.y_actual[i], result.y_pred[i] ?? ""]);
  });
  const forecastSheet = XLSX.utils.aoa_to_sheet(forecastRows);
  forecastSheet["!cols"] = [{ wch: 8 }, { wch: 28 }, { wch: 32 }];

  // --- Sheet 3: Parameter estimates by rolling window ---
  const paramRows = [["Year", "a (Intrinsic Growth)", "b (Growth Constraint)", "c (GFCF Effect)", "SSE"]];
  result.years.forEach((year, i) => {
    paramRows.push([
      year,
      result.a_track[i] ?? "",
      result.b_track[i] ?? "",
      result.c_track[i] ?? "",
      result.sse_per_year[i] ?? "",
    ]);
  });
  const paramSheet = XLSX.utils.aoa_to_sheet(paramRows);
  paramSheet["!cols"] = [{ wch: 8 }, { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 12 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");
  XLSX.utils.book_append_sheet(wb, forecastSheet, "Forecast");
  XLSX.utils.book_append_sheet(wb, paramSheet, "Parameter Estimates");

  XLSX.writeFile(wb, `nonlinear-gdp-simulation-${dataCountry?.code || "result"}.xlsx`);
}
