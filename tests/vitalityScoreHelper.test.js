const test = require("node:test");
const assert = require("node:assert/strict");
const {
  computeVitalityScore,
  weightForMeasurement,
  PRIORITY_WEIGHTS,
  DEFAULT_WEIGHT,
} = require("../utils/clinical/vitalityScore");

test("returns 100 for empty or all-normal measurements", () => {
  assert.equal(computeVitalityScore([]), 100);
  assert.equal(computeVitalityScore(undefined), 100);
  assert.equal(
    computeVitalityScore([
      { name: "hemoglobin", status: "normal" },
      { name: "wbc", status: "unknown" },
    ]),
    100,
  );
});

test("weightForMeasurement resolves priority via canonical name and aliases", () => {
  assert.equal(weightForMeasurement({ name: "creatinine" }), PRIORITY_WEIGHTS.critical);
  assert.equal(weightForMeasurement({ name: "B12" }), PRIORITY_WEIGHTS.high); // alias of vitamin b12
  assert.equal(weightForMeasurement({ name: "mcv" }), PRIORITY_WEIGHTS.low);
});

test("unknown markers fall back to the default weight", () => {
  assert.equal(weightForMeasurement({ name: "mystery marker" }), DEFAULT_WEIGHT);
  assert.equal(computeVitalityScore([{ name: "mystery marker", status: "high" }]), 95);
});

test("score is clamped to zero", () => {
  const manyCritical = Array.from({ length: 20 }, () => ({
    name: "hba1c",
    status: "high",
  }));
  assert.equal(computeVitalityScore(manyCritical), 0);
});
