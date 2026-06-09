const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildVaultContext,
  buildBoundedChatHistory,
  buildChatPrompt,
  formatReportDate,
} = require("../utils/chatContextBuilder");

test("formatReportDate returns ISO date string", () => {
  assert.equal(formatReportDate("2026-04-25"), "2026-04-25");
});

test("buildVaultContext handles empty reports", () => {
  const result = buildVaultContext([]);
  assert.match(result, /No medical reports on file yet/);
});

test("buildVaultContext includes report measurements and summary", () => {
  const result = buildVaultContext([
    {
      reportType: "CBC",
      reportDate: "2026-04-25",
      vitalityScore: 90,
      measurements: [
        {
          name: "Hemoglobin",
          value: 12.5,
          unit: "g/dL",
          status: "low",
          referenceRange: "13-17",
        },
      ],
      aiInterpretation: {
        summary: "Mild anemia detected.",
        findings: [
          {
            parameter: "Hemoglobin",
            status: "Low",
            explanation: "Carries oxygen in blood.",
          },
        ],
      },
    },
  ]);

  assert.match(result, /CBC/);
  assert.match(result, /Hemoglobin: 12.5 g\/dL/);
  assert.match(result, /Mild anemia detected/);
  assert.match(result, /Hemoglobin \(Low\)/);
});

test("buildBoundedChatHistory returns at most 10 reports", () => {
  const reports = Array.from({ length: 15 }, (_, i) => ({
    reportType: "CBC",
    reportDate: `2026-0${(i % 9) + 1}-01`,
    measurements: [],
  }));

  const result = buildBoundedChatHistory(reports);
  assert.equal(result.length, 10);
});

test("buildBoundedChatHistory keeps abnormal and caps normal measurements", () => {
  const measurements = [];
  for (let i = 0; i < 15; i++) {
    measurements.push({
      name: `Marker${i}`,
      value: i,
      unit: "mg/dL",
      status: i < 5 ? "high" : "normal",
    });
  }

  const result = buildBoundedChatHistory([
    {
      reportType: "CBC",
      reportDate: "2026-04-25",
      measurements,
    },
  ]);

  assert.equal(result.length, 1);
  const names = result[0].measurements.map((m) => m.name);
  assert.ok(names.includes("Marker0"));
  assert.ok(names.includes("Marker4"));
  assert.ok(!names.includes("Marker14"));
  assert.ok(result[0].measurements.length <= 8);
});

test("buildBoundedChatHistory truncates long aiSummary", () => {
  const longSummary = "A".repeat(500);
  const result = buildBoundedChatHistory([
    {
      reportType: "CBC",
      reportDate: "2026-04-25",
      measurements: [],
      aiInterpretation: { summary: longSummary },
    },
  ]);

  assert.equal(result[0].aiSummary.length, 400);
});

test("buildBoundedChatHistory caps medications and diagnoses", () => {
  const meds = Array.from({ length: 8 }, (_, i) => ({
    name: `Drug${i}`,
    dosage: "10mg",
    frequency: "daily",
  }));
  const diagnoses = Array.from({ length: 8 }, (_, i) => ({
    condition: `Condition${i}`,
    status: "active",
  }));

  const result = buildBoundedChatHistory([
    {
      reportType: "PRESCRIPTION",
      reportDate: "2026-04-25",
      measurements: [],
      medications: meds,
      diagnoses,
    },
  ]);

  assert.equal(result[0].medications.length, 5);
  assert.equal(result[0].diagnoses.length, 5);
});

test("buildChatPrompt includes profile, vault, history, and message", () => {
  const prompt = buildChatPrompt({
    profileContext: "PROFILE: Age 30",
    vaultContext: "VAULT: 1 report",
    message: "What is my hemoglobin?",
    history: [{ role: "user", content: "Hello" }],
  });

  assert.match(prompt, /PROFILE: Age 30/);
  assert.match(prompt, /VAULT: 1 report/);
  assert.match(prompt, /Patient: Hello/);
  assert.match(prompt, /Patient: What is my hemoglobin\?/);
  assert.match(prompt, /Assistant:/);
});
