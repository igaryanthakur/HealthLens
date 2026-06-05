const test = require("node:test");
const assert = require("node:assert/strict");
const { filterClinicalData } = require("../services/clinicalFilterService");
const { stitchRows } = require("../utils/rowStitcher");
const { extractSections } = require("../services/sectionExtractor");

const CBC_FIXTURE_LINES = [
  "19/05/2026 PATIENT'S NAME",
  "Age /Sex 46 Years FEMALE 113",
  "MRS. ANJANA THAKUR",
  "INVESTIGATION RESULT",
  "COMPLETE BLOOD COUNT (HAEMOGRAM)",
  "REFERENCE RANGE UNIT",
  "HAEMOGLOBIN (Hb) g/dl 11 - 16 : L 10.0 10.0",
  "BLOOD INDICES",
  "R.B.C. (Red Blood Cell Count) mill/cu.mm 3.0 - 6.0 : 4.24",
  "PCV (HCT) Packed Cell Volume % 28 - 44 : 33.3",
  "MCV(Mean Corpuscular Volume fl 90 -120 : 78.54",
  "MCH (Mean Corpuscular Hb ) Pg 27 - 33 : 23.58",
  "MCHC (Mean Corps.Hb Conc) % 32 - 37 : 30.03",
  "RDW (RBC Distribution Width) % 10 - 16 : 29.1",
  "W.B.C. COUNT",
  "Total White Blood Cell Count /ul 4000 - 11000 : 7400",
  "PLATELET PARAMETERS",
  "PLATELET COUNT Lakh/cumm 1.5 - 4.5 : 3.15",
];

const EXPECTED = {
  cbc_hemoglobin: 10,
  cbc_rbc: 4.24,
  cbc_pcv: 33.3,
  cbc_mcv: 78.54,
  cbc_mch: 23.58,
  cbc_mchc: 30.03,
  cbc_rdw: 29.1,
  cbc_wbc: 7400,
  cbc_platelets: 3.15,
};

test("cbc pdf layout extracts section-scoped core measurements", () => {
  const cleanedTextFull = CBC_FIXTURE_LINES.join("\n");
  const fullLines = CBC_FIXTURE_LINES.map((line) => line.trim()).filter(Boolean);
  const stitchedRows = stitchRows(fullLines, []);
  const sections = extractSections(stitchedRows);

  assert.equal(
    sections.some((block) => block.section === "CBC"),
    true,
  );

  const result = filterClinicalData(cleanedTextFull, {
    stitchedRows,
    sections,
    ocrPages: [],
  });

  for (const [id, expectedValue] of Object.entries(EXPECTED)) {
    const measurement = result.structured.measurements.find((m) => m.id === id);
    assert.ok(measurement, `expected measurement ${id}`);
    assert.equal(measurement.normalizedValue, expectedValue);
    assert.equal(measurement.extractionScope, "CBC");
  }

  const hemoglobin = result.structured.measurements.find(
    (m) => m.id === "cbc_hemoglobin",
  );
  assert.equal(hemoglobin.status, "low");

  assert.equal(
    result.structured.measurements.some((m) => m.id === "diabetes_hba1c"),
    false,
  );

  assert.equal(result.structured.patient_info.reportDate, "2026-05-19");
});
