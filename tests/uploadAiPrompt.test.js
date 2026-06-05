const test = require("node:test");
const assert = require("node:assert/strict");
const { generateClinicalSummaryPrompt } = require("../utils/aiContextGenerator");
const { filterClinicalData } = require("../services/clinicalFilterService");

test("structured output can be passed to interpret prompt generator", () => {
  const sample = [
    "Customer Since: 25/Apr/2026",
    "Haemoglobin (HB) : 8.6 g/dL 12-15",
    "Vitamin B12 pg/ml 200 - 900 : 515",
  ].join("\n");

  const { structured } = filterClinicalData(sample, { ocrPages: [] });
  const aiPrompt = generateClinicalSummaryPrompt(structured);

  assert.ok(aiPrompt.length > 100);
  assert.match(aiPrompt, /MEDICAL REPORT CONTEXT/);
  assert.match(aiPrompt, /Report Date: 2026-04-25/);
  assert.equal(/Unknown Date/.test(aiPrompt), false);

  const b12 = structured.measurements.find((m) => m.id === "vitamin_b12");
  assert.ok(b12);
  assert.equal(b12.normalizedValue, 515);
});
