// Weighted Vitality Score (Stage 4 / I13).
//
// Replaces the naive "-5 per abnormal value" with a transparent score weighted
// by each parameter's clinical priority (from canonicalMap.json). A low/high
// result on a critical marker (e.g. creatinine, HbA1c) costs more than one on a
// low-priority marker (e.g. MCV).
//
// Formula: start at 100, subtract the priority weight for every measurement
// whose status is "low" or "high", then clamp to [0, 100].

const canonicalMap = require("../canonicalMap.json");

const PRIORITY_WEIGHTS = {
  critical: 12,
  high: 8,
  medium: 5,
  low: 3,
};

const DEFAULT_WEIGHT = 5;

// Reverse index: canonical name + every alias (lowercased) -> priority.
const PRIORITY_BY_NAME = (() => {
  const index = new Map();
  for (const [name, entry] of Object.entries(canonicalMap)) {
    const priority = entry.priority || "medium";
    index.set(name.toLowerCase(), priority);
    for (const alias of entry.aliases || []) {
      index.set(String(alias).toLowerCase(), priority);
    }
  }
  return index;
})();

function priorityForMeasurement(measurement) {
  const name = (measurement && measurement.name ? String(measurement.name) : "")
    .trim()
    .toLowerCase();
  return PRIORITY_BY_NAME.get(name) || null;
}

function weightForMeasurement(measurement) {
  const priority = priorityForMeasurement(measurement);
  return priority ? PRIORITY_WEIGHTS[priority] ?? DEFAULT_WEIGHT : DEFAULT_WEIGHT;
}

function computeVitalityScore(measurements) {
  const list = Array.isArray(measurements) ? measurements : [];
  let score = 100;

  for (const measurement of list) {
    if (measurement && (measurement.status === "low" || measurement.status === "high")) {
      score -= weightForMeasurement(measurement);
    }
  }

  return Math.max(0, Math.min(100, score));
}

module.exports = {
  computeVitalityScore,
  weightForMeasurement,
  PRIORITY_WEIGHTS,
  DEFAULT_WEIGHT,
};
