const test = require("node:test");
const assert = require("node:assert/strict");
const { extractEntitiesFromText } = require("../services/groqService");

function createFakeCompletion(jsonPayload, capture) {
  return async ({ messages }) => {
    if (capture) capture.messages = messages;
    return {
      choices: [{ message: { content: JSON.stringify(jsonPayload) } }],
    };
  };
}

test("sends the document text in the user message", async () => {
  const capture = {};
  await extractEntitiesFromText("Patient prescribed Amoxicillin 500mg", {
    createCompletion: createFakeCompletion({ medications: [] }, capture),
  });

  const userMessage = capture.messages.find((m) => m.role === "user")?.content ?? "";
  assert.match(userMessage, /Amoxicillin 500mg/);
});

test("normalizes missing arrays in the model response", async () => {
  const result = await extractEntitiesFromText("text", {
    createCompletion: createFakeCompletion({ diagnoses: [{ condition: "Asthma" }] }),
  });

  assert.deepEqual(result.medications, []);
  assert.deepEqual(result.symptoms, []);
  assert.deepEqual(result.doctorAdvice, []);
  assert.deepEqual(result.testsAdvised, []);
  assert.equal(result.diagnoses[0].condition, "Asthma");
});

test("returns symptoms when present", async () => {
  const result = await extractEntitiesFromText("text", {
    createCompletion: createFakeCompletion({
      symptoms: [{ description: "Persistent cough", confidence: 0.7 }],
    }),
  });

  assert.equal(result.symptoms[0].description, "Persistent cough");
});

test("parseJsonResponse handles markdown-wrapped entity JSON", async () => {
  const result = await extractEntitiesFromText("text", {
    createCompletion: async () => ({
      choices: [
        {
          message: {
            content: '```json\n{"medications":[{"name":"Dolo"}]}\n```',
          },
        },
      ],
    }),
  });

  assert.equal(result.medications[0].name, "Dolo");
});
