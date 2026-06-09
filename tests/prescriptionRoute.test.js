const test = require("node:test");
const assert = require("node:assert/strict");
const { savePrescriptionHandler } = require("../routes/prescription");

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

const stubReportId = "507f1f77bcf86cd799439011";
const stubUserId = "507f1f77bcf86cd799439099";

test("saves a confirmed prescription as a Report with documentType prescription", async () => {
  const res = createMockRes();
  let savedReport = null;

  await savePrescriptionHandler(
    {
      user: { id: stubUserId },
      body: {
        medications: [
          { name: "Metformin", dosage: "500 mg", frequency: "BD", uncertain: false },
        ],
        diagnoses: [{ condition: "Type 2 Diabetes", status: "active" }],
        doctorAdvice: ["Reduce sugar intake"],
        testsAdvised: ["HbA1c in 3 months"],
      },
    },
    res,
    {
      saveReport: async (doc) => {
        savedReport = doc;
        return { _id: stubReportId };
      },
    },
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.reportId, stubReportId);
  assert.ok(savedReport);
  assert.equal(savedReport.documentType, "prescription");
  assert.equal(savedReport.measurements.length, 0);
  assert.equal(savedReport.medications[0].name, "Metformin");
  assert.equal(savedReport.diagnoses[0].condition, "Type 2 Diabetes");
  assert.ok(savedReport.aiInterpretation.summary.includes("1 medication"));
});

test("returns 400 when there is nothing to save", async () => {
  const res = createMockRes();

  await savePrescriptionHandler(
    { user: { id: stubUserId }, body: { medications: [], diagnoses: [] } },
    res,
    { saveReport: async () => ({ _id: stubReportId }) },
  );

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
});

test("drops blank medication names during sanitization", async () => {
  const res = createMockRes();
  let savedReport = null;

  await savePrescriptionHandler(
    {
      user: { id: stubUserId },
      body: {
        medications: [{ name: "  " }, { name: "Paracetamol" }],
      },
    },
    res,
    {
      saveReport: async (doc) => {
        savedReport = doc;
        return { _id: stubReportId };
      },
    },
  );

  assert.equal(res.statusCode, 200);
  assert.equal(savedReport.medications.length, 1);
  assert.equal(savedReport.medications[0].name, "Paracetamol");
});

test("returns 500 when the save fails", async () => {
  const res = createMockRes();

  await savePrescriptionHandler(
    {
      user: { id: stubUserId },
      body: { medications: [{ name: "Metformin" }] },
    },
    res,
    {
      saveReport: async () => {
        throw new Error("Database connection lost");
      },
    },
  );

  assert.equal(res.statusCode, 500);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /Database connection lost/);
});
