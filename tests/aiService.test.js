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

test("generateInterpretation prepends profile context when provided", async () => {
  const { generateInterpretation } = require("../services/aiService");

  let capturedText = "";
  const mockModel = {
    generateContent: async ({ contents }) => {
      capturedText = contents[0].parts[0].text;
      return {
        response: {
          text: () => JSON.stringify(mockResponse),
        },
      };
    },
  };

  const profileContext =
    "You are HealthLens AI, a clinical analysis assistant. You are analyzing a medical report for a patient with the following profile: Age: 35, Gender: Male, BMI: 24.0, Chronic Conditions: None, Lifestyle: Smoking: Never, Alcohol: None. Tailor your summary, biomarker analysis, and recommendations specifically to this patient's baseline context.";

  await generateInterpretation("MEDICAL REPORT CONTEXT:\n- Report Type: CBC", {
    getModel: () => mockModel,
    profileContext,
  });

  assert.match(capturedText, /^You are HealthLens AI, a clinical analysis assistant/);
  assert.match(capturedText, /Here is the structured medical data to interpret:/);
  assert.match(capturedText, /MEDICAL REPORT CONTEXT:\n- Report Type: CBC/);
});
