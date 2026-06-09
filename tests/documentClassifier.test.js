const test = require("node:test");
const assert = require("node:assert/strict");
const { classifyDocumentType } = require("../services/reportClassifier");

test("classifies a lab report by panel tokens", () => {
  const result = classifyDocumentType(
    "Complete Blood Count\nHemoglobin 13.2 g/dL\nRBC 4.8\nWBC 7000\nPlatelet 250000",
  );
  assert.equal(result.documentType, "lab_report");
});

test("classifies a prescription by dosage/sig tokens", () => {
  const result = classifyDocumentType(
    "Rx\nTab Metformin 500 mg - 1 tablet twice daily after food\nCap Omeprazole 20 mg OD before food",
  );
  assert.equal(result.documentType, "prescription");
});

test("classifies a scan report by radiology tokens", () => {
  const result = classifyDocumentType(
    "USG Abdomen\nFindings: normal liver.\nImpression: No abnormality detected.\nReported by Radiologist",
  );
  assert.equal(result.documentType, "scan_report");
});

test("classifies a discharge summary by admission tokens", () => {
  const result = classifyDocumentType(
    "Discharge Summary\nDate of Admission: 01/01/2026\nDate of Discharge: 05/01/2026\nHospital Course: stable.",
  );
  assert.equal(result.documentType, "discharge_summary");
});

test("returns unknown for empty or non-medical text", () => {
  assert.equal(classifyDocumentType("").documentType, "unknown");
  assert.equal(classifyDocumentType("the quick brown fox jumps").documentType, "unknown");
});

test("word-boundary guards avoid false positives for short tokens", () => {
  // 'od', 'bd', 'rx' should not match inside ordinary words like 'good'.
  const result = classifyDocumentType("a good food story about a body");
  assert.equal(result.documentType, "unknown");
});
