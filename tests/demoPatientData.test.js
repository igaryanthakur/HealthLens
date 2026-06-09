const test = require("node:test");
const assert = require("node:assert/strict");
const { DEMO_USER, DEMO_REPORTS, LAB_MEASUREMENT_NAMES } = require("../scripts/demoPatientData");
const { computeVitalityScore } = require("../utils/clinical/vitalityScore");

function labNames(report) {
  return report.measurements.map((m) => m.name).sort().join("|");
}

test("DEMO_REPORTS has exactly 4 records", () => {
  assert.equal(DEMO_REPORTS.length, 4);
});

test("report dates are strictly chronological", () => {
  for (let i = 1; i < DEMO_REPORTS.length; i += 1) {
    assert.ok(
      DEMO_REPORTS[i].reportDate > DEMO_REPORTS[i - 1].reportDate,
      `report ${i} should be after report ${i - 1}`,
    );
  }
});

test("lab reports share identical measurement name sets", () => {
  const labReports = DEMO_REPORTS.filter((r) => r.documentType === "lab_report");
  assert.equal(labReports.length, 3);

  const baseline = labNames(labReports[0]);
  for (const report of labReports.slice(1)) {
    assert.equal(labNames(report), baseline);
  }

  assert.deepEqual(
    labReports[0].measurements.map((m) => m.name).sort(),
    [...LAB_MEASUREMENT_NAMES].sort(),
  );
});

test("prescription report has Metformin and Type 2 Diabetes", () => {
  const rx = DEMO_REPORTS.find((r) => r.documentType === "prescription");
  assert.ok(rx);

  const medNames = rx.medications.map((m) => m.name);
  assert.ok(medNames.includes("Metformin"));

  const dx = rx.diagnoses.find((d) => d.condition === "Type 2 Diabetes");
  assert.ok(dx);
  assert.equal(dx.status, "active");
});

test("each report has required schema fields", () => {
  for (const report of DEMO_REPORTS) {
    assert.ok(report.documentType);
    assert.ok(report.reportDate instanceof Date);
    assert.ok(report.aiInterpretation?.summary);
    assert.ok(Array.isArray(report.measurements));

    for (const m of report.measurements) {
      assert.ok(m.name);
      assert.equal(typeof m.value, "number");
      assert.ok(m.unit);
      assert.ok(["normal", "low", "high", "unknown"].includes(m.status));
      assert.ok(m.referenceRange);
    }
  }
});

test("DEMO_USER profile uses valid enum values", () => {
  assert.equal(DEMO_USER.profile.gender, "Female");
  assert.equal(DEMO_USER.profile.bloodGroup, "B+");
  assert.equal(DEMO_USER.profile.lifestyle.smokingStatus, "Never");
  assert.equal(DEMO_USER.profile.lifestyle.alcoholConsumption, "Occasional");
});

test("vitality scores match weighted expectations", () => {
  const report1 = DEMO_REPORTS[0];
  const report2 = DEMO_REPORTS[1];
  const report4 = DEMO_REPORTS[3];

  assert.equal(computeVitalityScore(report1.measurements), 100);
  assert.equal(computeVitalityScore(report2.measurements), 56);
  assert.equal(computeVitalityScore(report4.measurements), 68);
  assert.ok(computeVitalityScore(report4.measurements) > computeVitalityScore(report2.measurements));
});
