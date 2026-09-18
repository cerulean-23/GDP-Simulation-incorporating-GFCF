// Bounds for the DE search-space parameters and population size.
// See chat/thesis notes for the economic reasoning behind each range —
// short version: a can swing further since it's the intrinsic growth rate
// and needs room during search; b and c must stay non-negative since a
// negative value for either breaks the model's economic meaning (b<0 means
// growth accelerates unboundedly, c<0 means investment shrinks output).
export const PARAM_LIMITS = {
  a: { min: -2, max: 2 },
  b: { min: 0, max: 1 },
  c: { min: 0, max: 5 },
};

export const POPULATION_SIZE_LIMITS = { min: 5, max: 100 };

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Validates the full settings object before a run. Returns an array of
 * human-readable problems — empty array means valid.
 */
export function validateSettings(settings) {
  const problems = [];

  for (const key of ["a", "b", "c"]) {
    const [lo, hi] = settings.bounds[key];
    const limit = PARAM_LIMITS[key];
    if (lo >= hi) {
      problems.push(`Parameter ${key}: lower bound must be less than upper bound.`);
    }
    if (lo < limit.min || hi > limit.max) {
      problems.push(`Parameter ${key}: must stay within [${limit.min}, ${limit.max}].`);
    }
  }

  if (settings.populationSize < POPULATION_SIZE_LIMITS.min || settings.populationSize > POPULATION_SIZE_LIMITS.max) {
    problems.push(`Population size must be between ${POPULATION_SIZE_LIMITS.min} and ${POPULATION_SIZE_LIMITS.max}.`);
  }

  return problems;
}
