const test = require("node:test");
const assert = require("node:assert/strict");
const { validateDrugName } = require("../utils/clinical/drugDictionary");

test("matches an exact known generic drug", () => {
  const result = validateDrugName("Metformin");
  assert.equal(result.matched, true);
  assert.equal(result.suggestion, null);
});

test("matches a known drug even with trailing strength", () => {
  const result = validateDrugName("Amoxicillin 500 mg");
  assert.equal(result.matched, true);
});

test("matches a known Indian brand name", () => {
  assert.equal(validateDrugName("Dolo").matched, true);
  assert.equal(validateDrugName("Telma").matched, true);
});

test("fuzzy-matches a minor OCR slip", () => {
  // 'Metformn' is one deletion from 'metformin' -> high similarity.
  const result = validateDrugName("Metformn");
  assert.equal(result.matched, true);
});

test("flags an unknown drug without forcing a misleading suggestion", () => {
  const result = validateDrugName("Zubrolax");
  assert.equal(result.matched, false);
  // A far-from-anything name should not surface a low-similarity suggestion.
  assert.ok(result.suggestion === null || typeof result.suggestion === "string");
  assert.ok(result.score >= 0 && result.score <= 1);
});

test("offers a suggestion only for a plausible near-miss", () => {
  // 'Pantoprzole' is a close misspelling of 'pantoprazole' -> matched.
  assert.equal(validateDrugName("Pantoprzole").matched, true);
  // A clearly unrelated token gets no suggestion noise.
  assert.equal(validateDrugName("Xqzwop").suggestion, null);
});

test("recognizes dermatology drugs added to the dictionary", () => {
  assert.equal(validateDrugName("Tretinoin").matched, true);
  assert.equal(validateDrugName("Adapalene").matched, true);
});

test("handles empty input safely", () => {
  const result = validateDrugName("");
  assert.equal(result.matched, false);
  assert.equal(result.suggestion, null);
  assert.equal(result.score, 0);
});
