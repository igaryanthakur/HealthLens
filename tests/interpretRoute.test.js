const test = require("node:test");
const assert = require("node:assert/strict");
const { interpretHandler } = require("../routes/interpret");
const { filterClinicalData } = require("../services/clinicalFilterService");

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

const stubInterpretation = {
  summary: "Your hemoglobin is below the normal range.",
  findings: [
    {
      parameter: "Hemoglobin",
      status: "Low",
      explanation: "Hemoglobin carries oxygen in your blood.",
    },
  ],
  recommendations: ["Eat iron-rich foods like spinach and lentils."],
};

const stubReportId = "507f1f77bcf86cd799439011";
const stubUserId = "507f1f77bcf86cd799439099";

function createTestDeps(overrides = {}) {
  return {
    generateInterpretation: async () => stubInterpretation,
    saveReport: async () => ({ _id: stubReportId }),
    findUserById: async () => ({
      profile: {
        dateOfBirth: new Date("1990-01-15T00:00:00.000Z"),
        gender: "Female",
        heightCm: 165,
        weightKg: 60,
        chronicConditions: ["Hypertension"],
        lifestyle: {
          smokingStatus: "Never",
          alcoholConsumption: "None",
        },
      },
    }),
    ...overrides,
  };
}

test("interpret handler returns aiPrompt and data for valid structured body", async () => {
  const sample = [
    "Customer Since: 25/Apr/2026",
    "Haemoglobin (HB) : 8.6 g/dL 12-15",
  ].join("\n");
  const { structured } = filterClinicalData(sample, { ocrPages: [] });
  const res = createMockRes();
  let receivedProfileContext = null;

  await interpretHandler(
    { body: { structured }, user: { id: stubUserId } },
    res,
    createTestDeps({
      generateInterpretation: async (_aiPrompt, deps) => {
        receivedProfileContext = deps.profileContext;
        return stubInterpretation;
      },
    }),
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.aiPrompt.length > 100);
  assert.match(res.body.aiPrompt, /MEDICAL REPORT CONTEXT/);
  assert.match(res.body.aiPrompt, /Report Date: 2026-04-25/);
  assert.equal(res.body.data.summary, stubInterpretation.summary);
  assert.deepEqual(res.body.data.findings, stubInterpretation.findings);
  assert.deepEqual(res.body.data.recommendations, stubInterpretation.recommendations);
  assert.equal(res.body.reportId, stubReportId);
  assert.ok(receivedProfileContext);
  assert.match(receivedProfileContext, /Gender: Female/);
  assert.match(receivedProfileContext, /Chronic Conditions: Hypertension/);
});

test("interpret handler returns 500 when report save fails", async () => {
  const sample = ["Haemoglobin (HB) : 8.6 g/dL 12-15"].join("\n");
  const { structured } = filterClinicalData(sample, { ocrPages: [] });
  const res = createMockRes();

  await interpretHandler(
    { body: { structured }, user: { id: stubUserId } },
    res,
    createTestDeps({
      saveReport: async () => {
        throw new Error("Database connection lost");
      },
    }),
  );

  assert.equal(res.statusCode, 500);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /Database connection lost/);
});

test("interpret handler returns 400 when structured is missing", async () => {
  const res = createMockRes();

  await interpretHandler({ body: {} }, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
});

test("interpret handler returns 400 when measurements is not an array", async () => {
  const res = createMockRes();

  await interpretHandler({ body: { structured: { reportType: "CBC" } } }, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
});

test("interpret handler defaults documentType to lab_report when absent", async () => {
  const sample = ["Haemoglobin (HB) : 8.6 g/dL 12-15"].join("\n");
  const { structured } = filterClinicalData(sample, { ocrPages: [] });
  const res = createMockRes();
  let savedReport = null;

  await interpretHandler(
    { body: { structured }, user: { id: stubUserId } },
    res,
    createTestDeps({
      saveReport: async (doc) => {
        savedReport = doc;
        return { _id: stubReportId };
      },
    }),
  );

  assert.equal(res.statusCode, 200);
  assert.ok(savedReport);
  assert.equal(savedReport.documentType, "lab_report");
});

test("interpret handler persists explicit structured.documentType", async () => {
  const sample = ["Haemoglobin (HB) : 8.6 g/dL 12-15"].join("\n");
  const { structured } = filterClinicalData(sample, { ocrPages: [] });
  structured.documentType = "prescription";
  const res = createMockRes();
  let savedReport = null;

  await interpretHandler(
    { body: { structured }, user: { id: stubUserId } },
    res,
    createTestDeps({
      saveReport: async (doc) => {
        savedReport = doc;
        return { _id: stubReportId };
      },
    }),
  );

  assert.equal(res.statusCode, 200);
  assert.ok(savedReport);
  assert.equal(savedReport.documentType, "prescription");
});
