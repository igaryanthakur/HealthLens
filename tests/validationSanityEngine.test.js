const test = require("node:test");
const assert = require("node:assert/strict");
const { validateValue } = require("../services/validationSanityEngine");

test("accepts plausible hemoglobin value", () => {
  const result = validateValue("cbc_hemoglobin", 8.6);
  assert.equal(result.ok, true);
});

test("rejects impossible hemoglobin value", () => {
  const result = validateValue("cbc_hemoglobin", 400);
  assert.equal(result.ok, false);
  assert.equal(result.validationError, true);
});
