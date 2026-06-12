const test = require("node:test");
const assert = require("node:assert/strict");
const { extractPrescriptionFromImage } = require("../services/geminiVisionService");

function createFakeModel(jsonPayload, capture) {
  return {
    generateContent: async (request) => {
      if (capture) capture.request = request;
      return {
        response: { text: () => JSON.stringify(jsonPayload) },
      };
    },
  };
}

test("sends the image as an inlineData part alongside the text instruction", async () => {
  const capture = {};
  const payload = {
    medications: [{ name: "Amoxicillin", confidence: 0.9 }],
    diagnoses: [],
    doctorAdvice: [],
    testsAdvised: [],
  };

  await extractPrescriptionFromImage("BASE64DATA", "image/png", {
    getModel: () => createFakeModel(payload, capture),
  });

  const parts = capture.request.contents[0].parts;
  const inlinePart = parts.find((p) => p.inlineData);
  assert.ok(inlinePart, "expected an inlineData image part");
  assert.equal(inlinePart.inlineData.data, "BASE64DATA");
  assert.equal(inlinePart.inlineData.mimeType, "image/png");
  assert.ok(parts.some((p) => typeof p.text === "string"));
});

test("includes the OCR text hint when provided", async () => {
  const capture = {};
  await extractPrescriptionFromImage("X", "image/png", {
    getModel: () => createFakeModel({ medications: [] }, capture),
    textHint: "TabMetformin500",
  });

  const textPart = capture.request.contents[0].parts.find((p) => p.text);
  assert.match(textPart.text, /TabMetformin500/);
});

test("normalizes missing arrays in the model response", async () => {
  const result = await extractPrescriptionFromImage("X", "image/png", {
    getModel: () => createFakeModel({ medications: [{ name: "Dolo" }] }),
  });

  assert.deepEqual(result.diagnoses, []);
  assert.deepEqual(result.doctorAdvice, []);
  assert.deepEqual(result.testsAdvised, []);
  assert.equal(result.medications[0].name, "Dolo");
});

test("extractPrescriptionFromImage throws when GEMINI_API_KEY is missing", async () => {
  const originalKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  await assert.rejects(
    () => extractPrescriptionFromImage("X", "image/png"),
    { message: "Failed to read prescription image." },
  );

  if (originalKey !== undefined) {
    process.env.GEMINI_API_KEY = originalKey;
  }
});
