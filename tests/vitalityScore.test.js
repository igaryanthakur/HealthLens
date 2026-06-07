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

test("vitalityScore subtracts 5 per low or high measurement", () => {
  const report = new Report({
    measurements: [
      { name: "hemoglobin", value: 8.6, status: "low" },
      { name: "glucose", value: 180, status: "high" },
      { name: "wbc", value: 7000, status: "normal" },
    ],
    aiInterpretation: baseAiInterpretation,
  });

  assert.equal(report.vitalityScore, 90);
});

test("vitalityScore is included in toJSON output", () => {
  const report = new Report({
    measurements: [{ name: "hemoglobin", value: 8.6, status: "low" }],
    aiInterpretation: baseAiInterpretation,
  });

  const json = report.toJSON();
  assert.equal(json.vitalityScore, 95);
});
