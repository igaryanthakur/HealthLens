const test = require("node:test");
const assert = require("node:assert/strict");
const { annotateMedications } = require("../services/prescriptionService");

test("annotateMedications flags drugs missing from the dictionary as uncertain", () => {
  const result = annotateMedications([
    { name: "Metformin", confidence: 0.9 },
    { name: "Zubrolax", confidence: 0.8 },
  ]);

  assert.equal(result[0].uncertain, false);
  assert.equal(result[0].dictionaryMatched, true);

  assert.equal(result[1].uncertain, true);
  assert.equal(result[1].dictionaryMatched, false);
  assert.ok(result[1].suggestion === null || typeof result[1].suggestion === "string");
});

test("annotateMedications preserves the model's own uncertainty flag", () => {
  // Known drug, but the model itself was unsure -> stays uncertain.
  const result = annotateMedications([{ name: "Metformin", uncertain: true }]);
  assert.equal(result[0].uncertain, true);
});

test("annotateMedications handles an empty list", () => {
  assert.deepEqual(annotateMedications([]), []);
  assert.deepEqual(annotateMedications(), []);
});
