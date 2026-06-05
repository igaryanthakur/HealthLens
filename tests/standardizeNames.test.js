const test = require("node:test");
const assert = require("node:assert/strict");
const { resolveCanonical } = require("../utils/standardizeNames");

test("resolves haemoglobin alias to canonical id", () => {
  const resolved = resolveCanonical("Haemoglobin");
  assert.equal(resolved.canonicalId, "cbc_hemoglobin");
  assert.equal(resolved.canonicalName, "hemoglobin");
});

test("resolves SGPT to liver alt canonical id", () => {
  const resolved = resolveCanonical("SGPT");
  assert.equal(resolved.canonicalId, "liver_alt");
});
