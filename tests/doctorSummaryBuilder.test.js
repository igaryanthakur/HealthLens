const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildDoctorSummary,
  buildPatientBlock,
  buildLatestVitals,
  buildAbnormalMarkers,
  buildTimelineHighlights,
} = require("../utils/doctorSummaryBuilder");

// Fixed clock so age/BMI/generatedAt assertions never drift.
const REFERENCE_DATE = new Date("2026-06-10T00:00:00.000Z");
const GENERATED_AT = "2026-06-10T12:00:00.000Z";

const user = {
  name: "Priya Sharma",
  email: "demo@healthlens.ai",
  profile: {
    dateOfBirth: new Date("1990-06-10T00:00:00.000Z"),
    gender: "Female",
    bloodGroup: "O+",
    heightCm: 165,
    weightKg: 68,
    chronicConditions: ["Type 2 Diabetes"],
    lifestyle: { smokingStatus: "Never", alcoholConsumption: "Occasional" },
  },
};

const reports = [
  {
    _id: "lab1",
    documentType: "lab_report",
    reportDate: new Date("2026-01-15"),
    measurements: [
      { name: "HbA1c", value: 7.4, unit: "%", status: "high", referenceRange: "4.0-5.6" },
    ],
  },
  {
    _id: "presc1",
    documentType: "prescription",
    reportDate: new Date("2026-03-01"),
    medications: [{ name: "Metformin", dosage: "500mg", frequency: "BD" }],
    diagnoses: [{ condition: "Type 2 Diabetes", status: "active" }],
    symptoms: [{ description: "Fatigue" }],
    doctorAdvice: ["Reduce sugar intake"],
    testsAdvised: ["HbA1c"],
  },
  {
    _id: "lab2",
    documentType: "lab_report",
    reportDate: new Date("2026-06-05"),
    measurements: [
      { name: "HbA1c", value: 6.2, unit: "%", status: "high", referenceRange: "4.0-5.6" },
      { name: "Hemoglobin", value: 13.5, unit: "g/dL", status: "normal", referenceRange: "12-15" },
      { name: "LDL", value: 160, unit: "mg/dL", status: "high", referenceRange: "<100" },
    ],
  },
];

test("buildPatientBlock computes age and BMI against the reference date", () => {
  const patient = buildPatientBlock(user, { referenceDate: REFERENCE_DATE });
  assert.equal(patient.name, "Priya Sharma");
  assert.equal(patient.email, "demo@healthlens.ai");
  assert.equal(patient.age, "36");
  assert.equal(patient.bmi, "25.0");
  assert.equal(patient.gender, "Female");
  assert.equal(patient.bloodGroup, "O+");
  assert.deepEqual(patient.chronicConditions, ["Type 2 Diabetes"]);
  assert.equal(patient.lifestyle.smokingStatus, "Never");
});

test("buildPatientBlock degrades gracefully with no profile", () => {
  const patient = buildPatientBlock({ name: "Anon", email: "a@b.c" });
  assert.equal(patient.age, "Unknown");
  assert.equal(patient.bmi, "Unknown");
  assert.equal(patient.gender, "Unknown");
  assert.deepEqual(patient.chronicConditions, []);
});

test("buildLatestVitals come from the most recent lab report with traceability", () => {
  const vitals = buildLatestVitals(reports);
  assert.equal(vitals.length, 3);
  // From lab2 (June), not lab1 (January).
  assert.ok(vitals.every((v) => v.reportId === "lab2"));
  const hba1c = vitals.find((v) => v.name === "HbA1c");
  assert.equal(hba1c.value, 6.2);
  assert.equal(hba1c.unit, "%");
  assert.ok(hba1c.reportDate);
});

test("buildAbnormalMarkers collects high/low from latest lab with traceability", () => {
  const abnormal = buildAbnormalMarkers(reports);
  const markers = abnormal.map((m) => m.marker).sort();
  assert.deepEqual(markers, ["HbA1c", "LDL"]);
  const ldl = abnormal.find((m) => m.marker === "LDL");
  assert.equal(ldl.status, "high");
  assert.equal(ldl.referenceRange, "<100");
  assert.equal(ldl.reportId, "lab2");
});

test("buildTimelineHighlights caps at 8 events", () => {
  const many = Array.from({ length: 12 }, (_, i) => ({
    _id: `r${i}`,
    documentType: "lab_report",
    reportDate: new Date(2026, 0, i + 1),
    measurements: [{ name: "HbA1c", value: 6 }],
  }));
  assert.equal(buildTimelineHighlights(many).length, 8);
  assert.equal(buildTimelineHighlights(reports).length, 3);
});

test("buildDoctorSummary assembles the full contract", () => {
  const insights = {
    summary: "HbA1c improving but still above range.",
    improvingSignals: ["HbA1c decreased from 7.4 to 6.2 %"],
    needsAttention: ["LDL is newly outside the normal range (160 mg/dL)"],
    riskFlags: ["LDL became abnormal"],
    doctorQuestions: ["Should cholesterol management be reviewed?"],
    followUpSuggestions: ["Review these trends with your doctor."],
    disclaimer: "x",
    generatedBy: "deterministic",
  };

  const summary = buildDoctorSummary({
    user,
    reports,
    insights,
    generatedAt: GENERATED_AT,
    referenceDate: REFERENCE_DATE,
  });

  assert.equal(summary.generatedAt, GENERATED_AT);
  assert.equal(summary.patient.age, "36");
  assert.equal(summary.snapshot.totalReports, 3);
  assert.equal(summary.snapshot.labReportCount, 2);
  assert.equal(summary.snapshot.activeConditionCount, 1);
  assert.equal(summary.snapshot.currentMedicationCount, 1);
  assert.equal(summary.snapshot.abnormalMarkerCount, 2);
  assert.equal(summary.medications[0].name, "Metformin");
  assert.equal(summary.diagnoses[0].condition, "Type 2 Diabetes");
  assert.equal(summary.symptoms[0].description, "Fatigue");
  assert.equal(summary.advice.length, 2);
  assert.equal(summary.latestVitals.length, 3);
  assert.equal(summary.abnormalMarkers.length, 2);
  assert.ok(summary.disclaimer);
  // latestReportDate is the June report, valid ISO.
  assert.equal(summary.snapshot.latestReportDate, new Date("2026-06-05").toISOString());
});

test("buildDoctorSummary insight subset omits generatedBy", () => {
  const summary = buildDoctorSummary({
    user,
    reports,
    insights: { summary: "s", generatedBy: "ai" },
    generatedAt: GENERATED_AT,
    referenceDate: REFERENCE_DATE,
  });
  assert.equal(summary.insights.summary, "s");
  assert.equal("generatedBy" in summary.insights, false);
  assert.deepEqual(Object.keys(summary.insights).sort(), [
    "doctorQuestions",
    "followUpSuggestions",
    "improvingSignals",
    "needsAttention",
    "summary",
  ]);
});

test("buildDoctorSummary handles empty reports without leaking Invalid Date", () => {
  const summary = buildDoctorSummary({
    user,
    reports: [],
    insights: { summary: "No lab reports yet." },
    generatedAt: GENERATED_AT,
    referenceDate: REFERENCE_DATE,
  });

  assert.equal(summary.patient.name, "Priya Sharma");
  assert.equal(summary.snapshot.totalReports, 0);
  assert.equal(summary.snapshot.latestReportDate, null);
  assert.equal(summary.snapshot.labReportCount, 0);
  assert.equal(summary.snapshot.abnormalMarkerCount, 0);
  assert.deepEqual(summary.medications, []);
  assert.deepEqual(summary.latestVitals, []);
  assert.deepEqual(summary.abnormalMarkers, []);
  assert.deepEqual(summary.timelineHighlights, []);
});

test("latestReportDate is null when all report dates are invalid", () => {
  const summary = buildDoctorSummary({
    user,
    reports: [{ _id: "x", documentType: "note", reportDate: "not-a-date" }],
    insights: {},
    generatedAt: GENERATED_AT,
    referenceDate: REFERENCE_DATE,
  });
  assert.equal(summary.snapshot.latestReportDate, null);
});
