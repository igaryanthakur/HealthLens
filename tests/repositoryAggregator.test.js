const test = require("node:test");
const assert = require("node:assert/strict");
const {
  aggregateMedications,
  aggregateDiagnoses,
  aggregateSymptoms,
  aggregateAdvice,
  normalizeKey,
} = require("../utils/repositoryAggregator");

const reports = [
  {
    _id: "r1",
    reportDate: new Date("2026-01-01"),
    documentType: "prescription",
    medications: [{ name: "Metformin", dosage: "500mg", frequency: "OD" }],
    diagnoses: [{ condition: "Type 2 Diabetes", status: "active" }],
    symptoms: [{ description: "Fatigue" }],
    doctorAdvice: ["Reduce sugar intake"],
    testsAdvised: ["HbA1c"],
  },
  {
    _id: "r2",
    reportDate: new Date("2026-06-01"),
    documentType: "prescription",
    medications: [
      { name: "metformin ", dosage: "850mg", frequency: "BD", uncertain: true },
    ],
    diagnoses: [{ condition: "type 2 diabetes", status: "resolved" }],
    symptoms: [{ description: "Fatigue" }],
    doctorAdvice: ["Reduce sugar intake"],
    testsAdvised: [],
  },
];

test("normalizeKey trims, lowercases, and collapses whitespace", () => {
  assert.equal(normalizeKey("  Vitamin   D  "), "vitamin d");
});

test("aggregateMedications dedupes by name and keeps occurrence detail", () => {
  const result = aggregateMedications(reports);
  assert.equal(result.length, 1);

  const med = result[0];
  assert.equal(med.name, "metformin");
  assert.equal(med.count, 2);
  assert.deepEqual(med.firstSeen, new Date("2026-01-01"));
  assert.deepEqual(med.lastSeen, new Date("2026-06-01"));
  assert.equal(med.latest.dosage, "850mg");
  assert.equal(med.uncertain, true);
  assert.equal(med.occurrences.length, 2);
  assert.equal(med.occurrences[0].reportId, "r1");
});

test("aggregateDiagnoses surfaces latest status from most recent occurrence", () => {
  const result = aggregateDiagnoses(reports);
  assert.equal(result.length, 1);
  assert.equal(result[0].condition, "type 2 diabetes");
  assert.equal(result[0].count, 2);
  assert.equal(result[0].latestStatus, "resolved");
});

test("aggregateSymptoms dedupes repeated symptoms", () => {
  const result = aggregateSymptoms(reports);
  assert.equal(result.length, 1);
  assert.equal(result[0].description, "Fatigue");
  assert.equal(result[0].count, 2);
});

test("aggregateAdvice separates advice from tests and dedupes", () => {
  const result = aggregateAdvice(reports);
  const advice = result.find((r) => r.kind === "advice");
  const test_ = result.find((r) => r.kind === "test");

  assert.equal(advice.text, "Reduce sugar intake");
  assert.equal(advice.count, 2);
  assert.equal(test_.text, "HbA1c");
  assert.equal(test_.count, 1);
});

test("aggregators return empty arrays for empty input", () => {
  assert.deepEqual(aggregateMedications([]), []);
  assert.deepEqual(aggregateDiagnoses(undefined), []);
  assert.deepEqual(aggregateSymptoms(null), []);
  assert.deepEqual(aggregateAdvice([]), []);
});
