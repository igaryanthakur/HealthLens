const test = require("node:test");
const assert = require("node:assert/strict");
const { historyHandler } = require("../routes/reports");

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

const stubReports = [
  {
    _id: "507f1f77bcf86cd799439011",
    reportDate: new Date("2026-01-01"),
    measurements: [{ name: "hemoglobin", value: 14, status: "normal" }],
    toJSON() {
      return { ...this, vitalityScore: 100 };
    },
  },
  {
    _id: "507f1f77bcf86cd799439012",
    reportDate: new Date("2026-06-01"),
    measurements: [{ name: "hemoglobin", value: 8.6, status: "low" }],
    toJSON() {
      return { ...this, vitalityScore: 95 };
    },
  },
];

const stubUserId = "507f1f77bcf86cd799439011";

test("history handler returns success and reports array", async () => {
  const res = createMockRes();

  await historyHandler(
    { user: { id: stubUserId } },
    res,
    {
      findReports: async () => stubReports,
    },
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.deepEqual(res.body.reports, stubReports);
});

test("history handler returns 500 when fetch fails", async () => {
  const res = createMockRes();

  await historyHandler(
    { user: { id: stubUserId } },
    res,
    {
      findReports: async () => {
        throw new Error("Database connection lost");
      },
    },
  );

  assert.equal(res.statusCode, 500);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /Failed to fetch report history/);
});
