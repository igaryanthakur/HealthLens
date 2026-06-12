const test = require("node:test");
const assert = require("node:assert/strict");
const { cleanJsonResponse, parseJsonResponse } = require("../utils/aiHelpers");

test("cleanJsonResponse strips markdown json fences", () => {
  const raw = '```json\n{"summary":"ok"}\n```';
  assert.equal(cleanJsonResponse(raw), '{"summary":"ok"}');
});

test("parseJsonResponse parses fenced JSON", () => {
  assert.deepEqual(parseJsonResponse('```\n{"a":1}\n```'), { a: 1 });
});

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

function createFakeCompletion(jsonPayload, capture) {
  return async ({ messages }) => {
    if (capture) capture.messages = messages;
    const content =
      typeof jsonPayload === "string" ? jsonPayload : JSON.stringify(jsonPayload);
    return {
      choices: [{ message: { content } }],
    };
  };
}

test("generateInterpretation throws when GROQ_API_KEY is missing", async () => {
  const originalKey = process.env.GROQ_API_KEY;
  delete process.env.GROQ_API_KEY;

  const { generateInterpretation } = require("../services/groqService");

  await assert.rejects(
    () => generateInterpretation("MEDICAL REPORT CONTEXT:\n- Report Type: CBC"),
    { message: "Failed to generate AI interpretation." },
  );

  if (originalKey !== undefined) {
    process.env.GROQ_API_KEY = originalKey;
  }
});

test("generateInterpretation returns parsed JSON on successful Groq call", async () => {
  const { generateInterpretation } = require("../services/groqService");

  const result = await generateInterpretation(
    "MEDICAL REPORT CONTEXT:\n- Report Type: CBC",
    {
      createCompletion: createFakeCompletion(mockResponse),
    },
  );

  assert.equal(result.summary, mockResponse.summary);
  assert.deepEqual(result.findings, mockResponse.findings);
  assert.deepEqual(result.recommendations, mockResponse.recommendations);
});

test("generateInterpretation prepends profile context when provided", async () => {
  const { generateInterpretation } = require("../services/groqService");

  const capture = {};
  const profileContext =
    "You are HealthLens AI, a clinical analysis assistant. You are analyzing a medical report for a patient with the following profile: Age: 35, Gender: Male, BMI: 24.0, Chronic Conditions: None, Lifestyle: Smoking: Never, Alcohol: None. Tailor your summary, biomarker analysis, and recommendations specifically to this patient's baseline context.";

  await generateInterpretation("MEDICAL REPORT CONTEXT:\n- Report Type: CBC", {
    createCompletion: createFakeCompletion(mockResponse, capture),
    profileContext,
  });

  const userMessage = capture.messages.find((m) => m.role === "user")?.content ?? "";
  assert.match(userMessage, /^You are HealthLens AI, a clinical analysis assistant/);
  assert.match(userMessage, /Here is the structured medical data to interpret:/);
  assert.match(userMessage, /MEDICAL REPORT CONTEXT:\n- Report Type: CBC/);
});

test("generateChatResponse returns plain text on successful Groq call", async () => {
  const { generateChatResponse } = require("../services/groqService");

  const profile = { gender: "female", dateOfBirth: "1990-01-01" };
  const history = [{ reportType: "CBC", reportDate: "2026-04-25", measurements: [] }];
  const capture = {};

  const result = await generateChatResponse(
    "What are my lipids?",
    profile,
    history,
    {
      createCompletion: async ({ messages }) => {
        capture.messages = messages;
        return {
          choices: [{ message: { content: "  Your triglycerides were 165 mg/dL.  " } }],
        };
      },
    },
  );

  const userMessage = capture.messages.find((m) => m.role === "user")?.content ?? "";
  const systemMessage = capture.messages.find((m) => m.role === "system")?.content ?? "";
  assert.equal(userMessage, "What are my lipids?");
  assert.match(systemMessage, /Patient Profile:/);
  assert.match(systemMessage, /"gender":"female"/);
  assert.match(systemMessage, /Medical History \(Chronological\):/);
  assert.match(systemMessage, /"reportType":"CBC"/);
  assert.equal(result, "Your triglycerides were 165 mg/dL.");
});

test("isRetryableAiError returns true for 503 and timeout messages", () => {
  const { isRetryableAiError } = require("../utils/aiHelpers");

  assert.equal(isRetryableAiError({ status: 503 }), true);
  assert.equal(isRetryableAiError({ statusCode: 429 }), true);
  assert.equal(isRetryableAiError(new Error("AI chat timed out after 15000ms")), true);
  assert.equal(isRetryableAiError({ status: 400 }), false);
  assert.equal(isRetryableAiError(new Error("invalid API key")), false);
});

test("callWithSingleRetry retries once on retryable error", async () => {
  const { callWithSingleRetry } = require("../utils/aiHelpers");

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
  const { callWithSingleRetry } = require("../utils/aiHelpers");

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

test("generateLongitudinalInsights parses and normalizes strict JSON", async () => {
  const { generateLongitudinalInsights } = require("../services/groqService");

  const aiPayload = {
    summary: "HbA1c is trending down but remains above target.",
    whatChanged: ["HbA1c decreased from 6.8 to 6.2 %"],
    improvingSignals: ["HbA1c improving"],
    needsAttention: ["HbA1c still high"],
    riskFlags: [],
    doctorQuestions: ["Should I keep monitoring HbA1c?"],
    followUpSuggestions: ["Review trends with your doctor."],
    disclaimer: "Informational only.",
  };

  const capture = {};
  const result = await generateLongitudinalInsights(
    { comparisons: { changedMarkers: [] }, labReportCount: 2 },
    {
      createCompletion: createFakeCompletion(aiPayload, capture),
    },
  );

  assert.equal(result.summary, aiPayload.summary);
  assert.deepEqual(result.improvingSignals, ["HbA1c improving"]);
  assert.equal(result.generatedBy, "ai");
  const userMessage = capture.messages.find((m) => m.role === "user")?.content ?? "";
  assert.match(userMessage, /structured health history/);
});

test("generateLongitudinalInsights coerces missing lists and disclaimer", async () => {
  const { generateLongitudinalInsights } = require("../services/groqService");

  const result = await generateLongitudinalInsights(
    {},
    { createCompletion: createFakeCompletion({ summary: "ok" }) },
  );

  assert.deepEqual(result.whatChanged, []);
  assert.deepEqual(result.riskFlags, []);
  assert.ok(result.disclaimer.length > 0);
  assert.equal(result.generatedBy, "ai");
});

test("generateLongitudinalInsights throws a clean error on malformed JSON", async () => {
  const { generateLongitudinalInsights } = require("../services/groqService");

  await assert.rejects(
    () =>
      generateLongitudinalInsights(
        {},
        { createCompletion: createFakeCompletion("not json") },
      ),
    { message: "Failed to generate longitudinal insights." },
  );
});

test("longitudinal insights disclaimer matches safety language", () => {
  const { generateLongitudinalInsights } = require("../services/groqService");
  assert.match(
    require("../utils/longitudinalInsights").INSIGHTS_DISCLAIMER,
    /does not diagnose, prescribe treatment, or replace professional medical advice/,
  );
  assert.equal(typeof generateLongitudinalInsights, "function");
});

test("generateChatResponse throws when GROQ_API_KEY is missing", async () => {
  const originalKey = process.env.GROQ_API_KEY;
  delete process.env.GROQ_API_KEY;

  const { generateChatResponse } = require("../services/groqService");

  await assert.rejects(
    () => generateChatResponse("Hi", {}, []),
    { message: "Failed to generate chat response." },
  );

  if (originalKey !== undefined) {
    process.env.GROQ_API_KEY = originalKey;
  }
});

test("aiService barrel re-exports groq and vision entry points", () => {
  const aiService = require("../services/aiService");
  assert.equal(typeof aiService.generateInterpretation, "function");
  assert.equal(typeof aiService.extractPrescriptionFromImage, "function");
  assert.equal(typeof aiService.extractEntitiesFromText, "function");
});
