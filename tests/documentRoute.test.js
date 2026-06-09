const test = require("node:test");
const assert = require("node:assert/strict");
const { saveDocumentHandler } = require("../routes/prescription");

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

test("saves a discharge summary with documentType, symptoms and reportType", async () => {
  const res = createMockRes();
  let savedReport = null;

  await saveDocumentHandler(
    {
      user: { id: stubUserId },
      body: {
        documentType: "discharge_summary",
        medications: [{ name: "Aspirin" }],
        diagnoses: [{ condition: "MI", status: "resolved" }],
        symptoms: [{ description: "Chest pain" }],
        doctorAdvice: ["Cardiac rehab"],
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
  assert.equal(savedReport.documentType, "discharge_summary");
  assert.equal(savedReport.reportType, "DISCHARGE_SUMMARY");
  assert.equal(savedReport.symptoms[0].description, "Chest pain");
  assert.equal(savedReport.measurements.length, 0);
  assert.match(savedReport.aiInterpretation.summary, /Discharge summary/);
});

test("accepts a symptoms-only document", async () => {
  const res = createMockRes();
  let savedReport = null;

  await saveDocumentHandler(
    {
      user: { id: stubUserId },
      body: {
        documentType: "typed_note",
        symptoms: [{ description: "Fatigue" }],
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
  assert.equal(savedReport.symptoms.length, 1);
});

test("falls back to prescription for an unknown documentType value", async () => {
  const res = createMockRes();
  let savedReport = null;

  await saveDocumentHandler(
    {
      user: { id: stubUserId },
      body: {
        documentType: "not_a_real_type",
        medications: [{ name: "Paracetamol" }],
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

  assert.equal(savedReport.documentType, "prescription");
  assert.equal(savedReport.reportType, "PRESCRIPTION");
});

test("returns 400 when there is nothing to save", async () => {
  const res = createMockRes();

  await saveDocumentHandler(
    {
      user: { id: stubUserId },
      body: { documentType: "typed_note", medications: [], symptoms: [] },
    },
    res,
    { saveReport: async () => ({ _id: stubReportId }) },
  );

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
});
