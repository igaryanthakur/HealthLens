const test = require("node:test");
const assert = require("node:assert/strict");
const Report = require("../models/Report");

const baseAiInterpretation = {
  summary: "Test summary",
  findings: [],
  recommendations: [],
};

test("vitalityScore is 100 when all measurements are normal or unknown", () => {
  const report = new Report({
    measurements: [
      { name: "hemoglobin", value: 14, status: "normal" },
      { name: "wbc", value: 7000, status: "unknown" },
    ],
    aiInterpretation: baseAiInterpretation,
  });

  assert.equal(report.vitalityScore, 100);
});

test("vitalityScore subtracts priority weight per low or high measurement", () => {
  const report = new Report({
    measurements: [
      { name: "hemoglobin", value: 8.6, status: "low" }, // critical -> 12
      { name: "glucose", value: 180, status: "high" }, // critical -> 12
      { name: "wbc", value: 7000, status: "normal" },
    ],
    aiInterpretation: baseAiInterpretation,
  });

  assert.equal(report.vitalityScore, 76);
});

test("vitalityScore weights lower-priority markers less", () => {
  const report = new Report({
    measurements: [{ name: "mcv", value: 70, status: "low" }], // low priority -> 3
    aiInterpretation: baseAiInterpretation,
  });

  assert.equal(report.vitalityScore, 97);
});

test("vitalityScore is included in toJSON output", () => {
  const report = new Report({
    measurements: [{ name: "hemoglobin", value: 8.6, status: "low" }], // critical -> 12
    aiInterpretation: baseAiInterpretation,
  });

  const json = report.toJSON();
  assert.equal(json.vitalityScore, 88);
});
