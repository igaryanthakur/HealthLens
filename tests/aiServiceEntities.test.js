const test = require("node:test");
const assert = require("node:assert/strict");
const { extractEntitiesFromText } = require("../services/aiService");

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

test("sends the document text as a text part", async () => {
  const capture = {};
  await extractEntitiesFromText("Patient prescribed Amoxicillin 500mg", {
    getModel: () => createFakeModel({ medications: [] }, capture),
  });

  const textPart = capture.request.contents[0].parts.find((p) => p.text);
  assert.ok(textPart, "expected a text part");
  assert.match(textPart.text, /Amoxicillin 500mg/);
});

test("normalizes missing arrays in the model response", async () => {
  const result = await extractEntitiesFromText("text", {
    getModel: () => createFakeModel({ diagnoses: [{ condition: "Asthma" }] }),
  });

  assert.deepEqual(result.medications, []);
  assert.deepEqual(result.symptoms, []);
  assert.deepEqual(result.doctorAdvice, []);
  assert.deepEqual(result.testsAdvised, []);
  assert.equal(result.diagnoses[0].condition, "Asthma");
});

test("returns symptoms when present", async () => {
  const result = await extractEntitiesFromText("text", {
    getModel: () =>
      createFakeModel({ symptoms: [{ description: "Persistent cough", confidence: 0.7 }] }),
  });

  assert.equal(result.symptoms[0].description, "Persistent cough");
});
