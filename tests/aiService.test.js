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

test("generateChatResponse returns plain text on successful Gemini call", async () => {
  const { generateChatResponse } = require("../services/aiService");

  const profile = { gender: "female", dateOfBirth: "1990-01-01" };
  const history = [{ reportType: "CBC", reportDate: "2026-04-25", measurements: [] }];

  let capturedMessage = "";
  const mockModel = {
    generateContent: async (userMessage) => {
      capturedMessage = userMessage;
      return {
        response: {
          text: () => "  Your triglycerides were 165 mg/dL.  ",
        },
      };
    },
  };

  const result = await generateChatResponse(
    "What are my lipids?",
    profile,
    history,
    {
      getModel: (systemInstruction) => {
        assert.match(systemInstruction, /Patient Profile:/);
        assert.match(systemInstruction, /"gender":"female"/);
        assert.match(systemInstruction, /Medical History \(Chronological\):/);
        assert.match(systemInstruction, /"reportType":"CBC"/);
        return mockModel;
      },
    },
  );

  assert.equal(capturedMessage, "What are my lipids?");
  assert.equal(result, "Your triglycerides were 165 mg/dL.");
});

test("isRetryableAiError returns true for 503 and timeout messages", () => {
  const { isRetryableAiError } = require("../services/aiService");

  assert.equal(isRetryableAiError({ status: 503 }), true);
  assert.equal(isRetryableAiError({ statusCode: 429 }), true);
  assert.equal(isRetryableAiError(new Error("AI chat timed out after 15000ms")), true);
  assert.equal(isRetryableAiError({ status: 400 }), false);
  assert.equal(isRetryableAiError(new Error("invalid API key")), false);
});

test("callWithSingleRetry retries once on retryable error", async () => {
  const { callWithSingleRetry } = require("../services/aiService");

  let attempts = 0;
  const result = await callWithSingleRetry(async () => {
    attempts += 1;
    if (attempts === 1) {
      const err = new Error("service unavailable");
      err.status = 503;
      throw err;
    }
    return "ok";
  }, "test");

  assert.equal(attempts, 2);
  assert.equal(result, "ok");
});

test("callWithSingleRetry does not retry non-retryable errors", async () => {
  const { callWithSingleRetry } = require("../services/aiService");

  let attempts = 0;
  await assert.rejects(
    () =>
      callWithSingleRetry(async () => {
        attempts += 1;
        const err = new Error("bad request");
        err.status = 400;
        throw err;
      }, "test"),
    { message: "bad request" },
  );

  assert.equal(attempts, 1);
});

test("generateChatResponse throws when GEMINI_API_KEY is missing", async () => {
  const originalKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  const { generateChatResponse } = require("../services/aiService");

  await assert.rejects(
    () => generateChatResponse("Hi", {}, []),
    { message: "Failed to generate chat response." },
  );

  if (originalKey !== undefined) {
    process.env.GEMINI_API_KEY = originalKey;
  }
});
