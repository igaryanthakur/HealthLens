const test = require("node:test");
const assert = require("node:assert/strict");
const { filterClinicalData } = require("../services/clinicalFilterService");

test("clinical filtering emits enriched measurement schema", () => {
  const sample = [
    "Patient Name: Test User",
    "Age/Gender: 40Y / Male",
    "Haemoglobin (HB) : 8.6 g/dL 12-15",
    "HbA1c : 6.8 % 4.2 - 5.7",
    "Serum Creatinine : 0.82 mg/dl 0.4 - 0.9",
  ].join("\n");

  const result = filterClinicalData(sample, { ocrPages: [] });
  assert.ok(result.cleanedTextClinical.length > 0);
  assert.ok(Array.isArray(result.structured.measurements));
  assert.ok(result.structured.measurements.length >= 2);

  const hemoglobin = result.structured.measurements.find(
    (m) => m.id === "cbc_hemoglobin",
  );
  assert.ok(hemoglobin);
  assert.equal(hemoglobin.method, "generalized_stripper");
  assert.ok(typeof hemoglobin.normalizedValue === "number");
  assert.ok(hemoglobin.validation);
});
