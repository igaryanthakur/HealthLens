const test = require("node:test");
const assert = require("node:assert/strict");
const { chatHandler } = require("../routes/chat");

function createMockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

const stubUserId = "507f1f77bcf86cd799439099";

function createTestDeps(overrides = {}) {
  return {
    findUserById: async () => ({
      profile: { dateOfBirth: "1990-01-01", gender: "male" },
    }),
    findReports: async () => [
      {
        reportType: "CBC",
        reportDate: "2026-04-25",
        measurements: [],
        aiInterpretation: { summary: "All normal.", findings: [] },
      },
    ],
    generateChatResponse: async () => "Your hemoglobin was within range.",
    ...overrides,
  };
}

test("chat handler returns reply for valid message", async () => {
  const req = {
    user: { id: stubUserId },
    body: { message: "What were my last results?" },
  };
  const res = createMockRes();

  let capturedArgs = null;
  await chatHandler(
    req,
    res,
    createTestDeps({
      generateChatResponse: async (message, profile, history) => {
        capturedArgs = { message, profile, history };
        return "Your hemoglobin was within range.";
      },
    }),
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.reply, "Your hemoglobin was within range.");
  assert.equal(capturedArgs.message, "What were my last results?");
  assert.equal(capturedArgs.profile.gender, "male");
  assert.equal(capturedArgs.history.length, 1);
  assert.equal(capturedArgs.history[0].reportType, "CBC");
});

test("chat handler returns 400 when message is missing", async () => {
  const req = { user: { id: stubUserId }, body: {} };
  const res = createMockRes();

  await chatHandler(req, res, createTestDeps());

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
});

test("chat handler returns 404 when user not found", async () => {
  const req = {
    user: { id: stubUserId },
    body: { message: "Hi" },
  };
  const res = createMockRes();

  await chatHandler(
    req,
    res,
    createTestDeps({
      findUserById: async () => null,
    }),
  );

  assert.equal(res.statusCode, 404);
  assert.equal(res.body.success, false);
});

test("chat handler returns 500 when chat generation fails", async () => {
  const req = {
    user: { id: stubUserId },
    body: { message: "Hi" },
  };
  const res = createMockRes();

  await chatHandler(
    req,
    res,
    createTestDeps({
      generateChatResponse: async () => {
        throw new Error("Failed to generate chat response.");
      },
    }),
  );

  assert.equal(res.statusCode, 500);
  assert.equal(res.body.success, false);
});
