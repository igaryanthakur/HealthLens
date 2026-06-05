const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeUnit } = require("../utils/unitNormalizer");

test("normalizes g/dl to g/dL", () => {
  assert.equal(normalizeUnit("g/dl"), "g/dL");
});

test("normalizes mg % to mg/dL", () => {
  assert.equal(normalizeUnit("mg %"), "mg/dL");
});

test("returns null for unknown unit", () => {
  assert.equal(normalizeUnit("abc"), null);
});
