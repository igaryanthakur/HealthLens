const test = require("node:test");
const assert = require("node:assert/strict");
const { filterClinicalData } = require("../services/clinicalFilterService");
const { stitchRows } = require("../utils/rowStitcher");
const { extractSections } = require("../services/sectionExtractor");

test("section-scoped extraction avoids hba1c leakage into cbc", () => {
  const sampleLines = [
    "Complete Blood Count",
    "Haemoglobin (HB)",
    "8.6 g/dL",
    "12.0-15.0",
    "HbA1c Profile",
    "HbA1c",
    "6.8 %",
    "4.2-5.7",
  ];

  const stitchedRows = stitchRows(sampleLines, []);
  const sections = extractSections(stitchedRows);
  const result = filterClinicalData(sampleLines.join("\n"), {
    stitchedRows,
    sections,
    ocrPages: [],
  });

  const hemoglobin = result.structured.measurements.find(
    (m) => m.id === "cbc_hemoglobin",
  );
  const hba1c = result.structured.measurements.find(
    (m) => m.id === "diabetes_hba1c",
  );

  assert.ok(hemoglobin);
  assert.ok(hba1c);
  assert.equal(
    result.structured.sections.some((s) => s.section === "CBC"),
    true,
  );
  assert.equal(
    result.structured.sections.some((s) => s.section === "DIABETES"),
    true,
  );
});
