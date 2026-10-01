// Mirrors backend _parse_config() in routes_fred.py. The server stays the
// authority; this gives instant feedback and avoids a pointless round trip.

export function splitIndexFor(nObs, splitRatio) {
  // epsilon matches the backend so both sides agree on the split point
  return Math.floor(nObs * splitRatio + 1e-9);
}

export function maxWindowFor(nObs, splitRatio, limits) {
  return splitIndexFor(nObs, splitRatio) - limits.min_phase_points;
}

export function validateFredConfig(cfg, limits, nObs) {
  const errors = [];
  const isNum = (v) => typeof v === "number" && Number.isFinite(v);

  for (const name of ["a", "b", "c"]) {
    const pair = cfg.bounds?.[name];
    if (!Array.isArray(pair) || pair.length !== 2 || !pair.every(isNum)) {
      errors.push(`Parameter ${name}: bounds must be [lower, upper] numbers.`);
      continue;
    }
    const [lo, hi] = pair;
    const [limLo, limHi] = limits.param_bounds[name];
    if (lo >= hi) errors.push(`Parameter ${name}: lower bound must be less than upper bound.`);
    if (lo < limLo || hi > limHi) errors.push(`Parameter ${name}: must stay within [${limLo}, ${limHi}].`);
  }

  const [popLo, popHi] = limits.population_size;
  if (!Number.isInteger(cfg.population_size)) errors.push("Population size must be a whole number.");
  else if (cfg.population_size < popLo || cfg.population_size > popHi)
    errors.push(`Population size must be between ${popLo} and ${popHi}.`);

  const [itLo, itHi] = limits.max_iterations;
  if (!Number.isInteger(cfg.max_iterations)) errors.push("Max iterations must be a whole number.");
  else if (cfg.max_iterations < itLo || cfg.max_iterations > itHi)
    errors.push(`Max iterations must be between ${itLo} and ${itHi}.`);

  const [spLo, spHi] = limits.split_ratio;
  const ratioOk = isNum(cfg.split_ratio) && cfg.split_ratio >= spLo && cfg.split_ratio <= spHi;
  if (!ratioOk) errors.push(`Split ratio must be between ${spLo} and ${spHi}.`);

  if (!Number.isInteger(cfg.window)) {
    errors.push("Rolling window must be a whole number.");
  } else if (ratioOk) {
    const split = splitIndexFor(nObs, cfg.split_ratio);
    const wMax = split - limits.min_phase_points;
    if (cfg.window < limits.window_min || cfg.window > wMax) {
      errors.push(
        `Rolling window must be between ${limits.window_min} and ${wMax} quarters for ${nObs} observations at a ${Math.round(
          cfg.split_ratio * 100
        )}% split.`
      );
    } else if (nObs - split < limits.min_phase_points) {
      errors.push("Forecast phase would have fewer than 5 quarters; lower the split ratio.");
    }
  }
  return errors;
}
