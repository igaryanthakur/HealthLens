const test = require("node:test");
const assert = require("node:assert/strict");
const {
  INSIGHTS_DISCLAIMER,
  buildMetricSeries,
  compareLatestToPrevious,
  buildInsightsContext,
  buildDeterministicInsights,
} = require("../utils/longitudinalInsights");

// Mirrors the demo patient (Priya) lab journey: Jan normal -> Mar worsened ->
// Jun improving. The Mar prescription is intentionally interleaved to prove
// non-lab documents are ignored by the comparison.
const reports = [
  {
    _id: "jan",
    documentType: "lab_report",
    reportDate: new Date("2026-01-15"),
    measurements: [
      { name: "HbA1c", value: 5.4, unit: "%", status: "normal", referenceRange: "4.0-5.6" },
      { name: "Fasting Glucose", value: 95, unit: "mg/dL", status: "normal", referenceRange: "70-100" },
      { name: "Hemoglobin", value: 13.5, unit: "g/dL", status: "normal", referenceRange: "12.0-16.0" },
    ],
  },
  {
    _id: "mar",
    documentType: "lab_report",
    reportDate: new Date("2026-03-20"),
    measurements: [
      { name: "HbA1c", value: 6.8, unit: "%", status: "high", referenceRange: "4.0-5.6" },
      { name: "Fasting Glucose", value: 128, unit: "mg/dL", status: "high", referenceRange: "70-100" },
      { name: "Hemoglobin", value: 12.6, unit: "g/dL", status: "low", referenceRange: "12.0-16.0" },
    ],
  },
  {
    _id: "rx",
    documentType: "prescription",
    reportDate: new Date("2026-03-22"),
    medications: [{ name: "Metformin", dosage: "500 mg" }],
    diagnoses: [{ condition: "Type 2 Diabetes", status: "active" }],
  },
  {
    _id: "jun",
    documentType: "lab_report",
    reportDate: new Date("2026-06-05"),
    measurements: [
      { name: "HbA1c", value: 6.2, unit: "%", status: "high", referenceRange: "4.0-5.6" },
      { name: "Fasting Glucose", value: 110, unit: "mg/dL", status: "high", referenceRange: "70-100" },
      { name: "Hemoglobin", value: 13.1, unit: "g/dL", status: "normal", referenceRange: "12.0-16.0" },
    ],
  },
];

test("buildMetricSeries builds chronological per-metric points from lab reports", () => {
  const series = buildMetricSeries(reports);
  assert.equal(series.hba1c.label, "HbA1c");
  assert.equal(series.hba1c.unit, "%");
  assert.deepEqual(
    series.hba1c.points.map((p) => p.value),
    [5.4, 6.8, 6.2],
  );
});

test("compareLatestToPrevious uses the last two lab reports only", () => {
  const result = compareLatestToPrevious(reports);
  assert.equal(new Date(result.latestReportDate).getTime(), new Date("2026-06-05").getTime());
  assert.equal(new Date(result.previousReportDate).getTime(), new Date("2026-03-20").getTime());
});

test("compareLatestToPrevious detects improvement that is still high", () => {
  const result = compareLatestToPrevious(reports);
  const hba1c = result.changedMarkers.find((m) => m.name === "HbA1c");
  assert.equal(hba1c.previous, 6.8);
  assert.equal(hba1c.latest, 6.2);
  assert.equal(hba1c.delta, -0.6);
  assert.equal(hba1c.direction, "down");
  assert.equal(hba1c.interpretation, "improving_but_still_high");
});

test("compareLatestToPrevious detects a marker that resolved to normal", () => {
  const result = compareLatestToPrevious(reports);
  const hemoglobin = result.changedMarkers.find((m) => m.name === "Hemoglobin");
  assert.equal(hemoglobin.interpretation, "resolved_to_normal");
});

test("buildDeterministicInsights surfaces improving and attention signals", () => {
  const context = buildInsightsContext({ reports, user: { profile: {} } });
  const insights = buildDeterministicInsights(context);

  assert.equal(insights.generatedBy, "deterministic");
  assert.equal(insights.disclaimer, INSIGHTS_DISCLAIMER);
  assert.ok(insights.improvingSignals.some((s) => /HbA1c/.test(s)));
  assert.ok(insights.improvingSignals.some((s) => /Hemoglobin returned to the normal range/.test(s)));
  assert.ok(insights.needsAttention.some((s) => /HbA1c is improving but still high/.test(s)));
  assert.ok(insights.doctorQuestions.length > 0);
  assert.ok(insights.followUpSuggestions.length > 0);
});

test("buildInsightsContext compacts reports and counts lab reports", () => {
  const context = buildInsightsContext({ reports, user: { profile: { gender: "Female" } } });
  assert.equal(context.labReportCount, 3);
  assert.equal(context.profile.gender, "Female");
  // Compact reports expose only the safe structured fields (no _id / Mongoose doc).
  assert.equal(context.latestReport._id, undefined);
  assert.equal(context.latestReport.measurements[0].name, "HbA1c");
  assert.ok(context.medications.some((m) => m.name === "Metformin"));
});

test("buildDeterministicInsights handles empty report history", () => {
  const context = buildInsightsContext({ reports: [], user: { profile: {} } });
  const insights = buildDeterministicInsights(context);
  assert.equal(context.labReportCount, 0);
  assert.match(insights.summary, /No lab reports/);
  assert.equal(insights.disclaimer, INSIGHTS_DISCLAIMER);
  assert.deepEqual(insights.changedMarkers, undefined);
});

test("buildDeterministicInsights handles a single lab report", () => {
  const single = [reports[0]];
  const context = buildInsightsContext({ reports: single, user: { profile: {} } });
  const insights = buildDeterministicInsights(context);
  assert.equal(context.labReportCount, 1);
  assert.match(insights.summary, /Only one lab report/);
  assert.ok(insights.followUpSuggestions.length > 0);
});
