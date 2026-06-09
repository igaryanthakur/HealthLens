const test = require("node:test");
const assert = require("node:assert/strict");
const {
  medicationsHandler,
  diagnosesHandler,
  symptomsHandler,
  adviceHandler,
  timelineHandler,
  summaryHandler,
} = require("../routes/repository");

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

const stubReports = [
  {
    _id: "r1",
    reportDate: new Date("2026-01-01"),
    documentType: "prescription",
    medications: [{ name: "Metformin" }],
    diagnoses: [{ condition: "Diabetes", status: "active" }],
    symptoms: [{ description: "Fatigue" }],
    doctorAdvice: ["Hydrate"],
    testsAdvised: ["HbA1c"],
  },
  {
    _id: "r2",
    reportDate: new Date("2026-06-01"),
    documentType: "lab_report",
    measurements: [{ name: "hemoglobin", value: 14 }],
  },
];

const req = { user: { id: stubUserId } };

test("medications handler returns deduped rollup", async () => {
  const res = createMockRes();
  await medicationsHandler(req, res, { findReports: async () => stubReports });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.medications[0].name, "Metformin");
});

test("diagnoses handler returns rollup", async () => {
  const res = createMockRes();
  await diagnosesHandler(req, res, { findReports: async () => stubReports });
  assert.equal(res.body.diagnoses[0].condition, "Diabetes");
});

test("symptoms handler returns rollup", async () => {
  const res = createMockRes();
  await symptomsHandler(req, res, { findReports: async () => stubReports });
  assert.equal(res.body.symptoms[0].description, "Fatigue");
});

test("advice handler returns rollup with advice and tests", async () => {
  const res = createMockRes();
  await adviceHandler(req, res, { findReports: async () => stubReports });
  assert.equal(res.body.advice.length, 2);
});

test("timeline handler returns chronological events", async () => {
  const res = createMockRes();
  await timelineHandler(req, res, { findReports: async () => stubReports });
  assert.equal(res.body.timeline.length, 2);
  assert.equal(res.body.timeline[0].id, "r2");
});

test("summary handler returns counts", async () => {
  const res = createMockRes();
  await summaryHandler(req, res, { findReports: async () => stubReports });
  assert.equal(res.body.summary.totalReports, 2);
  assert.equal(res.body.summary.medications, 1);
  assert.equal(res.body.summary.events, 2);
});

test("handlers return 500 when fetch fails", async () => {
  const res = createMockRes();
  await medicationsHandler(req, res, {
    findReports: async () => {
      throw new Error("Database connection lost");
    },
  });
  assert.equal(res.statusCode, 500);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /Failed to fetch medication history/);
});
