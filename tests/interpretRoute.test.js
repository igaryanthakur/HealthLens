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

test("interpret handler returns aiPrompt for valid structured body", () => {
  const sample = [
    "Customer Since: 25/Apr/2026",
    "Haemoglobin (HB) : 8.6 g/dL 12-15",
  ].join("\n");
  const { structured } = filterClinicalData(sample, { ocrPages: [] });
  const res = createMockRes();

  interpretHandler({ body: { structured } }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.aiPrompt.length > 100);
  assert.match(res.body.aiPrompt, /MEDICAL REPORT CONTEXT/);
  assert.match(res.body.aiPrompt, /Report Date: 2026-04-25/);
});

test("interpret handler returns 400 when structured is missing", () => {
  const res = createMockRes();

  interpretHandler({ body: {} }, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
});

test("interpret handler returns 400 when measurements is not an array", () => {
  const res = createMockRes();

  interpretHandler({ body: { structured: { reportType: "CBC" } } }, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
});
