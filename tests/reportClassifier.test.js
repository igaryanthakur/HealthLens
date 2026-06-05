const test = require("node:test");
const assert = require("node:assert/strict");
const { classifyReport } = require("../services/reportClassifier");

test("classifies cbc-heavy text as CBC", () => {
  const result = classifyReport("Hemoglobin RBC WBC Platelet MCV");
  assert.equal(result.primaryReportType, "CBC");
});

test("detects multi panel report scores", () => {
  const result = classifyReport("HbA1c Glucose Total Cholesterol LDL HDL");
  assert.ok(result.reportTypes.length >= 2);
});
