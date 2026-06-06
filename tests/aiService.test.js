const test = require("node:test");
const assert = require("node:assert/strict");

const mockResponse = {
  summary: "Overall health looks good with one area to watch.",
  findings: [
    {
      parameter: "Vitamin D",
      status: "Low",
      explanation: "Vitamin D supports bone health and immune function.",
    },
  ],
  recommendations: ["Spend 15 minutes in morning sunlight daily."],
};

test("generateInterpretation throws when GEMINI_API_KEY is missing", async () => {
  const originalKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  const { generateInterpretation } = require("../services/aiService");

  await assert.rejects(
    () => generateInterpretation("MEDICAL REPORT CONTEXT:\n- Report Type: CBC"),
    { message: "Failed to generate AI interpretation." },
  );

  if (originalKey !== undefined) {
    process.env.GEMINI_API_KEY = originalKey;
  }
});

test("generateInterpretation returns parsed JSON on successful Gemini call", async () => {
  const { generateInterpretation } = require("../services/aiService");

  const mockModel = {
    generateContent: async () => ({
      response: {
        text: () => JSON.stringify(mockResponse),
      },
    }),
  };

  const result = await generateInterpretation(
    "MEDICAL REPORT CONTEXT:\n- Report Type: CBC",
    {
      getModel: () => mockModel,
    },
  );

  assert.equal(result.summary, mockResponse.summary);
  assert.deepEqual(result.findings, mockResponse.findings);
  assert.deepEqual(result.recommendations, mockResponse.recommendations);
});
