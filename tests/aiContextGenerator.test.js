const test = require("node:test");
const assert = require("node:assert/strict");
const { generateClinicalSummaryPrompt } = require("../utils/aiContextGenerator");

const baseStructured = {
  reportType: "CBC",
  patient_info: { reportDate: "2026-05-19" },
  measurements: [
    {
      name: "hemoglobin",
      normalizedValue: 8.6,
      unit: "g/dL",
      status: "low",
      referenceRange: "12-16",
    },
    {
      name: "wbc",
      normalizedValue: 7400,
      unit: "/ul",
      status: "normal",
      referenceRange: "4000-11000",
    },
  ],
};

test("splits abnormal and normal markers in prompt", () => {
  const prompt = generateClinicalSummaryPrompt(baseStructured);

  assert.match(prompt, /Report Type: CBC/);
  assert.match(prompt, /Report Date: 2026-05-19/);
  assert.match(prompt, /HEMOGLOBIN: 8\.6 g\/dL \(Status: LOW/);
  assert.match(prompt, /within normal reference ranges: wbc/);
});

test("reports no abnormalities when all markers normal", () => {
  const prompt = generateClinicalSummaryPrompt({
    ...baseStructured,
    measurements: [baseStructured.measurements[1]],
  });

  assert.match(prompt, /None detected in this report/);
});

test("includes AI disclaimer instruction", () => {
  const prompt = generateClinicalSummaryPrompt(baseStructured);

  assert.match(prompt, /This is not a medical diagnosis/);
  assert.match(prompt, /INSTRUCTIONS FOR AI/);
});
