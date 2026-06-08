const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildVaultContext,
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
