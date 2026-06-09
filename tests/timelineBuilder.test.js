const test = require("node:test");
const assert = require("node:assert/strict");
const { buildTimeline, eventType } = require("../utils/timelineBuilder");

const reports = [
  {
    _id: "r1",
    reportDate: new Date("2026-01-01"),
    documentType: "lab_report",
    reportType: "CBC",
    measurements: [{ name: "hemoglobin", value: 14 }],
    aiInterpretation: { summary: "All normal" },
  },
  {
    _id: "r2",
    reportDate: new Date("2026-06-01"),
    documentType: "prescription",
    reportType: "PRESCRIPTION",
    medications: [{ name: "Metformin" }, { name: "Aspirin" }],
    diagnoses: [{ condition: "Diabetes" }],
  },
  {
    _id: "r3",
    reportDate: new Date("2026-03-01"),
    documentType: "discharge_summary",
    symptoms: [{ description: "Chest pain" }],
  },
];

test("buildTimeline maps documentType to event type", () => {
  assert.equal(eventType("lab_report"), "test");
  assert.equal(eventType("scan_report"), "scan");
  assert.equal(eventType("prescription"), "prescription");
  assert.equal(eventType("discharge_summary"), "consultation");
  assert.equal(eventType("typed_note"), "note");
  assert.equal(eventType("unknown"), "document");
  assert.equal(eventType("something_else"), "document");
});

test("buildTimeline sorts most recent first by default", () => {
  const events = buildTimeline(reports);
  assert.deepEqual(
    events.map((e) => e.id),
    ["r2", "r3", "r1"],
  );
});

test("buildTimeline can sort ascending", () => {
  const events = buildTimeline(reports, { order: "asc" });
  assert.deepEqual(
    events.map((e) => e.id),
    ["r1", "r3", "r2"],
  );
});

test("buildTimeline computes counts and reuses ai summary", () => {
  const events = buildTimeline(reports);
  const lab = events.find((e) => e.id === "r1");
  assert.equal(lab.type, "test");
  assert.equal(lab.counts.measurements, 1);
  assert.equal(lab.summary, "All normal");

  const rx = events.find((e) => e.id === "r2");
  assert.equal(rx.counts.medications, 2);
  assert.equal(rx.counts.diagnoses, 1);
  assert.match(rx.summary, /2 medications/);
});

test("buildTimeline returns empty array for empty input", () => {
  assert.deepEqual(buildTimeline([]), []);
  assert.deepEqual(buildTimeline(undefined), []);
});
